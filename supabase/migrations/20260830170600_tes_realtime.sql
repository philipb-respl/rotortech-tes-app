-- Publish the TES tables on the Realtime replication slot, so the web and
-- mobile clients get live queues instead of polling. Realtime applies the
-- same RLS policies to postgres_changes as PostgREST does to a select, so
-- this widens delivery, not visibility.
--
-- The clients treat every event as "something moved" and re-read through
-- PostgREST rather than patching state from the payload — DELETE payloads
-- carry only the primary key, and a row that leaves a filtered set
-- produces no event for the set it left.

-- Supabase provisions `supabase_realtime` on every project, but a
-- from-scratch local database (supabase db reset against a bare Postgres)
-- may not have it yet.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

-- `alter publication … add table` errors if the table is already a member,
-- so check first and keep this migration re-runnable.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'records', 'expenses'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
