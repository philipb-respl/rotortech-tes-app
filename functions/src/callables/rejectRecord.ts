import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { TesRecord } from '@rotortech-tes/shared';
import { db } from '../admin';
import { requireRole } from '../auth-helpers';

interface Data {
  recordId: string;
  comment: string;
}

export const rejectRecord = onCall<Data>(async (req) => {
  await requireRole(req, 'approver');
  const { recordId, comment } = req.data;
  if (!recordId) throw new HttpsError('invalid-argument', 'recordId is required.');
  if (!comment || !comment.trim()) {
    throw new HttpsError('invalid-argument', 'A comment describing what needs to change is required.');
  }

  const recordRef = db.collection('records').doc(recordId);
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) throw new HttpsError('not-found', 'TES record not found.');
  const record = recordSnap.data() as TesRecord;

  if (record.stage !== 'submitted') {
    throw new HttpsError('failed-precondition', 'Only a submitted TES awaiting review can be sent back.');
  }

  // Sends it back to the employee as an editable draft, same as the
  // prototype: submission dates are cleared so it re-enters the "expenses"
  // screen instead of the read-only status tracker.
  await recordRef.update({
    stage: 'draft',
    submittedDate: null,
    receivedDate: null,
    rejected: true,
    approverComment: comment.trim(),
    updatedAt: Date.now(),
  });

  return { ok: true };
});
