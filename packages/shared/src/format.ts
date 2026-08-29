import type { Expense, IsoDate, Stage } from './types';

export function fmtMoney(n: number | null | undefined): string {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}

export function fmtDate(iso: IsoDate | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtPeriod(start: IsoDate | null | undefined, end: IsoDate | null | undefined): string {
  if (!start && !end) return '—';
  if (start && !end) return fmtDate(start);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export function todayIso(): IsoDate {
  return new Date().toISOString().slice(0, 10);
}

export function totalOf(expenses: Pick<Expense, 'amount'>[]): number {
  return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

export const STAGE_LABEL: Record<Stage, string> = {
  draft: 'Draft',
  submitted: 'Pending Approval',
  approved: 'Pending Accounts',
  accounts_entry: 'Settled',
};

export const STAGE_TAG_CLASS: Record<Stage, string> = {
  draft: 'tag-neutral',
  submitted: 'tag-outline',
  approved: 'tag-outline',
  accounts_entry: 'tag-accent',
};
