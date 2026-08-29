import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Expense, TesRecord } from '@rotortech-tes/shared';
import { drivePdfPath, todayIso } from '@rotortech-tes/shared';
import { db } from '../admin';
import { requireRole } from '../auth-helpers';
import { generateTesPdf } from '../pdf';
import { saveTesPdf, driveServiceAccountKey, driveRootFolderId } from '../drive';

interface Data {
  recordId: string;
}

export const submitRecord = onCall<Data>({ secrets: [driveServiceAccountKey] }, async (req) => {
  const profile = await requireRole(req, 'employee');
  const { recordId } = req.data;
  if (!recordId) throw new HttpsError('invalid-argument', 'recordId is required.');

  const recordRef = db.collection('records').doc(recordId);
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) throw new HttpsError('not-found', 'TES record not found.');
  const record = recordSnap.data() as TesRecord;

  if (record.employeeUid !== profile.uid) {
    throw new HttpsError('permission-denied', 'This TES belongs to another employee.');
  }
  if (record.stage !== 'draft') {
    throw new HttpsError('failed-precondition', 'Only a draft TES can be submitted.');
  }

  const expensesSnap = await recordRef.collection('expenses').orderBy('date').get();
  const expenses = expensesSnap.docs.map((d) => d.data() as Expense);
  if (expenses.length === 0) {
    throw new HttpsError('failed-precondition', 'Add at least one expense before submitting.');
  }
  if (!driveRootFolderId.value()) {
    throw new HttpsError('failed-precondition', 'Google Drive is not configured yet — ask an admin to complete setup (see docs/SETUP.md).');
  }

  // Canonicalize identity fields from the authenticated profile rather than
  // whatever the client had cached, so a submitted record always reflects
  // who actually submitted it.
  const canonical: TesRecord = {
    ...record,
    employeeName: profile.name,
    employeeId: profile.employeeId,
    department: profile.department,
  };

  const today = todayIso();
  const year = Number(today.slice(0, 4));
  const pdf = await generateTesPdf({ ...canonical, stage: 'submitted', submittedDate: today, receivedDate: today }, expenses);
  const saved = await saveTesPdf({ year, employeeName: canonical.employeeName, tesNo: canonical.tesNo, pdf });

  await recordRef.update({
    employeeName: canonical.employeeName,
    employeeId: canonical.employeeId,
    department: canonical.department,
    stage: 'submitted',
    submittedDate: today,
    receivedDate: today,
    rejected: false,
    approverComment: '',
    driveFileId: saved.fileId,
    driveFileUrl: saved.webViewLink,
    updatedAt: Date.now(),
  });

  return {
    toast: {
      title: 'Saved to Google Drive',
      message: `${canonical.tesNo} was submitted for approval and a PDF summary was saved to Drive.`,
      path: drivePdfPath(year, canonical.employeeName, canonical.tesNo),
      driveUrl: saved.webViewLink,
    },
  };
});
