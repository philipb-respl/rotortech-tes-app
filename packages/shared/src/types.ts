export type Role = 'employee' | 'approver' | 'accounts' | 'admin';

export type Stage = 'draft' | 'submitted' | 'approved' | 'accounts_entry';

export const EXPENSE_CATEGORIES = [
  'Travel Fare',
  'Lodging',
  'Boarding',
  'Conveyance',
  'Other Expenses',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** ISO date string, 'YYYY-MM-DD'. */
export type IsoDate = string;

export interface UserProfile {
  uid: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  role: Role;
  /** Admin-controlled gate — a freshly self-registered account is inactive
   *  until an admin assigns a role and flips this on. */
  active: boolean;
  createdAt: number;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  date: IsoDate;
  description: string;
  amount: number;
  billNo: string;
  remarks: string;
  /** Cloud Storage path, e.g. receipts/{recordId}/{expenseId}/photo.jpg */
  receiptPath: string | null;
  createdAt: number;
}

export interface TesRecord {
  id: string;
  tesNo: string;
  employeeUid: string;
  employeeName: string;
  employeeId: string;
  department: string;

  projectCode: string;
  purpose: string;
  location: string;
  startDate: IsoDate | '';
  endDate: IsoDate | '';
  advanceAmount: number;

  /** Denormalized sum of the expenses subcollection, kept in sync by the
   *  onExpenseWrite Cloud Function trigger — lets list views (queues,
   *  dashboards) show a total without fetching every record's expenses. */
  expensesTotal: number;

  stage: Stage;
  submittedDate: IsoDate | null;
  receivedDate: IsoDate | null;
  approvedDate: IsoDate | null;
  accountsEntryDate: IsoDate | null;

  advanceDate: IsoDate | null;
  expenseApproved: number | null;
  balanceEmployee: number | null;
  balanceCompany: number | null;

  rejected: boolean;
  approverComment: string;

  /** Set by the finalize/submit Cloud Functions after the Drive upload. */
  driveFileId: string | null;
  driveFileUrl: string | null;

  createdAt: number;
  updatedAt: number;
}

/** A TesRecord together with its expenses subcollection, as read by clients. */
export interface TesRecordWithExpenses extends TesRecord {
  expenses: Expense[];
}
