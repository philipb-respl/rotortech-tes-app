// Explicit named re-exports (rather than `export *`) — TypeScript compiles
// these to static per-name bindings that bundlers (Vite/Rollup) can
// statically analyze; a dynamic `export *` loop through a CommonJS build
// defeats that analysis and named imports silently fail to resolve.

export type { Role, Stage, ExpenseCategory, IsoDate, UserProfile, Expense, TesRecord, TesRecordWithExpenses } from './types';
export { EXPENSE_CATEGORIES } from './types';

export { fmtMoney, fmtDate, fmtPeriod, todayIso, totalOf, STAGE_LABEL, STAGE_TAG_CLASS } from './format';

export type { CategoryTotal, StatusStep } from './business';
export { stageFromDates, categoryTotals, statusSteps, settlement, formatTesNo, drivePdfPath } from './business';

export type { SeedUser, SeedExpense, SeedRecord } from './seed-data';
export { SEED_USERS, SEED_RECORDS, SEED_NEXT_TES_SEQUENCE, SEED_TES_YEAR } from './seed-data';
