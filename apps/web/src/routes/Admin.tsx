import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { EXPENSE_CATEGORIES } from '@rotortech-tes/shared';
import type { Role } from '@rotortech-tes/shared';
import { Nav } from '../components/Nav';
import { Card, CardKicker, CardTitle } from '../components/Card';
import { Tag } from '../components/Tag';
import { Input, Select } from '../components/Field';
import { Button } from '../components/Button';
import { useAllUsers } from '../hooks/useAllUsers';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const ROLES: Role[] = ['employee', 'approver', 'accounts', 'admin'];
const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  approver: 'Department Head',
  accounts: 'Accounts',
  admin: 'Admin',
};

export function Admin() {
  const { profile } = useAuth();
  const users = useAllUsers();
  const [busyUid, setBusyUid] = useState<string | null>(null);

  async function setRole(uid: string, role: Role) {
    setBusyUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } finally {
      setBusyUid(null);
    }
  }

  async function toggleActive(uid: string, active: boolean) {
    setBusyUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { active: !active });
    } finally {
      setBusyUid(null);
    }
  }

  async function saveField(uid: string, field: 'employeeId' | 'department', value: string) {
    await updateDoc(doc(db, 'users', uid), { [field]: value.trim() });
  }

  return (
    <div className="page">
      <Nav label={`${profile?.name} · Admin`} />
      <div className="page-head">
        <h2 style={{ margin: '0 0 20px' }}>Admin</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 16 }}>
            <CardKicker>Google Drive</CardKicker>
            <CardTitle style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block' }}
              />
              Connected via service account
            </CardTitle>
            <p className="card-body">
              Rotortech Energy Solutions — Shared Drive
              <br />
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>
                /Travel Expense Settlements/{'{year}'}/{'{employee}'}/
              </span>
            </p>
            <p className="text-muted" style={{ fontSize: 12 }}>
              Configured via the <code>DRIVE_SERVICE_ACCOUNT_KEY</code> secret and{' '}
              <code>DRIVE_ROOT_FOLDER_ID</code> — see docs/SETUP.md.
            </p>
          </Card>
          <Card style={{ padding: 16 }}>
            <CardKicker>Expense Categories</CardKicker>
            <CardTitle style={{ fontSize: 15 }}>{EXPENSE_CATEGORIES.length} active</CardTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Tag key={c} variant="outline">
                  {c}
                </Tag>
              ))}
            </div>
          </Card>
        </div>

        <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
          Approval chain: Employee → Department Head → Accounts → Settled
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.uid}>
                  <td>{u.name}</td>
                  <td>
                    <Input
                      key={u.uid + u.employeeId}
                      defaultValue={u.employeeId}
                      placeholder="e.g. RES-0210"
                      style={{ minHeight: 30, fontSize: 13 }}
                      onBlur={(e) => e.target.value.trim() !== u.employeeId && saveField(u.uid, 'employeeId', e.target.value)}
                    />
                  </td>
                  <td>
                    <Input
                      key={u.uid + u.department}
                      defaultValue={u.department}
                      placeholder="e.g. Wind O&M"
                      style={{ minHeight: 30, fontSize: 13 }}
                      onBlur={(e) => e.target.value.trim() !== u.department && saveField(u.uid, 'department', e.target.value)}
                    />
                  </td>
                  <td>
                    <Select
                      value={u.role}
                      disabled={busyUid === u.uid}
                      onChange={(e) => setRole(u.uid, e.target.value as Role)}
                      style={{ minHeight: 30, fontSize: 13 }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag variant={u.active ? 'accent' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Tag>
                    <Button variant="ghost" disabled={busyUid === u.uid} onClick={() => toggleActive(u.uid, u.active)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
