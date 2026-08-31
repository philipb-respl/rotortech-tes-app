# Supabase backend

Postgres schema, row-level security, and the pipeline workflow functions for
Rotortech TES.

Project: **TES-respl's Project** — ref `hhhgrptpmoskjdoiziry`
(org `TES-respl's Org`, region `ap-northeast-2`).

## ⚠️ Current state — partially applied

Three migrations are **live on the remote project**; the rest are **written
here but not yet applied**, because the Supabase connection dropped
mid-build and has not come back. The unapplied ones have not been executed
anywhere, so treat them as reviewed-but-unverified SQL.

| Migration | Applied remotely? |
| --- | --- |
| `20260830170000_tes_schema.sql` | ✅ yes |
| `20260830170100_tes_rls_helpers_and_policies.sql` | ✅ yes |
| `20260830170200_tes_triggers.sql` | ✅ yes |
| `20260830170300_tes_workflow_functions.sql` | ❌ **not applied** |
| `20260830170400_tes_column_grants.sql` | ❌ **not applied** |
| `20260830170500_tes_storage.sql` | ❌ **not applied** |
| `20260830170600_tes_realtime.sql` | ❌ **not applied** |

Until the workflow functions are applied, nothing can create or advance a
record: `records` has no INSERT policy by design, so `create_draft_tes()` is
the only way in. Until `…170500` runs there is no `receipts` bucket, so
receipt photos fail to upload; until `…170600` runs the apps still work but
fall back to whatever they fetched on mount, since no Realtime events are
published.

**Nothing here has been exercised against a signed-in user yet.** The
Firebase backend it replaces was verified end to end against the emulator
(role enforcement, stage transitions, sequential numbering, no partial
writes); the equivalent pass over these policies and functions still needs
doing once the migrations are in.

## Applying the rest

The three live migrations were applied through the MCP tools, which assign
their own version strings — so they are recorded remotely under versions that
**do not match** these filenames. A plain `supabase db push` will therefore
try to re-run them and fail on "type already exists".

Check what the remote actually has first:

```bash
supabase link --project-ref hhhgrptpmoskjdoiziry
supabase migration list          # compare remote versions against local files
```

Then either mark the three as already applied and push the rest:

```bash
supabase migration repair --status applied 20260830170000
supabase migration repair --status applied 20260830170100
supabase migration repair --status applied 20260830170200
supabase db push
```

…or, on a throwaway/dev project with no data worth keeping, reset and let all
six run in order:

```bash
supabase db reset --linked        # DESTRUCTIVE — drops and rebuilds
```

## Design notes

**Stage transitions are functions, not table writes.** `records` has no
INSERT policy and `UPDATE` is granted only on the six trip-info columns, so a
client physically cannot create a record or move one through the pipeline.
The six `SECURITY DEFINER` functions are the only path:

| Function | Role required | Effect |
| --- | --- | --- |
| `create_draft_tes()` | employee | Allocates the next `TES-{year}-{seq}` under a row lock, creates the draft |
| `submit_record(id, drive_id?, drive_url?)` | employee (owner) | draft → submitted; requires ≥1 expense; re-stamps identity from the profile |
| `approve_record(id)` | approver | submitted → approved |
| `reject_record(id, comment)` | approver | submitted → draft, with the comment; clears submission dates |
| `finalize_accounts(id, approved, advance_date?, …)` | accounts | approved → accounts_entry; computes both balances |
| `bootstrap_first_admin()` | any signed-in | One-time: promotes the caller to active admin, then locks itself out |

This mirrors the Firebase design, where the equivalent callables were the only
code holding an Admin SDK handle.

**Three layers guard the pipeline fields**, deliberately overlapping:

1. **Column grants** (`20260830170400`) — Postgres rejects the statement
   outright. Structural, and unaffected by bugs in the layers above it.
2. **Guard triggers** — raise a readable error, and cover what grants can't
   (admins edit `role`/`active` through the same `authenticated` role as
   everyone else, so a grant can't distinguish them).
3. **RLS policies** — scope *which rows* are visible and writable at all.

The workflow functions signal legitimate writes with a transaction-local
`tes.workflow` flag, set immediately before the update and cleared straight
after rather than left on for the remainder of the transaction.

**Helper functions are `SECURITY DEFINER` for a specific reason:** a policy on
`profiles` that reads `profiles` to check your role would recurse forever.
Definer rights break the loop by bypassing RLS inside the helper. Their
`search_path` is pinned so a caller can't shadow `public` and redirect the
lookup.

## Not built yet

- **Edge Functions for PDF + Drive.** `submit_record` and `finalize_accounts`
  accept `drive_file_id` / `drive_file_url` but nothing populates them. The
  PDF generation and Drive upload (today `functions/src/pdf.ts` and
  `functions/src/drive.ts` on Firebase) still need porting to Deno Edge
  Functions that wrap these RPCs.
- **Seed data.** No Supabase equivalent of `functions/src/scripts/seed.ts`.

## The client apps

Both `apps/web` and `apps/mobile` now talk to this schema through
`@supabase/supabase-js`. There is no Firebase code left in either; the
`functions/` directory survives only as the source for the Drive/PDF port
above.

Two conventions worth knowing before editing the data layer:

**Columns are snake_case, the domain types are camelCase.** Rather than
rename either side, `packages/shared/src/rows.ts` translates between them
(`toTesRecord`, `toExpense`, `toUserProfile`, and the patch builders going
the other way). The data layer is the only code that knows both spellings —
every screen and component works in the camelCase types it always did.

**Live views re-read rather than patch.** The hooks subscribe to Realtime
and, on any event, re-run their PostgREST query instead of applying the
payload. Realtime enforces the same RLS, but DELETE payloads carry only the
primary key and skip it, and a row that moves *out* of a filtered set
(a TES going submitted → approved, leaving the Dept Head queue) produces no
event for the set it left — so a payload-patching cache would strand it on
screen.
