/**
 * Postgres ⇄ domain mapping.
 *
 * Database columns are snake_case — Postgres convention, and exactly what
 * PostgREST hands back — while the domain types the screens are built on
 * are camelCase. Rather than rename one side to match the other, translate
 * in one place: the data layer is then the only code that knows both
 * spellings, and every component stays untouched.
 *
 * Deliberately free of any Supabase import, so `packages/shared` keeps
 * compiling for Node, the bundler and Metro alike.
 */

import type { Expense, ExpenseCategory, IsoDate, Role, Stage, TesRecord, UserProfile } from './types';

/** A Postgres `numeric` as it arrives over the wire. PostgREST normally
 *  renders it as a JSON number, but a driver or proxy may hand it back as
 *  a string, so accept both and coerce. */
type Numeric = number | string;

export interface ProfileRow {
  id: string;
  name: string;
  employee_id: string;
  email: string;
  department: string;
  role: Role;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordRow {
  id: string;
  tes_no: string;
  employee_uid: string;
  employee_name: string;
  employee_id: string;
  department: string;

  project_code: string;
  purpose: string;
  location: string;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  advance_amount: Numeric;

  expenses_total: Numeric;

  stage: Stage;
  submitted_date: IsoDate | null;
  received_date: IsoDate | null;
  approved_date: IsoDate | null;
  accounts_entry_date: IsoDate | null;

  advance_date: IsoDate | null;
  expense_approved: Numeric | null;
  balance_employee: Numeric | null;
  balance_company: Numeric | null;

  rejected: boolean;
  approver_comment: string;

  drive_file_id: string | null;
  drive_file_url: string | null;

  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: string;
  record_id: string;
  category: ExpenseCategory;
  expense_date: IsoDate;
  description: string;
  amount: Numeric;
  bill_no: string;
  remarks: string;
  receipt_path: string | null;
  created_at: string;
}

function num(v: Numeric | null | undefined): number {
  return Number(v ?? 0);
}

function numOrNull(v: Numeric | null | undefined): number | null {
  return v === null || v === undefined ? null : Number(v);
}

/** timestamptz → epoch ms, matching the `createdAt: number` domain fields. */
function ms(v: string | null | undefined): number {
  return v ? Date.parse(v) : 0;
}

export function toUserProfile(row: ProfileRow): UserProfile {
  return {
    uid: row.id,
    name: row.name,
    employeeId: row.employee_id,
    email: row.email,
    department: row.department,
    role: row.role,
    active: row.active,
    createdAt: ms(row.created_at),
  };
}

export function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    date: row.expense_date,
    description: row.description,
    amount: num(row.amount),
    billNo: row.bill_no,
    remarks: row.remarks,
    receiptPath: row.receipt_path,
    createdAt: ms(row.created_at),
  };
}

export function toTesRecord(row: RecordRow): TesRecord {
  return {
    id: row.id,
    tesNo: row.tes_no,
    employeeUid: row.employee_uid,
    employeeName: row.employee_name,
    employeeId: row.employee_id,
    department: row.department,

    projectCode: row.project_code,
    purpose: row.purpose,
    location: row.location,
    // The domain type models "not set yet" as '' so the date inputs can bind
    // to it directly; the column is nullable.
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    advanceAmount: num(row.advance_amount),

    expensesTotal: num(row.expenses_total),

    stage: row.stage,
    submittedDate: row.submitted_date,
    receivedDate: row.received_date,
    approvedDate: row.approved_date,
    accountsEntryDate: row.accounts_entry_date,

    advanceDate: row.advance_date,
    expenseApproved: numOrNull(row.expense_approved),
    balanceEmployee: numOrNull(row.balance_employee),
    balanceCompany: numOrNull(row.balance_company),

    rejected: row.rejected,
    approverComment: row.approver_comment,

    driveFileId: row.drive_file_id,
    driveFileUrl: row.drive_file_url,

    createdAt: ms(row.created_at),
    updatedAt: ms(row.updated_at),
  };
}

/** The trip-info fields an employee may edit on their own draft — the same
 *  six columns the `20260830170400` grant allows UPDATE on. Anything else
 *  is refused by Postgres before a trigger even runs. */
export interface TripInfoPatch {
  projectCode?: string;
  purpose?: string;
  location?: string;
  startDate?: IsoDate | '';
  endDate?: IsoDate | '';
  advanceAmount?: number;
}

export function tripInfoPatchToRow(patch: TripInfoPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.projectCode !== undefined) row.project_code = patch.projectCode;
  if (patch.purpose !== undefined) row.purpose = patch.purpose;
  if (patch.location !== undefined) row.location = patch.location;
  // '' is how the UI spells "cleared"; the column is a nullable date, and
  // Postgres rejects '' as a date literal.
  if (patch.startDate !== undefined) row.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) row.end_date = patch.endDate || null;
  if (patch.advanceAmount !== undefined) row.advance_amount = patch.advanceAmount;
  return row;
}

/** The columns an admin may edit on a profile. `role` and `active` are
 *  additionally gated by the guard_profile_privileges trigger, which is
 *  what actually enforces admin-only — the grant can't tell admins apart,
 *  since everyone signs in through the same `authenticated` role. */
export interface ProfilePatch {
  name?: string;
  employeeId?: string;
  department?: string;
  role?: Role;
  active?: boolean;
}

export function profilePatchToRow(patch: ProfilePatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.employeeId !== undefined) row.employee_id = patch.employeeId;
  if (patch.department !== undefined) row.department = patch.department;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.active !== undefined) row.active = patch.active;
  return row;
}

export interface NewExpenseInput {
  category: ExpenseCategory;
  date: IsoDate;
  description: string;
  amount: number;
  billNo: string;
  remarks: string;
}

export function newExpenseToRow(recordId: string, input: NewExpenseInput): Record<string, unknown> {
  return {
    record_id: recordId,
    category: input.category,
    expense_date: input.date,
    description: input.description,
    amount: input.amount,
    bill_no: input.billNo,
    remarks: input.remarks,
  };
}
