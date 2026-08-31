import { useState } from 'react';
import { DRIVE_SETTLEMENTS_FOLDER, EXPENSE_CATEGORIES } from '@rotortech-tes/shared';
import type { ProfilePatch, Role } from '@rotortech-tes/shared';
import { Nav } from '../components/Nav';
import { Card, CardKicker, CardTitle } from '../components/Card';
import { Tag } from '../components/Tag';
import { Input, Select } from '../components/Field';
import { Button } from '../components/Button';
import { useAllUsers } from '../hooks/useAllUsers';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/api';

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
  const [error, setError] = useState('');

  async function save(uid: string, patch: ProfilePatch) {
    setBusyUid(uid);
    setError('');
    try {
      await updateProfile(uid, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that change.');
    } finally {
      setBusyUid(null);
    }
  }

  const setRole = (uid: string, role: Role) => save(uid, { role });
  const toggleActive = (uid: string, active: boolean) => save(uid, { active: !active });
  const saveField = (uid: string, field: 'employeeId' | 'department', value: string) =>
    save(uid, field === 'employeeId' ? { employeeId: value.trim() } : { department: value.trim() });

  return (
    <div className="page">
      <Nav label={`${profile?.name} · Admin`} />
      <div className="page-head">
        <h2 style={{ margin: '0 0 20px' }}>Admin</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 16 }}>
            <CardKicker>Google Drive</CardKicker>
            <CardTitle style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Hollow rather than filled: this is a status indicator, and
                  nothing is uploading to Drive yet. */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1px solid currentColor',
                  opacity: 0.4,
                  display: 'inline-block',
                }}
              />
              Not connected yet
            </CardTitle>
            <p className="card-body">
              Once connected, PDF summaries will be filed under
              <br />
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>
                &lt;root&gt;/{DRIVE_SETTLEMENTS_FOLDER}/{'{year}'}/{'{employee}'}/
              </span>
            </p>
            <p className="text-muted" style={{ fontSize: 12 }}>
              Submitting and finalizing work as normal — they just don't produce a PDF yet. The upload still needs
              porting to a Supabase Edge Function; see docs/SETUP.md §5.
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

        {error && <p className="auth-error">{error}</p>}

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
