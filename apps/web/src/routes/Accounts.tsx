import { useEffect, useState } from 'react';
import { fmtDate, fmtMoney, settlement, todayIso, totalOf } from '@rotortech-tes/shared';
import { Nav } from '../components/Nav';
import { Button } from '../components/Button';
import { Card, CardKicker } from '../components/Card';
import { Field, Input } from '../components/Field';
import { useAccountsQueue } from '../hooks/useRecords';
import { useRecordWithExpenses } from '../hooks/useRecordWithExpenses';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { callFinalizeAccounts } from '../lib/callables';

export function Accounts() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const queue = useAccountsQueue();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useRecordWithExpenses(activeId);

  const [advanceDate, setAdvanceDate] = useState('');
  const [expenseApproved, setExpenseApproved] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (active) {
      setAdvanceDate('');
      setExpenseApproved(String(totalOf(active.expenses)));
    }
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (activeId && active) {
    const approvedNum = Number(expenseApproved) || 0;
    const { balanceEmployee, balanceCompany } = settlement(active.advanceAmount, approvedNum);

    return (
      <div className="page">
        <Nav label={`${profile?.name} · Accounts Team`} />
        <div className="page-head">
          <Button variant="ghost" onClick={() => setActiveId(null)}>
            ← Back to queue
          </Button>
          <h2 style={{ margin: '12px 0 4px' }}>{active.tesNo}</h2>
          <p className="text-muted" style={{ margin: '0 0 20px' }}>
            {active.employeeName} · {active.purpose}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {active.expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.category}</td>
                    <td className="text-muted">{fmtDate(ex.date)}</td>
                    <td>{ex.description}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(ex.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ fontWeight: 600 }}>
                    Total Claimed
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(totalOf(active.expenses))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Card style={{ padding: 16, marginTop: 20 }}>
            <CardKicker>Settlement</CardKicker>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
              <Field label="Advance Paid">
                <Input value={fmtMoney(active.advanceAmount)} disabled />
              </Field>
              <Field label="Advance Date">
                <Input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} />
              </Field>
              <Field label="Expense Approved (₹)">
                <Input
                  type="number"
                  value={expenseApproved}
                  onChange={(e) => setExpenseApproved(e.target.value)}
                />
              </Field>
              <Field label="Accounts Entry Date">
                <Input value="Set on finalize" disabled />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 14 }}>
              <div>
                <span style={{ opacity: 0.5 }}>Balance due to Employee</span>
                <br />
                <strong>{fmtMoney(balanceEmployee)}</strong>
              </div>
              <div>
                <span style={{ opacity: 0.5 }}>Balance due to Company</span>
                <br />
                <strong>{fmtMoney(balanceCompany)}</strong>
              </div>
            </div>
          </Card>

          {error && <p className="auth-error">{error}</p>}
          <Button
            variant="primary"
            block
            style={{ marginTop: 20, maxWidth: 320 }}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const res = await callFinalizeAccounts(
                  active.id,
                  advanceDate || todayIso(),
                  approvedNum,
                );
                setActiveId(null);
                showToast(res.data.toast);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not finalize this settlement.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Finalize & Save to Drive
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Nav label={`${profile?.name} · Accounts Team`} />
      <div className="page-head">
        <h2 style={{ margin: '0 0 4px' }}>Approved — Pending Accounts Entry</h2>
        <p className="text-muted" style={{ margin: '0 0 20px', fontSize: 14 }}>
          {queue === null ? 'Loading…' : `${queue.length} ${queue.length === 1 ? 'settlement' : 'settlements'} ready to process`}
        </p>
        {queue && queue.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>TES No</th>
                  <th>Purpose</th>
                  <th>Approved</th>
                  <th style={{ textAlign: 'right' }}>Claimed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>{r.tesNo}</td>
                    <td>{r.purpose}</td>
                    <td className="text-muted">{fmtDate(r.approvedDate)}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(r.expensesTotal)}</td>
                    <td>
                      <Button variant="secondary" onClick={() => setActiveId(r.id)}>
                        Process
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {queue && queue.length === 0 && (
          <p className="text-muted" style={{ padding: '24px 0' }}>Nothing pending — all settlements are up to date.</p>
        )}
      </div>
    </div>
  );
}
