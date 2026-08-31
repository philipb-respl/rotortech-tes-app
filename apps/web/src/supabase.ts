import { createClient } from '@supabase/supabase-js';

// Values come from apps/web/.env.local (see .env.example) — Vite only
// exposes vars prefixed VITE_. The publishable (anon) key is not a secret:
// it identifies the project and carries no privileges of its own. Every
// permission the browser has comes from row-level security evaluated
// against the signed-in user's JWT, so this key is safe in a bundle.
//
// Projects created before Supabase renamed the API keys still show this as
// the "anon" key; accept either name so a rotation doesn't need a code
// change.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fail loudly here rather than letting every query return an opaque
  // "Failed to fetch" against `undefined/rest/v1/...`.
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in apps/web/.env.local — see docs/SETUP.md.',
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // This console has no OAuth/magic-link flows, so there is never a
    // session to recover from the URL fragment — leaving detection on just
    // means every page load parses the hash looking for one.
    detectSessionInUrl: false,
  },
});
