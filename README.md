# Rotortech TES

Travel Expense Settlement for Rotortech Energy Solutions Pvt. Ltd. — a
mobile app for employees to submit expenses with receipt photos, and a web
console for Department Heads (approve/reject), Accounts (settle and
finalize) and Admin (roles, categories, Drive status), backed by Supabase
(Postgres + Auth + Storage).

Implements the design in `project/Rotortech TES App.dc.html`, the Claude
Design prototype this was built from (kept, along with its design
transcript in `chats/`, for reference — see `project/README.md`).

## Structure

```
apps/web/       React + Vite web console — Dept Head, Accounts, Admin
apps/mobile/    Expo React Native app — Employee flow
supabase/       Postgres schema, RLS policies and the pipeline workflow functions
packages/shared/  Types, formatting, business logic and row↔domain mapping
functions/       Firebase Cloud Functions — superseded; kept only as the source
                 for the PDF + Drive upload still to be ported to Edge Functions
docs/SETUP.md   Full setup and deployment guide
```

Both client apps talk to Supabase directly; nothing calls `functions/` any
more. See [supabase/README.md](supabase/README.md) for the schema and the
security model.

## Quick start

```bash
npm install
npm run build:shared
supabase db push       # apply migrations (see supabase/README.md first)
npm run dev:web         # web console
npm run dev:mobile      # Expo — mobile app
```

You'll need a Supabase project and a `.env.local` in each app. See
**[docs/SETUP.md](docs/SETUP.md)** for the full walkthrough, including how
to bootstrap the first admin account.

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
- All pipeline transitions (create/submit/approve/reject/finalize) run
  through `SECURITY DEFINER` Postgres functions, not direct client writes.
  `records` has no INSERT policy and `UPDATE` is granted on six trip-info
  columns only, so the stage machine can't be bypassed by a compromised or
  buggy client.
- Submitting and finalizing are *meant* to save a PDF summary to
  `<root>/TES Settlements/{year}/{employee}/{tesNo}.pdf` on a shared Google
  Drive folder. **That step is not connected yet on Supabase** — the
  workflow itself works end to end, but no PDF is produced until the Drive
  upload is ported to an Edge Function. The confirmation dialog shows a
  Drive path and link only when a record really carries them, so it never
  claims a file that doesn't exist. See [docs/SETUP.md](docs/SETUP.md) §5.
