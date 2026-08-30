-- Helper accessors. SECURITY DEFINER so they bypass RLS on profiles —
-- without that, a policy on profiles that reads profiles recurses forever.
-- search_path pinned so a caller can't shadow `public` with their own
-- schema and redirect these lookups.
create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = public, pg_temp
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.auth_is_active()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select coalesce((select active from public.profiles where id = auth.uid()), false) $$;

-- Roles that oversee the pipeline and may see everyone's submitted work.
create or replace function public.auth_is_reviewer()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select public.auth_is_active() and public.auth_role() in ('approver', 'accounts', 'admin') $$;

create or replace function public.auth_is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select public.auth_is_active() and public.auth_role() = 'admin' $$;

alter table public.profiles    enable row level security;
alter table public.records     enable row level security;
alter table public.expenses    enable row level security;
alter table public.tes_counter enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────
-- A brand-new (still inactive) account can read its own row so the app can
-- show the "pending activation" screen.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.auth_is_active());

-- Rows are created only by the on_auth_user_created trigger (SECURITY
-- DEFINER, bypasses RLS) — never by a client. No insert policy at all.

create policy profiles_update on public.profiles for update to authenticated
  using (public.auth_is_admin() or id = auth.uid())
  with check (public.auth_is_admin() or id = auth.uid());

create policy profiles_delete on public.profiles for delete to authenticated
  using (public.auth_is_admin());

-- RLS can gate *which rows* you may update but not *which columns*, so the
-- privilege fields are protected here: only an admin may change role or
-- active, no matter which row.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and not public.auth_is_admin() then
    raise exception 'Only an admin can change a profile''s role or active state'
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ── records ─────────────────────────────────────────────────────────────
create policy records_select on public.records for select to authenticated
  using (
    employee_uid = auth.uid()
    or (public.auth_is_reviewer() and stage <> 'draft')
  );

-- Created only by create_draft_tes() so TES numbering stays atomic.
-- No insert policy.

create policy records_update on public.records for update to authenticated
  using (employee_uid = auth.uid() and stage = 'draft')
  with check (employee_uid = auth.uid() and stage = 'draft');

create policy records_delete on public.records for delete to authenticated
  using (employee_uid = auth.uid() and stage = 'draft');

-- Same column-level concern as profiles: an employee editing their draft
-- must not be able to move it through the pipeline by hand. Every
-- stage/settlement field is frozen against direct client writes; the
-- workflow functions are SECURITY DEFINER and so skip this trigger's
-- auth checks via a session flag set only inside them.
create or replace function public.guard_record_pipeline_fields()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('tes.workflow', true), '') = 'on' then
    new.updated_at := now();
    return new;
  end if;

  if new.tes_no             is distinct from old.tes_no
     or new.employee_uid    is distinct from old.employee_uid
     or new.stage           is distinct from old.stage
     or new.submitted_date  is distinct from old.submitted_date
     or new.received_date   is distinct from old.received_date
     or new.approved_date   is distinct from old.approved_date
     or new.accounts_entry_date is distinct from old.accounts_entry_date
     or new.advance_date    is distinct from old.advance_date
     or new.expense_approved is distinct from old.expense_approved
     or new.balance_employee is distinct from old.balance_employee
     or new.balance_company  is distinct from old.balance_company
     or new.rejected        is distinct from old.rejected
     or new.approver_comment is distinct from old.approver_comment
     or new.drive_file_id   is distinct from old.drive_file_id
     or new.drive_file_url  is distinct from old.drive_file_url
     or new.expenses_total  is distinct from old.expenses_total
  then
    raise exception 'Pipeline fields are managed by the TES workflow functions, not direct writes'
      using errcode = 'check_violation';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger records_guard_pipeline_fields
  before update on public.records
  for each row execute function public.guard_record_pipeline_fields();

-- ── expenses ────────────────────────────────────────────────────────────
create policy expenses_select on public.expenses for select to authenticated
  using (exists (
    select 1 from public.records r
    where r.id = expenses.record_id
      and (r.employee_uid = auth.uid() or (public.auth_is_reviewer() and r.stage <> 'draft'))
  ));

create policy expenses_write on public.expenses for all to authenticated
  using (exists (
    select 1 from public.records r
    where r.id = expenses.record_id and r.employee_uid = auth.uid() and r.stage = 'draft'
  ))
  with check (exists (
    select 1 from public.records r
    where r.id = expenses.record_id and r.employee_uid = auth.uid() and r.stage = 'draft'
  ));

-- ── tes_counter ─────────────────────────────────────────────────────────
-- RLS on with zero policies: unreachable by any client. Only the
-- SECURITY DEFINER numbering function touches it.
