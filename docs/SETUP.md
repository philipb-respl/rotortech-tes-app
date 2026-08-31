# Setup — Rotortech TES

Everything below gets you from a clone of this repo to a running app.

**The two client apps now talk to Supabase.** `apps/web` and `apps/mobile`
use `@supabase/supabase-js` against the Postgres schema, row-level security
and workflow functions in [`supabase/`](../supabase/README.md); there is no
Firebase code left in either app.

The `functions/` directory (Firebase Cloud Functions) is still in the tree,
but **nothing calls it any more**. It is kept as the source for the PDF
generation and Google Drive upload, which still need porting to Supabase
Edge Functions — see §5 and `supabase/README.md`.

## 1. Prerequisites

- Node.js 20+ and npm 10+
- A [Supabase](https://supabase.com) project (free tier is fine)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) for applying migrations: `npm install -g supabase`
- For the mobile app: [Expo Go](https://expo.dev/go) on your phone, or an iOS/Android simulator
- Docker, only if you want to run Supabase locally (`supabase start`) rather than against a hosted project

## 2. Install and build

```bash
npm install                 # installs all workspaces (apps/web, apps/mobile, functions, packages/shared)
npm run build:shared        # compile packages/shared — the apps import its build output
```

## 3. Set up the database

The schema lives in `supabase/migrations/`, applied in filename order.
`supabase/README.md` documents each migration and the current state of the
hosted project — **read it before pushing**, because some migrations were
originally applied out-of-band and the remote history needs repairing
first.

```bash
supabase link --project-ref <your-project-ref>
supabase migration list      # compare remote versions against local files
supabase db push             # apply anything missing
```

Or run everything locally instead:

```bash
supabase start               # local Postgres + Auth + Storage + Studio
supabase db reset            # applies every migration from scratch
```

Then enable **Email** sign-in in the dashboard (Authentication → Providers).
For a low-friction internal rollout, turn *off* "Confirm email" — otherwise
new accounts must click a link before they can sign in.

## 4. Point the apps at it

Both apps need the project URL and publishable key, from the Supabase
dashboard → Project Settings → API:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
# fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in both
```

The publishable (anon) key is safe in a client bundle — it identifies the
project and grants nothing on its own; every read and write is decided by
row-level security against the signed-in user's JWT. The **secret**
(`service_role`) key bypasses RLS entirely and must never appear in either
app.

```bash
npm run dev:web              # web console (Dept Head / Accounts / Admin) at http://localhost:5173
npm run dev:mobile           # `expo start` — scan the QR with Expo Go, or press i/a for a simulator
```

Unlike the Firebase emulator setup this replaces, a physical device needs
no LAN-IP juggling: it reaches the hosted project directly. If you're
running `supabase start` locally instead, point
`EXPO_PUBLIC_SUPABASE_URL` at your machine's LAN IP on port 54321 —
`localhost` won't resolve from a device or the Android emulator.

### First admin

Sign up through the web console with your own email. Every new account
starts inactive with the `employee` role (the `on_auth_user_created`
trigger), so you'll land on a "waiting for activation" screen. Click
**"I'm setting this up — make me the first admin"**, which calls
`bootstrap_first_admin()` — it promotes you and then permanently locks
itself out, because it refuses to run once any admin exists. From then on,
use the Admin tab to activate and role-assign everyone else.

There is no Supabase seed script yet; `functions/src/scripts/seed.ts` seeds
Firebase only.

## 5. Google Drive — not yet wired on Supabase

Submitting and finalizing a TES is *meant* to save a PDF summary to
`<root>/TES Settlements/{year}/{employee}/{tesNo}.pdf`. On Firebase that
ran inside the `submitRecord` / `finalizeAccounts` callables.

On Supabase it is **not connected yet**. `submit_record()` and
`finalize_accounts()` accept `drive_file_id` / `drive_file_url` parameters,
but nothing passes them, so:

- the workflow still works end to end — drafts, submission, approval,
  rejection, settlement;
- no PDF is generated and nothing is written to Drive;
- the confirmation dialog deliberately shows the Drive path and "Open in
  Google Drive" link *only* when the record actually carries them, so it
  does not claim a file exists that doesn't. Once an Edge Function fills
  those fields in, the link appears on its own.

Closing the gap means porting `functions/src/pdf.ts` and
`functions/src/drive.ts` to a Deno Edge Function that generates the PDF,
uploads it, and then calls the RPC with the resulting ids. The service
account setup below is unchanged and still applies — only the runtime that
uses it moves.

1. In Google Cloud Console, enable the **Google Drive API**.
2. Create a **service account** (IAM & Admin → Service Accounts) and a JSON key for it.
3. In Google Drive, create (or pick) a **Shared Drive** and, inside it, the folder TES PDFs are filed under. Add the service account's email (`...@...iam.gserviceaccount.com`) as a **Content Manager**. A bare service account has no storage quota of its own, so this must be a Shared Drive, not personal My Drive.
4. Note that folder's ID (from its URL: `drive.google.com/drive/folders/<THIS_PART>`). It is already set as `DRIVE_ROOT_FOLDER_ID` in `functions/.env` — an identifier, not a credential.
5. Store the JSON key as a secret in whichever runtime ends up doing the upload (`supabase secrets set DRIVE_SERVICE_ACCOUNT_KEY` for Edge Functions). Set it from your own shell; don't paste the key into a chat, a ticket, or the repo.

## 6. Deploy

```bash
npm run build:web            # apps/web/dist — serve it from any static host
supabase db push             # apply migrations to the hosted project
```

For the mobile app, build with [EAS Build](https://docs.expo.dev/build/introduction/)
(`eas build`) once you're ready to distribute it, or keep iterating with
Expo Go / a dev client during development.

## Notes on scope

- **Roles**: Employee (mobile app), Department Head / Accounts / Admin (web console). A user's role lives in `public.profiles.role` and is admin-managed — there's no self-service role picker beyond the one-time `bootstrap_first_admin()`.
- **Numbering**: TES numbers (`TES-{year}-{seq}`) are allocated by `create_draft_tes()`, which takes a row lock on `tes_counter` so two employees hitting "New TES" at once can't collide.
- **Security**: every pipeline transition runs through a `SECURITY DEFINER` Postgres function. `records` has no INSERT policy and `UPDATE` is granted on six trip-info columns only, so a client physically cannot create a record or move one between stages — the enforcement holds even if a client is compromised or buggy. See `supabase/README.md` for the three overlapping layers.
- **Live updates**: the queues and detail screens subscribe to Realtime and re-read through PostgREST on any change, rather than patching state from the event payload — Realtime applies the same RLS, but DELETE payloads carry only a primary key and a row leaving a filtered set produces no event.
