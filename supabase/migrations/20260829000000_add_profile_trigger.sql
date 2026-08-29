-- Migration to create trigger for new users and add email to profiles

-- 1. Add email column to profiles if requested by user metadata requirements
alter table public.profiles add column if not exists email text;

-- 2. Create function to handle new user insertion
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous User'),
    'donor'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
