-- Enable real-time for all tables used by the app
-- Idempotent: safe to run even if tables are already in the publication

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'blood_requests'
  ) then
    alter publication supabase_realtime add table blood_requests;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'donor_responses'
  ) then
    alter publication supabase_realtime add table donor_responses;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and c.relname = 'donations'
  ) then
    alter publication supabase_realtime add table donations;
  end if;
end;
$$;

alter table blood_requests replica identity full;
alter table donor_responses replica identity full;
alter table notifications replica identity full;
alter table donations replica identity full;
