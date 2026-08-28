import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// getReactNativePersistence/initializeAuth genuinely exist in
// @firebase/auth's React Native build (dist/rn) and resolve fine at
// runtime — Metro understands the "react-native" package-export
// condition. But in this SDK version the package's own "types" condition
// is listed ahead of "react-native" in its exports map, so TypeScript's
// *type* resolution always lands on the generic (non-RN) declaration file
// and never sees these two names, regardless of runtime behavior. Import
// as a namespace and call through an `Auth`-shaped cast rather than fight
// the exports map — the shape below (persistence: Persistence) matches
// InitializeAuthOptions from the public 'firebase/auth' types.
import * as FirebaseAuthRN from '@firebase/auth';
const { getReactNativePersistence, initializeAuth } = FirebaseAuthRN as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => import('firebase/auth').Persistence;
  initializeAuth: (app: ReturnType<typeof initializeApp>, deps: { persistence: import('firebase/auth').Persistence }) => Auth;
};

// Expo inlines any `EXPO_PUBLIC_…` env var at build time (from apps/mobile/
// .env.local — see .env.example / docs/SETUP.md). Firebase's web config
// isn't a secret, but keeping it out of source lets dev/staging/prod point
// at different Firebase projects without a code change.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth: Auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

if (process.env.EXPO_PUBLIC_USE_EMULATORS === 'true' && __DEV__) {
  // Point this at your dev machine's LAN IP, not localhost/127.0.0.1 — the
  // emulator suite runs on your machine, not inside the simulator/device.
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}
