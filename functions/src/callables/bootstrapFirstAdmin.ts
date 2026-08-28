import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../admin';

/** One-time bootstrap: the first person to call this after deploy becomes
 *  an active admin, so there's someone who can activate and role-assign
 *  everyone else from the Admin console. Locks itself out permanently once
 *  any admin exists — safe to leave deployed. */
export const bootstrapFirstAdmin = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in required.');

  const existingAdmins = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!existingAdmins.empty) {
    throw new HttpsError('failed-precondition', 'An admin already exists — ask them to activate your account.');
  }

  const ref = db.collection('users').doc(req.auth.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('failed-precondition', 'Profile not ready yet — try again in a moment.');
  }

  await ref.update({ role: 'admin', active: true });
  return { ok: true };
});
