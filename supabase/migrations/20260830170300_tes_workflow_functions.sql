-- Pipeline transitions, ported from the Firebase callables. All SECURITY
-- DEFINER: they're the only path that may move a record's stage, exactly as
-- the callables were the only path that used the Admin SDK. Each sets the
-- tes.workflow flag the guard trigger looks for, and clears it immediately
-- rather than leaving it set for the rest of the transaction.

-- Shared precondition check. Mirrors requireRole() in auth-helpers.ts:
-- signed in, profile exists, activated by an admin, and holding the role.
create or replace function public.require_role(p_role public.user_role)
returns public.profiles
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare me public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Sign in required.' using errcode = '28000';
  end if;

  select * into me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'No profile found for this account.' using errcode = 'no_data_found';
  end if;
  if not me.active then
    raise exception 'This account has not been activated yet. Ask an admin to activate it.'
      using errcode = 'insufficient_privilege';
  end if;
  if me.role <> p_role then
    raise exception 'This action requires the % role.', p_role
      using errcode = 'insufficient_privilege';
  end if;

  return me;
end;
$$;

-- Allocates the next TES number for the current year and creates the draft.
-- The upsert takes a row lock on the counter, so two employees hitting "New
-- TES" at once can't be handed the same number.
create or replace function public.create_draft_tes()
returns public.records
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  me       public.profiles;
  yr       int := extract(year from current_date)::int;
  next_seq int;
  rec      public.records;
begin
  me := public.require_role('employee');

  insert into public.tes_counter (year, seq) values (yr, 1)
  on conflict (year) do update set seq = tes_counter.seq + 1
  returning seq into next_seq;

  perform set_config('tes.workflow', 'on', true);
  insert into public.records (tes_no, employee_uid, employee_name, employee_id, department)
  values (
    format('TES-%s-%s', yr, lpad(next_seq::text, 4, '0')),
    me.id, me.name, me.employee_id, me.department
  )
  returning * into rec;
  perform set_config('tes.workflow', '', true);

  return rec;
end;
$$;

-- Employee submits a draft for approval. drive_* are supplied by the
-- submit-record Edge Function once the PDF is safely in Drive; passing them
-- null leaves the record's Drive fields untouched.
create or replace function public.submit_record(
  p_record_id      uuid,
  p_drive_file_id  text default null,
  p_drive_file_url text default null
)
returns public.records
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  me  public.profiles;
  rec public.records;
  n_expenses int;
begin
  me := public.require_role('employee');

  select * into rec from public.records where id = p_record_id;
  if not found then
    raise exception 'TES record not found.' using errcode = 'no_data_found';
  end if;
  if rec.employee_uid <> me.id then
    raise exception 'This TES belongs to another employee.' using errcode = 'insufficient_privilege';
  end if;
  if rec.stage <> 'draft' then
    raise exception 'Only a draft TES can be submitted.' using errcode = 'check_violation';
  end if;

  select count(*) into n_expenses from public.expenses where record_id = p_record_id;
  if n_expenses = 0 then
    raise exception 'Add at least one expense before submitting.' using errcode = 'check_violation';
  end if;

  perform set_config('tes.workflow', 'on', true);
  update public.records
     set stage           = 'submitted',
         submitted_date  = current_date,
         received_date   = current_date,
         rejected        = false,
         approver_comment = '',
         -- Re-stamp identity from the authenticated profile rather than
         -- whatever the client had cached, so a submitted record always
         -- reflects who actually submitted it.
         employee_name   = me.name,
         employee_id     = me.employee_id,
         department      = me.department,
         drive_file_id   = coalesce(p_drive_file_id, drive_file_id),
         drive_file_url  = coalesce(p_drive_file_url, drive_file_url)
   where id = p_record_id
   returning * into rec;
  perform set_config('tes.workflow', '', true);

  return rec;
end;
$$;

create or replace function public.approve_record(p_record_id uuid)
returns public.records
language plpgsql security definer set search_path = public, pg_temp
as $$
declare rec public.records;
begin
  perform public.require_role('approver');

  select * into rec from public.records where id = p_record_id;
  if not found then
    raise exception 'TES record not found.' using errcode = 'no_data_found';
  end if;
  if rec.stage <> 'submitted' then
    raise exception 'Only a submitted TES awaiting review can be approved.' using errcode = 'check_violation';
  end if;

  perform set_config('tes.workflow', 'on', true);
  update public.records
     set stage = 'approved', approved_date = current_date
   where id = p_record_id
   returning * into rec;
  perform set_config('tes.workflow', '', true);

  return rec;
