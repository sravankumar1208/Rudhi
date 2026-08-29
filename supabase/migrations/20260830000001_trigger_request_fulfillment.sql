-- Create a trigger function to automatically update blood_requests when a donation is logged
create or replace function public.update_blood_request_on_donation()
returns trigger
language plpgsql
security definer
as $$
declare
  current_units int;
  new_units int;
begin
  if tg_op = 'INSERT' then
    select units_needed into current_units
    from public.blood_requests
    where id = new.request_id;

    if current_units is not null then
      new_units := greatest(0, current_units - new.units_donated);
      
      update public.blood_requests
      set units_needed = new_units,
          status = case when new_units <= 0 then 'fulfilled'::request_status else 'searching'::request_status end,
          updated_at = now()
      where id = new.request_id;
    end if;
  end if;
  
  return new;
end;
$$;

-- Attach the trigger to the donations table
drop trigger if exists on_donation_logged on public.donations;
create trigger on_donation_logged
  after insert on public.donations
  for each row execute procedure public.update_blood_request_on_donation();
