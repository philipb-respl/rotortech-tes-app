import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';
import type { Role, UserProfile } from '@rotortech-tes/shared';
import { db } from './admin';

/** Loads the caller's profile doc, rejecting if not signed in, not found,
 *  or not yet activated by an admin. */
export async function requireProfile(req: CallableRequest): Promise<UserProfile> {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const snap = await db.collection('users').doc(req.auth.uid).get();
  if (!snap.exists) {
    throw new HttpsError('failed-precondition', 'No profile found for this account.');
  }
  const profile = snap.data() as UserProfile;
  if (!profile.active) {
    throw new HttpsError('permission-denied', 'This account has not been activated yet. Ask an admin to activate it.');
  }
  return profile;
}

export async function requireRole(req: CallableRequest, role: Role): Promise<UserProfile> {
  const profile = await requireProfile(req);
  if (profile.role !== role) {
    throw new HttpsError('permission-denied', `This action requires the ${role} role.`);
  }
  return profile;
}
