import { useCallback, useEffect, useState } from 'react';
import { toExpense, toTesRecord, type ExpenseRow, type RecordRow, type TesRecordWithExpenses } from '@rotortech-tes/shared';
import { supabase } from '../supabase';
import { onTableChange } from '../lib/live';

type RecordWithExpensesRow = RecordRow & { expenses: ExpenseRow[] };

/**
 * A record and its line items, fetched together via PostgREST's embedded
 * select. One round trip, and — unlike the two independent Firestore
 * listeners this replaces — the expenses are never briefly empty while the
 * record is already populated, so callers can safely derive state from
 * `expenses` the moment the record appears.
 */
export function useRecordWithExpenses(recordId: string | null): TesRecordWithExpenses | null {
  const [record, setRecord] = useState<TesRecordWithExpenses | null>(null);

  const load = useCallback(async () => {
    if (!recordId) return;
    const { data, error } = await supabase
      .from('records')
      .select('*, expenses(*)')
      .eq('id', recordId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load record', recordId, error);
      return;
    }
    if (!data) {
      setRecord(null);
      return;
    }
    const row = data as RecordWithExpensesRow;
    setRecord({
      ...toTesRecord(row),
      // Embedded rows come back in no guaranteed order; the UI shows the
      // trip in date order.
      expenses: (row.expenses ?? []).map(toExpense).sort((a, b) => a.date.localeCompare(b.date)),
    });
  }, [recordId]);

  useEffect(() => {
    if (!recordId) {
      setRecord(null);
      return;
    }
    void load();
    const offRecord = onTableChange('records', () => void load(), `id=eq.${recordId}`);
    const offExpenses = onTableChange('expenses', () => void load(), `record_id=eq.${recordId}`);
    return () => {
      offRecord();
      offExpenses();
    };
  }, [recordId, load]);

  return record;
}
