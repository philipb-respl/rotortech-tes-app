import * as functionsV1 from 'firebase-functions/v1';
import type { UserProfile } from '@rotortech-tes/shared';
import { db } from '../admin';

/** Auto-provisions a Firestore profile the moment someone signs up in
 *  Firebase Auth (email/password). Everyone starts as an inactive employee
 *  — an admin assigns the real role and flips `active` on from the Admin
 *  console (or the very first account can self-promote once via the
 *  bootstrapFirstAdmin callable). Using an Auth trigger here, rather than
 *  letting the client write its own profile doc, means the "users" create
 *  path in firestore.rules can stay admin-only. */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'New user');
  const profile: UserProfile = {
    uid: user.uid,
    name,
    employeeId: '',
    email: user.email ?? '',
    department: '',
    role: 'employee',
    active: false,
    createdAt: Date.now(),
  };
  // create() (not set/merge) so this never clobbers a profile that was
  // already written by something else racing the same Auth user — the
  // seed script, notably, creates the Auth user and then writes its own
  // (already-active, already-roled) profile doc; if this trigger fired
  // second and used a merge-set, it would stomp those fields back down to
  // employee/inactive.
  try {
    await db.collection('users').doc(user.uid).create(profile);
  } catch (err) {
    const alreadyExists = (err as { code?: number }).code === 6; // Firestore ALREADY_EXISTS
    if (!alreadyExists) throw err;
  }
});
