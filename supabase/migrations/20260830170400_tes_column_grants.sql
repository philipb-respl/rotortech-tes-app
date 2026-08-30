-- Defence in depth over the guard triggers. The triggers give friendly
-- errors; these grants make the restriction structural — Postgres rejects
-- the statement before any trigger runs, and a bug in a trigger can't open
-- the door. Supabase grants ALL on public tables to `authenticated` by
-- default, so narrow UPDATE down to the columns each role legitimately
-- edits.
--
-- The SECURITY DEFINER workflow functions run as the function owner, not
-- `authenticated`, so they are unaffected by any of this.

-- records: an employee edits only the trip-info fields of their own draft.
-- Everything else (stage, dates, settlement, Drive ids, expenses_total) is
-- writable exclusively through the workflow functions and triggers.
revoke update on public.records from authenticated;
grant update (project_code, purpose, location, start_date, end_date, advance_amount)
  on public.records to authenticated;

-- profiles: id and created_at are immutable from the client. role/active
-- still need the guard trigger rather than a grant, because admins edit
-- them through the very same `authenticated` role as everyone else.
revoke update on public.profiles from authenticated;
grant update (name, employee_id, department, role, active)
  on public.profiles to authenticated;

-- expenses stay fully client-writable; the RLS policy already scopes them
-- to line items on the caller's own draft.
