import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { toUserProfile, type ProfileRow, type UserProfile } from '@rotortech-tes/shared';
import { supabase } from '../supabase';
import { onTableChange } from '../lib/live';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // onAuthStateChange also emits an INITIAL_SESSION event, but only once
    // the client has finished reading AsyncStorage — ask directly too, so
    // the splash isn't held on that round trip.
    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Failed to restore session', error);
      applySession(data.session?.user ?? null);
    });

    // Only React state here. Calling back into supabase-js from this
    // callback can deadlock against the client's own auth lock, so the
    // profile read lives in its own effect below.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    function applySession(u: User | null) {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setProfile(null);
        setProfileLoading(false);
      }
    }

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Keyed on the id, not the User object: supabase-js hands back a fresh
  // object on every token refresh.
  const uid = user?.id ?? null;

  const loadProfile = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) {
      console.error('Failed to load profile', error);
      setProfileLoading(false);
      return;
    }
    // Null is a real state, not an error: the on_auth_user_created trigger
    // may not have committed the row yet in the instant after sign-up.
    setProfile(data ? toUserProfile(data as ProfileRow) : null);
    setProfileLoading(false);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setProfileLoading(true);
    void loadProfile();
    // Watch just this row, so an admin activating this account moves the
    // app off the "pending" screen without waiting for a restart.
    return onTableChange('profiles', () => void loadProfile(), `id=eq.${uid}`);
  }, [uid, loadProfile]);

  const value = useMemo(
    () => ({ user, profile, loading: authLoading || (!!user && profileLoading) }),
    [user, profile, authLoading, profileLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
