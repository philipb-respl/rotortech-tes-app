import type { Role } from './types';

/** Demo directory + starting TES records, ported 1:1 from the Claude Design
 *  prototype's `seedRecords()` / admin user list, for local dev and the
 *  Firebase emulator. Passwords are dev-only (see docs/SETUP.md). */

export interface SeedUser {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  department: string;
  role: Role;
  active: boolean;
}

export const SEED_USERS: SeedUser[] = [
  { email: 'anil.kumar@rotortech.in', password: 'rotortech-dev', name: 'Anil Kumar', employeeId: 'RES-0142', department: 'Wind O&M', role: 'employee', active: true },
  { email: 'priya.nair@rotortech.in', password: 'rotortech-dev', name: 'Priya Nair', employeeId: 'RES-0187', department: 'Wind O&M', role: 'employee', active: true },
  { email: 'suresh.babu@rotortech.in', password: 'rotortech-dev', name: 'Suresh Babu', employeeId: 'RES-0203', department: 'Site Services', role: 'employee', active: true },
  { email: 'vikram.shah@rotortech.in', password: 'rotortech-dev', name: 'Vikram Shah', employeeId: 'RES-0050', department: 'Wind O&M', role: 'approver', active: true },
  { email: 'meera.joshi@rotortech.in', password: 'rotortech-dev', name: 'Meera Joshi', employeeId: 'RES-0022', department: 'Finance', role: 'accounts', active: true },
  { email: 'rohit.sinha@rotortech.in', password: 'rotortech-dev', name: 'Rohit Sinha', employeeId: 'RES-0005', department: 'IT', role: 'admin', active: true },
];

export interface SeedExpense {
  category: string;
  date: string;
  description: string;
  amount: number;
  billNo: string;
  remarks: string;
}

export interface SeedRecord {
  tesNo: string;
  employeeEmail: string;
  projectCode: string;
  purpose: string;
  location: string;
  startDate: string;
  endDate: string;
  advanceAmount: number;
  submittedDate: string | null;
  receivedDate: string | null;
  approvedDate: string | null;
  accountsEntryDate: string | null;
  advanceDate: string | null;
  expenseApproved: number | null;
  balanceEmployee: number | null;
  balanceCompany: number | null;
  rejected: boolean;
  approverComment: string;
  expenses: SeedExpense[];
}

