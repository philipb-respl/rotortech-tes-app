-- Rotortech TES — core schema.
-- Ported from the Firestore model: users -> profiles, records -> records,
-- records/{id}/expenses subcollection -> expenses (FK), meta/tesCounter ->
-- tes_counter.

create type public.user_role as enum ('employee', 'approver', 'accounts', 'admin');
create type public.tes_stage as enum ('draft', 'submitted', 'approved', 'accounts_entry');
create type public.expense_category as enum (
  'Travel Fare', 'Lodging', 'Boarding', 'Conveyance', 'Other Expenses'
);

-- One row per Auth user. Provisioned by the on_auth_user_created trigger;
-- everyone starts inactive until an admin assigns a role and activates.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  employee_id text not null default '',
  email       text not null default '',
  department  text not null default '',
  role        public.user_role not null default 'employee',
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.records (
  id            uuid primary key default gen_random_uuid(),
  tes_no        text not null unique,
  employee_uid  uuid not null references public.profiles (id) on delete restrict,
  -- Denormalized at submit time so an approver's view of who filed a TES
  -- can't shift under them if the profile is later edited.
  employee_name text not null default '',
  employee_id   text not null default '',
  department    text not null default '',

  project_code  text not null default '',
  purpose       text not null default '',
  location      text not null default '',
  start_date    date,
  end_date      date,
  advance_amount numeric(12,2) not null default 0 check (advance_amount >= 0),

  -- Kept in sync by the expenses trigger; lets queue/list views show a
  -- total without joining every line item.
  expenses_total numeric(12,2) not null default 0,

  stage              public.tes_stage not null default 'draft',
  submitted_date     date,
  received_date      date,
  approved_date      date,
  accounts_entry_date date,

  advance_date      date,
  expense_approved  numeric(12,2) check (expense_approved is null or expense_approved >= 0),
  balance_employee  numeric(12,2),
  balance_company   numeric(12,2),

  rejected         boolean not null default false,
  approver_comment text not null default '',

  drive_file_id  text,
  drive_file_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  record_id    uuid not null references public.records (id) on delete cascade,
  category     public.expense_category not null,
  expense_date date not null,
  description  text not null default '',
  amount       numeric(12,2) not null check (amount > 0),
  bill_no      text not null default '',
  remarks      text not null default '',
  receipt_path text,
  created_at   timestamptz not null default now()
);

-- Sequential TES numbering, allocated under a row lock so two concurrent
-- submissions can't collide on the same number.
create table public.tes_counter (
  year int primary key,
  seq  int not null check (seq >= 0)
);

create index records_employee_uid_created_at_idx on public.records (employee_uid, created_at desc);
create index records_stage_updated_at_idx        on public.records (stage, updated_at desc);
create index expenses_record_id_date_idx         on public.expenses (record_id, expense_date);
