-- Provision a profile the moment someone signs up, mirroring the Firebase
-- onUserCreate trigger. Always unprivileged: an admin promotes and
-- activates from the Admin console afterwards.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;  -- never clobber a profile that already exists
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep records.expenses_total in step with the line items. The records
-- guard trigger freezes expenses_total against direct writes, so flag this
-- as workflow-owned for the duration of the update and clear it straight
-- after, rather than leaving the escape hatch open for the rest of the
-- transaction.
create or replace function public.sync_expenses_total()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  target_record uuid := coalesce(new.record_id, old.record_id);
begin
  perform set_config('tes.workflow', 'on', true);

  update public.records r
     set expenses_total = coalesce(
       (select sum(e.amount) from public.expenses e where e.record_id = target_record), 0
     )
   where r.id = target_record;

  perform set_config('tes.workflow', '', true);
  return coalesce(new, old);
end;
$$;

create trigger expenses_sync_total
  after insert or update or delete on public.expenses
  for each row execute function public.sync_expenses_total();