export const SEED_RECORDS: SeedRecord[] = [
  {
    tesNo: 'TES-2026-0142', employeeEmail: 'anil.kumar@rotortech.in', projectCode: 'PRJ-WF-14',
    purpose: 'Site visit — blade inspection, Kutch Wind Farm', location: 'Kutch, Gujarat',
    startDate: '2026-08-10', endDate: '2026-08-13', advanceAmount: 5000,
    submittedDate: null, receivedDate: null, approvedDate: null, accountsEntryDate: null,
    advanceDate: null, expenseApproved: null, balanceEmployee: null, balanceCompany: null,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-08-10', description: 'Ahmedabad → Bhuj cab', amount: 1850, billNo: 'TF-3312', remarks: '' },
      { category: 'Lodging', date: '2026-08-10', description: 'Hotel Kutch Residency, Bhuj', amount: 2400, billNo: 'HK-9081', remarks: '2 nights' },
    ],
  },
  {
    tesNo: 'TES-2026-0139', employeeEmail: 'anil.kumar@rotortech.in', projectCode: 'PRJ-WF-09',
    purpose: 'Client site audit, Jamnagar', location: 'Jamnagar, Gujarat',
    startDate: '2026-08-05', endDate: '2026-08-06', advanceAmount: 5000,
    submittedDate: '2026-08-14', receivedDate: '2026-08-14', approvedDate: null, accountsEntryDate: null,
    advanceDate: null, expenseApproved: null, balanceEmployee: null, balanceCompany: null,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-08-05', description: 'Rajkot → Jamnagar train', amount: 620, billNo: 'TK-5502', remarks: '' },
      { category: 'Lodging', date: '2026-08-05', description: 'Hotel Aram, Jamnagar', amount: 3200, billNo: 'HA-1147', remarks: '1 night' },
      { category: 'Boarding', date: '2026-08-05', description: 'Meals', amount: 480, billNo: '', remarks: '' },
      { category: 'Conveyance', date: '2026-08-06', description: 'Local auto to site', amount: 200, billNo: '', remarks: '' },
      { category: 'Other Expenses', date: '2026-08-06', description: 'Site safety gear rental', amount: 1800, billNo: 'SG-771', remarks: '' },
    ],
  },
  {
    tesNo: 'TES-2026-0135', employeeEmail: 'anil.kumar@rotortech.in', projectCode: 'PRJ-WF-06',
    purpose: 'Vendor coordination, Bhuj', location: 'Bhuj, Gujarat',
    startDate: '2026-07-19', endDate: '2026-07-21', advanceAmount: 4000,
    submittedDate: '2026-07-20', receivedDate: '2026-07-20', approvedDate: '2026-07-23', accountsEntryDate: '2026-07-26',
    advanceDate: '2026-07-18', expenseApproved: 5650, balanceEmployee: 1650, balanceCompany: 0,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-07-19', description: 'Ahmedabad → Bhuj flight', amount: 3200, billNo: 'AF-2231', remarks: '' },
      { category: 'Lodging', date: '2026-07-19', description: 'Hotel Prince, Bhuj', amount: 1800, billNo: 'HP-661', remarks: '2 nights' },
      { category: 'Boarding', date: '2026-07-20', description: 'Meals', amount: 650, billNo: '', remarks: '' },
    ],
  },
  {
    tesNo: 'TES-2026-0141', employeeEmail: 'priya.nair@rotortech.in', projectCode: 'PRJ-OM-22',
    purpose: 'O&M review — Dwarka', location: 'Dwarka, Gujarat',
    startDate: '2026-08-12', endDate: '2026-08-15', advanceAmount: 6000,
    submittedDate: '2026-08-15', receivedDate: '2026-08-15', approvedDate: null, accountsEntryDate: null,
    advanceDate: null, expenseApproved: null, balanceEmployee: null, balanceCompany: null,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-08-12', description: 'Rajkot → Dwarka cab', amount: 2200, billNo: 'TF-8821', remarks: '' },
      { category: 'Lodging', date: '2026-08-12', description: 'Hotel Dwarka Inn', amount: 3600, billNo: 'HD-330', remarks: '3 nights' },
      { category: 'Conveyance', date: '2026-08-14', description: 'Site shuttle', amount: 420, billNo: '', remarks: '' },
      { category: 'Other Expenses', date: '2026-08-14', description: 'PPE kit purchase', amount: 1200, billNo: 'PPE-55', remarks: '' },
    ],
  },
  {
    tesNo: 'TES-2026-0140', employeeEmail: 'suresh.babu@rotortech.in', projectCode: 'PRJ-WF-14',
    purpose: 'Turbine commissioning support — Rajkot', location: 'Rajkot, Gujarat',
    startDate: '2026-08-10', endDate: '2026-08-14', advanceAmount: 7000,
    submittedDate: '2026-08-14', receivedDate: '2026-08-14', approvedDate: null, accountsEntryDate: null,
    advanceDate: null, expenseApproved: null, balanceEmployee: null, balanceCompany: null,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-08-10', description: 'Ahmedabad → Rajkot bus', amount: 900, billNo: 'BT-221', remarks: '' },
      { category: 'Lodging', date: '2026-08-10', description: 'Hotel Regency, Rajkot', amount: 5200, billNo: 'HR-1180', remarks: '4 nights' },
      { category: 'Boarding', date: '2026-08-11', description: 'Meals', amount: 1100, billNo: '', remarks: '' },
      { category: 'Conveyance', date: '2026-08-12', description: 'Site-to-site travel', amount: 650, billNo: '', remarks: '' },
      { category: 'Other Expenses', date: '2026-08-13', description: 'Tool calibration fee', amount: 1300, billNo: 'TC-90', remarks: '' },
    ],
  },
  {
    tesNo: 'TES-2026-0136', employeeEmail: 'priya.nair@rotortech.in', projectCode: 'PRJ-LG-11',
    purpose: 'Spare parts logistics — Porbandar', location: 'Porbandar, Gujarat',
    startDate: '2026-08-01', endDate: '2026-08-03', advanceAmount: 4500,
    submittedDate: '2026-08-04', receivedDate: '2026-08-04', approvedDate: '2026-08-05', accountsEntryDate: null,
    advanceDate: null, expenseApproved: null, balanceEmployee: null, balanceCompany: null,
    rejected: false, approverComment: '',
    expenses: [
      { category: 'Travel Fare', date: '2026-08-01', description: 'Rajkot → Porbandar cab', amount: 1600, billNo: 'TF-441', remarks: '' },
      { category: 'Lodging', date: '2026-08-01', description: 'Hotel Sea View', amount: 2800, billNo: 'SV-99', remarks: '2 nights' },
      { category: 'Boarding', date: '2026-08-02', description: 'Meals', amount: 780, billNo: '', remarks: '' },
      { category: 'Other Expenses', date: '2026-08-02', description: 'Packaging materials', amount: 800, billNo: 'PM-12', remarks: '' },
    ],
  },
];

export const SEED_NEXT_TES_SEQUENCE = 143;
export const SEED_TES_YEAR = 2026;
