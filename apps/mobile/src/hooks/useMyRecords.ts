import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import type { TesRecord } from '@rotortech-tes/shared';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useMyRecords(): TesRecord[] | null {
  const { user } = useAuth();
  const [records, setRecords] = useState<TesRecord[] | null>(null);

  useEffect(() => {
    if (!user) {
      setRecords(null);
      return;
    }
    const q = query(collection(db, 'records'), where('employeeUid', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => setRecords(snap.docs.map((d) => d.data() as TesRecord)),
      (err) => console.error('Failed to load my records', err),
    );
  }, [user]);

  return records;
}
