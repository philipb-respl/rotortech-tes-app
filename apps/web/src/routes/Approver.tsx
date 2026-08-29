import { useState } from 'react';
import { fmtDate, fmtMoney, totalOf } from '@rotortech-tes/shared';
import { Nav } from '../components/Nav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Tag } from '../components/Tag';
import { Field, Textarea } from '../components/Field';
import { Dialog } from '../components/Dialog';
import { useApproverQueue } from '../hooks/useRecords';
import { useRecordWithExpenses } from '../hooks/useRecordWithExpenses';
import { useAuth } from '../context/AuthContext';
import { callApproveRecord, callRejectRecord } from '../lib/callables';

export function Approver() {
  const { profile } = useAuth();
  const queue = useApproverQueue();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const active = useRecordWithExpenses(activeId);

  if (activeId && active) {
    return (
      <div className="page">
        <Nav label={`${profile?.name} · Department Head`} />
        <div className="page-head">
          <Button variant="ghost" onClick={() => setActiveId(null)}>
            ← Back to queue
          </Button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '12px 0 4px' }}>
            <h2 style={{ margin: 0 }}>{active.tesNo}</h2>
            <Tag variant="outline">Pending Approval</Tag>
          </div>
          <p className="text-muted" style={{ margin: '0 0 20px' }}>
            {active.purpose}
          </p>

          <Card style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, fontSize: 13 }}>
              <InfoCell label="Employee" value={active.employeeName} />
              <InfoCell label="Employee ID" value={active.employeeId} />
              <InfoCell label="Project Code" value={active.projectCode || '—'} />
              <InfoCell label="Location" value={active.location || '—'} />
              <InfoCell label="Period" value={`${fmtDate(active.startDate || null)} – ${fmtDate(active.endDate || null)}`} />
              <InfoCell label="Advance" value={fmtMoney(active.advanceAmount)} />
            </div>
          </Card>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Bill No</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {active.expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.category}</td>
                    <td className="text-muted">{fmtDate(ex.date)}</td>
                    <td>{ex.description}</td>
                    <td className="text-muted">{ex.billNo || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(ex.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ fontWeight: 600 }}>
                    Total
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(totalOf(active.expenses))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {error && <p className="auth-error">{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button
              variant="secondary"
              onClick={() => {
                setRejectComment('');
                setRejectOpen(true);
              }}
              disabled={busy}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await callApproveRecord(active.id);
                  setActiveId(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not approve this TES.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Approve
            </Button>
          </div>
        </div>

        {rejectOpen && (
          <Dialog
            title={`Send ${active.tesNo} back to employee?`}
            actions={
              <>
                <Button variant="secondary" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={busy || !rejectComment.trim()}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await callRejectRecord(active.id, rejectComment);
                      setRejectOpen(false);
                      setActiveId(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Could not send this TES back.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Send back
                </Button>
              </>
            }
          >
            <Field label="What needs to change?">
              <Textarea
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g. Attach the hotel bill for Aug 10"
              />
            </Field>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <Nav label={`${profile?.name} · Department Head`} />
      <div className="page-head">
        <h2 style={{ margin: '0 0 4px' }}>Pending Approvals</h2>
        <p className="text-muted" style={{ margin: '0 0 20px', fontSize: 14 }}>
          {queue === null
            ? 'Loading…'
            : `${queue.length} ${queue.length === 1 ? 'submission' : 'submissions'} awaiting your review`}
        </p>
        {queue && queue.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>TES No</th>
                  <th>Purpose</th>
                  <th>Period</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>{r.tesNo}</td>
                    <td>{r.purpose}</td>
                    <td className="text-muted">{`${fmtDate(r.startDate || null)} – ${fmtDate(r.endDate || null)}`}</td>
                    <td style={{ textAlign: 'right' }}>{fmtMoney(r.expensesTotal)}</td>
                    <td className="text-muted">{fmtDate(r.submittedDate)}</td>
                    <td>
                      <Button variant="secondary" onClick={() => setActiveId(r.id)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {queue && queue.length === 0 && <p className="text-muted" style={{ padding: '24px 0' }}>All caught up — no pending approvals.</p>}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ opacity: 0.5 }}>{label}</span>
      <br />
      {value}
    </div>
  );
}
