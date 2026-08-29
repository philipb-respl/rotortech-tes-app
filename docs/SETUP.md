# Setup — Rotortech TES

Everything below gets you from a clone of this repo to a running app: local
development against the Firebase Emulator Suite first, then a real Firebase
project wired to Google Drive for production.

## 1. Prerequisites

- Node.js 20+ and npm 10+
- The [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools` (also available via `npx firebase` without a global install)
- Java 11+ (the Firestore/Storage emulators run on the JVM)
- For the mobile app: [Expo Go](https://expo.dev/go) on your phone, or an iOS/Android simulator
- A Google Cloud / Firebase project once you're ready to go beyond the emulator

## 2. Install and build

```bash
npm install                 # installs all workspaces (apps/web, apps/mobile, functions, packages/shared)
npm run build:shared        # compile packages/shared — the others import its build output
```

## 3. Run everything locally against the Emulator Suite

The emulators (Auth, Firestore, Storage, Functions) run entirely on your
machine — no real Firebase project or Google Drive credentials needed to
develop and click through every screen.

```bash
npm run emulators           # starts auth+firestore+functions+storage, UI at http://127.0.0.1:4000
npm run seed                # in another terminal — seeds demo users + TES records (see below)
npm run dev:web              # web console (Dept Head / Accounts / Admin) at http://localhost:5173
npm run dev:mobile           # `expo start` — scan the QR with Expo Go, or press i/a for a simulator
```

`npm run seed` creates the same cast as the original Claude Design
prototype, all with password `rotortech-dev`:

| Email | Role | Name |
| --- | --- | --- |
| anil.kumar@rotortech.in | Employee | Anil Kumar |
| priya.nair@rotortech.in | Employee | Priya Nair |
| suresh.babu@rotortech.in | Employee | Suresh Babu |
| vikram.shah@rotortech.in | Department Head | Vikram Shah |
| meera.joshi@rotortech.in | Accounts | Meera Joshi |
| rohit.sinha@rotortech.in | Admin | Rohit Sinha |

Sign in to the **mobile app** as one of the employees, and to the **web
console** as the Dept Head / Accounts / Admin accounts.

Both apps need to be told to talk to the emulators instead of a real
project:

```bash
cp apps/web/.env.example apps/web/.env.local        # leave VITE_USE_EMULATORS=true
cp apps/mobile/.env.example apps/mobile/.env.local  # leave EXPO_PUBLIC_USE_EMULATORS=true
```

If you're running the mobile app on a physical device or the Android
emulator, `localhost` won't reach your dev machine — set
`EXPO_PUBLIC_EMULATOR_HOST` in `apps/mobile/.env.local` to your machine's
LAN IP (or `10.0.2.2` specifically for the Android emulator).

Because Google Drive isn't configured in this local setup, **Submit** and
**Finalize & Save to Drive** will fail with a clear "Google Drive is not
configured yet" error — everything else (drafts, approvals, rejections,
the Admin console) works fully offline-of-Drive. Section 5 below wires up
real Drive saves.

## 4. Create a real Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project.
2. Enable **Authentication** → Sign-in method → Email/Password.
3. Enable **Firestore Database** (production mode; the checked-in `firestore.rules` locks it down).
4. Enable **Storage** (for receipt photos; `storage.rules` locks it down).
5. Add a **Web app** (for `apps/web`) and copy its config into `apps/web/.env.local` (see `apps/web/.env.example`) — the same values also go into `apps/mobile/.env.local` (see `apps/mobile/.env.example`). Set `VITE_USE_EMULATORS=false` / `EXPO_PUBLIC_USE_EMULATORS=false`.
6. `firebase login`, then update `.firebaserc`'s `"default"` project id (or run `firebase use --add`).
7. Deploy the security rules and indexes: `firebase deploy --only firestore:rules,firestore:indexes,storage`.
8. Deploy the Cloud Functions: see §6.
9. Once functions are live, sign up through the web console or mobile app with your own email — you'll land on a "waiting for activation" screen. Tap **"I'm setting this up — make me the first admin"**; this only works once (see `bootstrapFirstAdmin` in `functions/src/callables`). From then on, use the Admin tab in the web console to activate and role-assign everyone else.
10. Optionally run `npm run seed` against the real project instead of the emulator (omit `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST`, set `GCLOUD_PROJECT=<your-project-id>`, and make sure you're authenticated via `gcloud auth application-default login` or `GOOGLE_APPLICATION_CREDENTIALS`) — useful for a demo/staging environment, skip it for real production data.

## 5. Wire up Google Drive

Submitting and finalizing a TES saves a PDF summary to
`Rotortech Energy Solutions/Travel Expense Settlements/{year}/{employee}/{tesNo}.pdf`
on a **Shared Drive** (not personal My Drive — a bare service account has
no storage quota of its own, so it must be a Shared Drive with the service
account added as a member).

1. In Google Cloud Console (same project as Firebase, or a linked one), enable the **Google Drive API**.
2. Create a **service account** (IAM & Admin → Service Accounts), and create a JSON key for it.
3. In Google Drive, create (or pick) a **Shared Drive**, e.g. "Rotortech Energy Solutions". Add the service account's email (`...@...iam.gserviceaccount.com`) to it as a **Content Manager**.
4. Note the Shared Drive's root folder ID (from its URL: `drive.google.com/drive/folders/<THIS_PART>`).
5. Store the service account key as a Cloud Functions secret:
   ```bash
   firebase functions:secrets:set DRIVE_SERVICE_ACCOUNT_KEY
   # paste the full JSON key contents when prompted
   ```
6. Set the folder id as a Functions param — either export it before deploying, or add it to `functions/.env.<your-project-id>` (see `functions/.env` for the format):
   ```
   DRIVE_ROOT_FOLDER_ID=<the folder id from step 4>
   ```
7. Redeploy functions (§6). Submit/Finalize now really save to Drive.

For local emulator testing with real Drive credentials, copy
`functions/.secret.local.example` to `functions/.secret.local` and fill in
the same JSON key (this file is git-ignored — never commit real
credentials), and set `DRIVE_ROOT_FOLDER_ID` in `functions/.env.local`
(also git-ignored).

## 6. Deploy

```bash
npm run build:web                                       # apps/web/dist
firebase deploy --only hosting                            # serves apps/web/dist
firebase deploy --only functions                          # builds + deploys functions (see firebase.json predeploy hook)
firebase deploy --only firestore:rules,firestore:indexes,storage
```

For the mobile app, build with [EAS Build](https://docs.expo.dev/build/introduction/)
(`eas build`) once you're ready to distribute it, or keep iterating with
Expo Go / a dev client during development.

## Notes on scope

- **Roles**: Employee (mobile app), Department Head / Accounts / Admin (web console). A user's role lives in `users/{uid}.role` in Firestore and is admin-managed — there's no self-service role picker beyond the one-time `bootstrapFirstAdmin` bootstrap.
- **Numbering**: TES numbers (`TES-{year}-{seq}`) are allocated atomically by the `createDraftTes` Cloud Function, continuing from wherever the seed data (or your last real TES) left off.
- **Security**: all pipeline transitions (submit/approve/reject/finalize) run through Cloud Functions callables using the Admin SDK — Firestore rules (`firestore.rules`) block clients from writing those fields directly, so the enforcement holds even if a client is compromised or buggy.
