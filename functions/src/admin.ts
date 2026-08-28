import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Cloud Functions never touch Firebase Storage directly: receipt photos
// are uploaded by clients straight to Storage, and generated PDFs go to
// Google Drive (see drive.ts) — so there's no Storage export here.
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
