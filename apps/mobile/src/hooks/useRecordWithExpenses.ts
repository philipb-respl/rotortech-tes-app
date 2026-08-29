import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { Expense, TesRecord, TesRecordWithExpenses } from '@rotortech-tes/shared';
import { db } from '../firebase';

export function useRecordWithExpenses(recordId: string | null): TesRecordWithExpenses | null {
  const [record, setRecord] = useState<TesRecord | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!recordId) {
      setRecord(null);
      setExpenses([]);
      return;
    }
    const unsubRecord = onSnapshot(
      doc(db, 'records', recordId),
      (snap) => setRecord(snap.exists() ? (snap.data() as TesRecord) : null),
      (err) => console.error('Failed to load record', recordId, err),
    );
    const unsubExpenses = onSnapshot(
      query(collection(db, 'records', recordId, 'expenses'), orderBy('date')),
      (snap) => setExpenses(snap.docs.map((d) => d.data() as Expense)),
      (err) => console.error('Failed to load expenses for record', recordId, err),
    );
    return () => {
      unsubRecord();
      unsubExpenses();
    };
  }, [recordId]);

  if (!record) return null;
  return { ...record, expenses };
}
