import { EXPENSE_CATEGORIES } from './types';
import type { Expense, IsoDate, Stage, TesRecord } from './types';
import { fmtDate, fmtMoney } from './format';

/** Derives the pipeline stage from the dates on a record. Cloud Functions
 *  store `stage` explicitly (so Firestore rules can gate on it cheaply),
 *  but this stays the single source of truth for what those dates mean —
 *  used by the seed script and by tests to keep the two in sync. */
export function stageFromDates(rec: Pick<TesRecord, 'accountsEntryDate' | 'approvedDate' | 'submittedDate'>): Stage {
  if (rec.accountsEntryDate) return 'accounts_entry';
  if (rec.approvedDate) return 'approved';
  if (rec.submittedDate) return 'submitted';
  return 'draft';
}

export interface CategoryTotal {
  label: string;
  amount: number;
  amountFmt: string;
}

export function categoryTotals(expenses: Pick<Expense, 'category' | 'amount'>[]): CategoryTotal[] {
  return EXPENSE_CATEGORIES.map((label) => {
    const amount = expenses
      .filter((e) => e.category === label)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { label, amount, amountFmt: fmtMoney(amount) };
  });
}

export interface StatusStep {
  label: string;
  date: IsoDate | null;
  done: boolean;
  dateFmt: string;
}

export function statusSteps(rec: Pick<TesRecord, 'submittedDate' | 'receivedDate' | 'approvedDate' | 'accountsEntryDate'>): StatusStep[] {
  return [
    { label: 'Submitted', date: rec.submittedDate },
    { label: 'Received', date: rec.receivedDate },
    { label: 'Approved', date: rec.approvedDate },
    { label: 'Accounts Entry', date: rec.accountsEntryDate },
  ].map((s) => ({ ...s, done: !!s.date, dateFmt: s.date ? fmtDate(s.date) : 'Pending' }));
}

/** Advance vs. approved-expense settlement math, exactly as the prototype's
 *  Accounts screen computes it live while the form is filled in. */
export function settlement(advanceAmount: number, expenseApproved: number) {
  const advance = Number(advanceAmount) || 0;
  const approved = Number(expenseApproved) || 0;
  return {
    balanceEmployee: Math.max(approved - advance, 0),
    balanceCompany: Math.max(advance - approved, 0),
  };
}

/** e.g. "TES-2026-0142" */
export function formatTesNo(year: number, sequence: number): string {
  return `TES-${year}-${String(sequence).padStart(4, '0')}`;
}

/** The Drive path a submitted/finalized TES's PDF summary is saved to,
 *  matching the path shown in the prototype's confirmation toast. */
export function drivePdfPath(year: number, employeeName: string, tesNo: string): string {
  return `Rotortech Energy Solutions/Travel Expense Settlements/${year}/${employeeName}/${tesNo}.pdf`;
}

