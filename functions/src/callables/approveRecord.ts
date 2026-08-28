import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { TesRecord } from '@rotortech-tes/shared';
import { todayIso } from '@rotortech-tes/shared';
import { db } from '../admin';
import { requireRole } from '../auth-helpers';

interface Data {
  recordId: string;
}

export const approveRecord = onCall<Data>(async (req) => {
  await requireRole(req, 'approver');
  const { recordId } = req.data;
  if (!recordId) throw new HttpsError('invalid-argument', 'recordId is required.');

  const recordRef = db.collection('records').doc(recordId);
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) throw new HttpsError('not-found', 'TES record not found.');
  const record = recordSnap.data() as TesRecord;

  if (record.stage !== 'submitted') {
    throw new HttpsError('failed-precondition', 'Only a submitted TES awaiting review can be approved.');
  }

  await recordRef.update({
    stage: 'approved',
    approvedDate: todayIso(),
    updatedAt: Date.now(),
  });

  return { ok: true };
});
