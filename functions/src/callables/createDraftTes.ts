import { onCall } from 'firebase-functions/v2/https';
import type { TesRecord } from '@rotortech-tes/shared';
import { formatTesNo } from '@rotortech-tes/shared';
import { db } from '../admin';
import { requireRole } from '../auth-helpers';

/** Allocates the next sequential TES number for the current year (a
 *  transaction on meta/tesCounter, admin-only via the Admin SDK — clients
 *  never touch that doc directly) and creates the draft record. Keeping
 *  numbering server-side avoids two employees racing to the same number. */
export const createDraftTes = onCall(async (req) => {
  const profile = await requireRole(req, 'employee');
  const year = new Date().getFullYear();

  const counterRef = db.collection('meta').doc('tesCounter');
  const sequence = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.exists ? (snap.data() as { year: number; seq: number }) : null;
    const next = data && data.year === year ? data.seq + 1 : 1;
    tx.set(counterRef, { year, seq: next });
    return next;
  });

  const tesNo = formatTesNo(year, sequence);
  const recordRef = db.collection('records').doc();
  const now = Date.now();
  const record: TesRecord = {
    id: recordRef.id,
    tesNo,
    employeeUid: profile.uid,
    employeeName: profile.name,
    employeeId: profile.employeeId,
    department: profile.department,
    projectCode: '',
    purpose: '',
    location: '',
    startDate: '',
    endDate: '',
    advanceAmount: 0,
    expensesTotal: 0,
    stage: 'draft',
    submittedDate: null,
    receivedDate: null,
    approvedDate: null,
    accountsEntryDate: null,
    advanceDate: null,
    expenseApproved: null,
    balanceEmployee: null,
    balanceCompany: null,
    rejected: false,
    approverComment: '',
    driveFileId: null,
    driveFileUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  await recordRef.set(record);

  return { recordId: recordRef.id, tesNo };
});
