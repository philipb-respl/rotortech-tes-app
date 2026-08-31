// Hermes ships an incomplete WHATWG URL — no searchParams, in particular —
// which supabase-js relies on when building request URLs. Must be imported
// before the client is created.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Expo inlines any `EXPO_PUBLIC_…` var at build time (from apps/mobile/
// .env.local — see .env.example / docs/SETUP.md). The publishable (anon)
// key is not a secret: it identifies the project and carries no privileges
// of its own — everything the app may read or write comes from row-level
// security evaluated against the signed-in user's JWT.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/mobile/.env.local — see docs/SETUP.md.',
  );
}

export const supabase = createClient(url, key, {
  auth: {
    // AsyncStorage keeps the session across app restarts, the same job
    // getReactNativePersistence did for Firebase Auth.
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // There is no browser URL to recover a session from on a native app,
    // and leaving this on makes GoTrue reach for `window.location`.
    detectSessionInUrl: false,
  },
});
