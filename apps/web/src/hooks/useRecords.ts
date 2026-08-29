import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import type { TesRecord } from '@rotortech-tes/shared';
import { db } from '../firebase';

function useRecordQuery(stage: TesRecord['stage']) {
  const [records, setRecords] = useState<TesRecord[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'records'), where('stage', '==', stage), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => setRecords(snap.docs.map((d) => d.data() as TesRecord)),
      (err) => console.error('Failed to load records for stage', stage, err),
    );
  }, [stage]);

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
