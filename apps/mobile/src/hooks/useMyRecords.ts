import { useCallback, useEffect, useState } from 'react';
import { toTesRecord, type RecordRow, type TesRecord } from '@rotortech-tes/shared';
import { supabase } from '../supabase';
import { onTableChange } from '../lib/live';
import { useAuth } from '../context/AuthContext';

export function useMyRecords(): TesRecord[] | null {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [records, setRecords] = useState<TesRecord[] | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    // The employee_uid filter is belt-and-braces: records_select already
    // limits an employee to their own rows. It keeps the query honest about
    // its intent, and cheap.
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('employee_uid', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load my records', error);
      return;
    }
    setRecords((data as RecordRow[]).map(toTesRecord));
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setRecords(null);
      return;
    }
    void load();
    return onTableChange('records', () => void load(), `employee_uid=eq.${uid}`);
  }, [uid, load]);

  return records;
}
