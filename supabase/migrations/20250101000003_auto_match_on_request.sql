-- Auto-match donors + send alert notifications on every new blood request.
-- Uses a lightweight trigger for donor-accepted notifications (fast, one row).
-- Matching on new-request is done async via the match-donors Edge Function
-- so the form submission doesn't block.

-- Add receiver_location column if it was missed in the initial schema
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'blood_requests' and column_name = 'receiver_location'
  ) then
    alter table blood_requests add column receiver_location geography(Point, 4326);
  end if;
end $$;

-- ── Notify requester when a donor accepts ──────────────────────────

create or replace function handle_donor_accepted()
returns trigger
language plpgsql
security definer
as $$
declare
  req_record record;
begin
  -- Only fire when response changes TO 'accepted'
  if new.response = 'accepted' and (old is null or old.response != 'accepted') then
    select requester_id, blood_group, units_needed, hospital_name
    into req_record
    from blood_requests
    where id = new.request_id;

    if found then
      insert into notifications (user_id, type, title, body, data)
      values (
        req_record.requester_id,
        'alert',
        'Donor Found!',
        'A donor has accepted your request for '
          || req_record.units_needed || ' unit(s) of ' || req_record.blood_group
          || ' at ' || req_record.hospital_name || '. They are on their way!',
        jsonb_build_object(
          'request_id', new.request_id,
          'donor_id',    new.donor_id,
          'donor_status','accepted'
        )
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_donor_accepted on donor_responses;

create trigger on_donor_accepted
  after insert or update on donor_responses
  for each row
  execute function handle_donor_accepted();

-- ── Find hospitals near a location (returns distance in km) ─────────

create or replace function find_nearby_hospitals(
  lat       float8,
  lng       float8,
  radius_km int default 50
)
returns table(
  id         uuid,
  name       text,
  address    text,
  phone      text,
  type       text,
  location   jsonb,
  distance_km float8
)
language sql stable
as $$
  select
    h.id,
    h.name,
    h.address,
    h.phone,
    h.type,
    st_asgeojson(h.location)::jsonb as location,
    round(
      (st_distance(h.location, st_point(lng, lat)::geography) / 1000)::numeric, 2
    ) as distance_km
  from hospitals h
  where h.location is not null
    and st_dwithin(
      h.location,
      st_point(lng, lat)::geography,
      radius_km * 1000
    )
  order by distance_km asc;
$$;
