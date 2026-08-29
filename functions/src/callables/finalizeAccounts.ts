import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Expense, TesRecord } from '@rotortech-tes/shared';
import { drivePdfPath, settlement, todayIso } from '@rotortech-tes/shared';
import { db } from '../admin';
import { requireRole } from '../auth-helpers';
import { generateTesPdf } from '../pdf';
import { saveTesPdf, driveServiceAccountKey, driveRootFolderId } from '../drive';

interface Data {
  recordId: string;
  advanceDate: string;
  expenseApproved: number;
}

export const finalizeAccounts = onCall<Data>({ secrets: [driveServiceAccountKey] }, async (req) => {
  await requireRole(req, 'accounts');
  const { recordId, advanceDate, expenseApproved } = req.data;
  if (!recordId) throw new HttpsError('invalid-argument', 'recordId is required.');
  const approvedAmt = Number(expenseApproved);
  if (!Number.isFinite(approvedAmt) || approvedAmt < 0) {
    throw new HttpsError('invalid-argument', 'expenseApproved must be a non-negative number.');
  }

  const recordRef = db.collection('records').doc(recordId);
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) throw new HttpsError('not-found', 'TES record not found.');
  const record = recordSnap.data() as TesRecord;

  if (record.stage !== 'approved') {
    throw new HttpsError('failed-precondition', 'Only a Dept-Head-approved TES can be finalized.');
  }
  if (!driveRootFolderId.value()) {
    throw new HttpsError('failed-precondition', 'Google Drive is not configured yet — ask an admin to complete setup (see docs/SETUP.md).');
  }

  const today = todayIso();
  const year = Number((record.submittedDate ?? today).slice(0, 4));
  const { balanceEmployee, balanceCompany } = settlement(record.advanceAmount, approvedAmt);

  const finalized: TesRecord = {
    ...record,
    stage: 'accounts_entry',
    advanceDate: advanceDate || today,
    expenseApproved: approvedAmt,
    balanceEmployee,
    balanceCompany,
    accountsEntryDate: today,
  };

  const expensesSnap = await recordRef.collection('expenses').orderBy('date').get();
  const expenses = expensesSnap.docs.map((d) => d.data() as Expense);
  const pdf = await generateTesPdf(finalized, expenses);
  const saved = await saveTesPdf({ year, employeeName: record.employeeName, tesNo: record.tesNo, pdf });

  await recordRef.update({
    stage: 'accounts_entry',
    advanceDate: finalized.advanceDate,
    expenseApproved: approvedAmt,
    balanceEmployee,
    balanceCompany,
    accountsEntryDate: today,
    driveFileId: saved.fileId,
    driveFileUrl: saved.webViewLink,
    updatedAt: Date.now(),
  });

  return {
    toast: {
      title: 'Saved to Google Drive',
      message: `${record.tesNo} settlement recorded and the final PDF updated in Drive.`,
      path: drivePdfPath(year, record.employeeName, record.tesNo),
      driveUrl: saved.webViewLink,
    },
  };
});
