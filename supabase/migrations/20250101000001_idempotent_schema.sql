-- Idempotent schema: safe to run even if types/tables already exist
set search_path to public, extensions;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('donor', 'requester', 'hospital', 'admin');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'blood_group') then
    create type blood_group as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'urgency_level') then
    create type urgency_level as enum ('critical', 'moderate', 'routine');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum ('searching', 'matched', 'fulfilled', 'cancelled', 'expired');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'donation_status') then
    create type donation_status as enum ('pending', 'confirmed', 'cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'alert_preference') then
    create type alert_preference as enum ('app', 'sms', 'both');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum ('alert', 'system', 'reminder', 'success');
  end if;
end $$;

-- Tables
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  blood_group   blood_group,
  role          user_role not null default 'donor',
  date_of_birth date,
  avatar_url    text,
  address       text,
  location      geography(Point, 4326),
  is_available  boolean not null default true,
  last_donation date,
  cooldown_ends_at date generated always as (last_donation + interval '56 days') stored,
  alert_preference alert_preference not null default 'both',
  emergency_contact_name  text,
  emergency_contact_phone text,
  fcm_token     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists hospitals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  location    geography(Point, 4326),
  type        text default 'Hospital',
  created_at  timestamptz not null default now()
);

create table if not exists blood_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid references profiles(id) on delete cascade,
  hospital_id     uuid references hospitals(id),
  hospital_name   text not null,
  hospital_location geography(Point, 4326),
  blood_group     blood_group not null,
  units_needed    int not null default 1,
  urgency         urgency_level not null default 'critical',
  patient_name    text,
  notes           text,
  status          request_status not null default 'searching',
  sms_enabled     boolean not null default false,
  alert_radius_km int not null default 10,
  donors_pinged   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '4 hours')
);

create table if not exists donations (
  id              uuid primary key default gen_random_uuid(),
  donor_id        uuid references profiles(id) on delete cascade,
  request_id      uuid references blood_requests(id),
  hospital_id     uuid references hospitals(id),
  hospital_name   text,
  units_donated   int not null default 1,
  status          donation_status not null default 'pending',
  proof_url       text,
  feedback        text,
  donated_at      timestamptz not null default now(),
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists donor_responses (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references blood_requests(id) on delete cascade,
  donor_id    uuid references profiles(id) on delete cascade,
  response    text not null default 'pending',
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (request_id, donor_id)
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        notification_type not null default 'system',
  title       text not null,
  body        text,
  data        jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists blood_inventory (
  id          uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  blood_group blood_group not null,
  units       int not null default 0,
  updated_at  timestamptz not null default now(),
  unique (hospital_id, blood_group)
);

-- Indexes (IF NOT EXISTS for indexes requires PG 9.5+)
create index if not exists profiles_location_idx on profiles using gist(location);
create index if not exists hospitals_location_idx on hospitals using gist(location);
create index if not exists blood_requests_hospital_location_idx on blood_requests using gist(hospital_location);
create index if not exists blood_requests_status_idx on blood_requests(status);
create index if not exists blood_requests_blood_group_idx on blood_requests(blood_group);
create index if not exists donations_donor_id_idx on donations(donor_id);
create index if not exists notifications_user_id_idx on notifications(user_id, created_at desc);
create index if not exists donor_responses_request_id_idx on donor_responses(request_id);

-- RLS
alter table profiles         enable row level security;
alter table blood_requests   enable row level security;
alter table donations        enable row level security;
alter table donor_responses  enable row level security;
alter table notifications    enable row level security;
alter table hospitals        enable row level security;
alter table blood_inventory  enable row level security;

-- RLS Policies (drop and recreate to be idempotent)
drop policy if exists "Profiles are viewable by all authenticated users" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Blood requests are viewable by authenticated users" on blood_requests;
drop policy if exists "Requesters can create blood requests" on blood_requests;
drop policy if exists "Requesters can update their own requests" on blood_requests;
drop policy if exists "Donors can view their own donations" on donations;
drop policy if exists "Donors can create donations" on donations;
drop policy if exists "Users can read their own notifications" on notifications;
drop policy if exists "Users can update their own notifications (mark read)" on notifications;
drop policy if exists "Hospitals are viewable by all authenticated users" on hospitals;
drop policy if exists "Blood inventory viewable by all authenticated users" on blood_inventory;
drop policy if exists "Donors can manage their responses" on donor_responses;

create policy "Profiles are viewable by all authenticated users" on profiles for select to authenticated using (true);
create policy "Users can update their own profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "Blood requests are viewable by authenticated users" on blood_requests for select to authenticated using (true);
create policy "Requesters can create blood requests" on blood_requests for insert to authenticated with check (auth.uid() = requester_id);
create policy "Requesters can update their own requests" on blood_requests for update to authenticated using (auth.uid() = requester_id);
create policy "Donors can view their own donations" on donations for select to authenticated using (auth.uid() = donor_id);
create policy "Donors can create donations" on donations for insert to authenticated with check (auth.uid() = donor_id);
create policy "Users can read their own notifications" on notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users can update their own notifications (mark read)" on notifications for update to authenticated using (auth.uid() = user_id);
create policy "Hospitals are viewable by all authenticated users" on hospitals for select to authenticated using (true);
create policy "Blood inventory viewable by all authenticated users" on blood_inventory for select to authenticated using (true);
create policy "Donors can manage their responses" on donor_responses for all to authenticated using (auth.uid() = donor_id);

-- Functions (use create or replace)
create or replace function find_nearby_donors(
  request_lat  float8,
  request_lng  float8,
  blood_grp    blood_group,
  radius_km    int default 10
)
returns table(
  id uuid,
  full_name text,
  phone text,
  distance_km float8,
  fcm_token text,
  alert_preference alert_preference
)
language sql stable
as $$
  select
    p.id,
    p.full_name,
    p.phone,
    round((st_distance(p.location, st_point(request_lng, request_lat)::geography) / 1000)::numeric, 2) as distance_km,
    p.fcm_token,
    p.alert_preference
  from profiles p
  where
    p.role = 'donor'
    and p.is_available = true
    and p.blood_group = blood_grp
    and (p.last_donation is null or p.last_donation < now() - interval '56 days')
    and st_dwithin(
      p.location,
      st_point(request_lng, request_lat)::geography,
      radius_km * 1000
    )
  order by distance_km asc;
$$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function update_last_donation()
returns trigger language plpgsql as $$
begin
  if new.status = 'confirmed' and old.status != 'confirmed' then
    update profiles
    set last_donation = new.donated_at::date,
        is_available  = false
    where id = new.donor_id;
  end if;
  return new;
end;
$$;

-- Triggers (drop and recreate)
drop trigger if exists profiles_updated_at on profiles;
drop trigger if exists blood_requests_updated_at on blood_requests;
drop trigger if exists donation_confirmed on donations;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger blood_requests_updated_at before update on blood_requests
  for each row execute function set_updated_at();

create trigger donation_confirmed after update on donations
  for each row execute function update_last_donation();
