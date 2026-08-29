# Rotortech TES

Travel Expense Settlement for Rotortech Energy Solutions Pvt. Ltd. — a
mobile app for employees to submit expenses with receipt photos, and a web
console for Department Heads (approve/reject), Accounts (settle and
finalize) and Admin (roles, categories, Drive status), backed by Firebase
and Google Drive.

Implements the design in `project/Rotortech TES App.dc.html`, the Claude
Design prototype this was built from (kept, along with its design
transcript in `chats/`, for reference — see `project/README.md`).

## Structure

```
apps/web/       React + Vite web console — Dept Head, Accounts, Admin
apps/mobile/    Expo React Native app — Employee flow
functions/      Firebase Cloud Functions — pipeline logic, PDF + Drive upload
packages/shared/  Types, formatting and business logic shared by all three
firestore.rules, storage.rules, firebase.json   Firebase project config
docs/SETUP.md   Full setup, local emulator walkthrough, and deployment guide
```

## Quick start

```bash
npm install
npm run build:shared
npm run emulators     # Firebase Emulator Suite (Auth, Firestore, Functions, Storage)
npm run seed           # in another terminal — demo users + TES records
npm run dev:web         # web console
npm run dev:mobile      # Expo — mobile app
```

See **[docs/SETUP.md](docs/SETUP.md)** for the full walkthrough, including
demo login credentials, wiring up a real Firebase project, and connecting
Google Drive.

## How it works

- **Employee** (mobile): dashboard of their TES records → trip info →
  expenses (with camera/gallery receipt capture) → review → submit. A
  status tracker shows Submitted → Received → Approved → Accounts Entry,
  and the settlement once Accounts finalizes it.
- **Department Head** (web): a queue of submitted TES, each reviewable
  with full expense detail, approve or reject-with-comment (sends it back
  to the employee as an editable draft).
- **Accounts** (web): a queue of approved TES ready to settle — enters the
  approved expense amount and advance date, sees the live balance-due
  calculation, and finalizes.
- **Admin** (web): Drive connection status, expense categories, and the
  user directory (role + active/inactive, editable inline).
- Submitting and finalizing both generate a PDF summary and save it to
  `Rotortech Energy Solutions/Travel Expense Settlements/{year}/{employee}/{tesNo}.pdf`
  on a shared Google Drive folder.
- All pipeline transitions (submit/approve/reject/finalize) run through
  Cloud Functions callables, not direct client writes — Firestore security
  rules block clients from touching those fields, so the stage machine
  can't be bypassed by a compromised or buggy client.
