import { useCallback, useEffect, useState } from 'react';
import { toUserProfile, type ProfileRow, type UserProfile } from '@rotortech-tes/shared';
import { supabase } from '../supabase';
import { onTableChange } from '../lib/live';

export function useAllUsers(): UserProfile[] | null {
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) {
      console.error('Failed to load users', error);
      return;
    }
    setUsers((data as ProfileRow[]).map(toUserProfile));
  }, []);

  useEffect(() => {
    void load();
    return onTableChange('profiles', () => void load());
  }, [load]);

  return users;
}