end;
$$;

-- Sends it back to the employee as an editable draft: submission dates are
-- cleared so the app reopens it on the expenses screen rather than the
-- read-only status tracker.
create or replace function public.reject_record(p_record_id uuid, p_comment text)
returns public.records
language plpgsql security definer set search_path = public, pg_temp
as $$
declare rec public.records;
begin
  perform public.require_role('approver');

  if p_comment is null or btrim(p_comment) = '' then
    raise exception 'A comment describing what needs to change is required.' using errcode = 'check_violation';
  end if;

  select * into rec from public.records where id = p_record_id;
  if not found then
    raise exception 'TES record not found.' using errcode = 'no_data_found';
  end if;
  if rec.stage <> 'submitted' then
    raise exception 'Only a submitted TES awaiting review can be sent back.' using errcode = 'check_violation';
  end if;

  perform set_config('tes.workflow', 'on', true);
  update public.records
     set stage            = 'draft',
         submitted_date   = null,
         received_date    = null,
         rejected         = true,
         approver_comment = btrim(p_comment)
   where id = p_record_id
   returning * into rec;
  perform set_config('tes.workflow', '', true);

  return rec;
end;
$$;

-- Accounts records the settlement. Balance math matches settlement() in
-- packages/shared: whichever side is owed, floored at zero.
create or replace function public.finalize_accounts(
  p_record_id       uuid,
  p_expense_approved numeric,
  p_advance_date    date default null,
  p_drive_file_id   text default null,
  p_drive_file_url  text default null
)
returns public.records
language plpgsql security definer set search_path = public, pg_temp
as $$
declare rec public.records;
begin
  perform public.require_role('accounts');

  if p_expense_approved is null or p_expense_approved < 0 then
    raise exception 'Expense approved must be a non-negative amount.' using errcode = 'check_violation';
  end if;

  select * into rec from public.records where id = p_record_id;
  if not found then
    raise exception 'TES record not found.' using errcode = 'no_data_found';
  end if;
  if rec.stage <> 'approved' then
    raise exception 'Only a Dept-Head-approved TES can be finalized.' using errcode = 'check_violation';
  end if;

  perform set_config('tes.workflow', 'on', true);
  update public.records
     set stage              = 'accounts_entry',
         accounts_entry_date = current_date,
         advance_date       = coalesce(p_advance_date, current_date),
         expense_approved   = p_expense_approved,
         balance_employee   = greatest(p_expense_approved - advance_amount, 0),
         balance_company    = greatest(advance_amount - p_expense_approved, 0),
         drive_file_id      = coalesce(p_drive_file_id, drive_file_id),
         drive_file_url     = coalesce(p_drive_file_url, drive_file_url)
   where id = p_record_id
   returning * into rec;
  perform set_config('tes.workflow', '', true);

  return rec;
end;
$$;

-- One-time bootstrap so there's someone who can activate and role-assign
-- everyone else. Locks itself out permanently once any admin exists.
create or replace function public.bootstrap_first_admin()
returns public.profiles
language plpgsql security definer set search_path = public, pg_temp
as $$
declare me public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Sign in required.' using errcode = '28000';
  end if;
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An admin already exists — ask them to activate your account.'
      using errcode = 'check_violation';
  end if;

  update public.profiles
     set role = 'admin', active = true
   where id = auth.uid()
   returning * into me;

  if not found then
    raise exception 'Profile not ready yet — try again in a moment.' using errcode = 'no_data_found';
  end if;
  return me;
end;
$$;

-- Be explicit about who may call these rather than relying on the default
-- EXECUTE-to-PUBLIC grant.
revoke execute on function public.require_role(public.user_role) from public;
revoke execute on function public.create_draft_tes() from public;
revoke execute on function public.submit_record(uuid, text, text) from public;
revoke execute on function public.approve_record(uuid) from public;
revoke execute on function public.reject_record(uuid, text) from public;
revoke execute on function public.finalize_accounts(uuid, numeric, date, text, text) from public;
revoke execute on function public.bootstrap_first_admin() from public;

grant execute on function public.create_draft_tes() to authenticated;
grant execute on function public.submit_record(uuid, text, text) to authenticated;
grant execute on function public.approve_record(uuid) to authenticated;
grant execute on function public.reject_record(uuid, text) to authenticated;
grant execute on function public.finalize_accounts(uuid, numeric, date, text, text) to authenticated;
grant execute on function public.bootstrap_first_admin() to authenticated;
