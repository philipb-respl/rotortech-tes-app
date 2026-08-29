# Design handoff (historical)

This is the original **handoff bundle** from Claude Design
(claude.ai/design) that `Rotortech TES App.dc.html` in this directory, and
the implementation in the repo root (`apps/`, `functions/`,
`packages/shared/`), were built from.

A user mocked up the app's screens in HTML/CSS/JS using Claude Design,
then exported this bundle so a coding agent could implement it for real.
It's kept here for reference — design intent, the exact copy and layout,
seed data — not as something to run or maintain going forward.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in
`chats/`. The transcripts show the full back-and-forth between the user
and the design assistant — they tell you **what the user actually wants**
and **where they landed** after iterating. Don't skip them. The final HTML
files are the output, but the chat is where the intent lives.

**Read `project/Rotortech TES App.dc.html` in full.** The user had this
file open when they triggered the handoff, so it's almost certainly the
primary design they want built. Read it top to bottom — don't skim. Then
**follow its imports**: open every file it pulls in (shared components,
CSS, scripts) so you understand how the pieces fit together before you
start implementing.

**If anything is ambiguous, ask the user to confirm before you start
implementing.** It's much cheaper to clarify scope up front than to build
the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not
production code. Your job is to **recreate them pixel-perfectly** in
whatever technology makes sense for the target codebase (React, Vue,
native, whatever fits). Match the visual output; don't copy the
prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the
user asks you to.** Everything you need — dimensions, colors, layout rules
— is spelled out in the source. Read the HTML and CSS directly; a
screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `../chats/` — conversation transcripts (read these!)
- everything else in this directory — the `Rotortech travel expense app`
  project files (HTML prototypes, assets, components)

## Where the real implementation lives

- `apps/web/` — the web console (Dept Head, Accounts, Admin), a real React
  app built from the `roleIsApprover` / `roleIsAccounts` / `roleIsAdmin`
  sections of the prototype
- `apps/mobile/` — the employee flow, a real Expo/React Native app built
  from the `roleIsEmployee` (iOS-frame) section of the prototype
- `functions/` — the business logic + Google Drive integration that the
  prototype simulated with local state and a fake "Saved to Google Drive"
  toast
- `packages/shared/` — formatting and business logic ported from the
  prototype's `<script type="text/x-dc">` block
- `../docs/SETUP.md` — how to run and deploy the real implementation
