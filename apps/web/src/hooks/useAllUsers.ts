import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { UserProfile } from '@rotortech-tes/shared';
import { db } from '../firebase';

export function useAllUsers(): UserProfile[] | null {
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'users'), orderBy('name')),
        (snap) => setUsers(snap.docs.map((d) => d.data() as UserProfile)),
        (err) => console.error('Failed to load users', err),
      ),
    [],
  );

  return users;
}
