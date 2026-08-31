import { useCallback, useEffect, useState } from 'react';
import { toTesRecord, type RecordRow, type TesRecord } from '@rotortech-tes/shared';
import { supabase } from '../supabase';
import { onTableChange } from '../lib/live';

function useRecordQuery(stage: TesRecord['stage']) {
  const [records, setRecords] = useState<TesRecord[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('stage', stage)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('Failed to load records for stage', stage, error);
      return;
    }
    setRecords((data as RecordRow[]).map(toTesRecord));
  }, [stage]);

  useEffect(() => {
    void load();
    // Subscribed to the whole table rather than `stage=eq.…`: an approval
    // moves a row out of this queue, and a filtered subscription would see
    // no event for the set the row left.
    return onTableChange('records', () => void load());
  }, [load]);

  return records;
}

/** Records awaiting Dept Head review. */
export function useApproverQueue() {
  return useRecordQuery('submitted');
}

/** Records approved by Dept Head, awaiting Accounts entry. */
export function useAccountsQueue() {
  return useRecordQuery('approved');
}
