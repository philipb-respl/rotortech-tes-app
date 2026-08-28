import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { callBootstrapFirstAdmin } from '../lib/callables';

export function Pending() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function becomeFirstAdmin() {
    setBusy(true);
    setError('');
    try {
      await callBootstrapFirstAdmin();
      // The users/{uid} onSnapshot listener in AuthContext will pick up
      // the change and re-route automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <h3 style={{ margin: 0 }}>Account created</h3>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Your account is waiting for an admin to assign a role and activate it. You'll be able to sign in here once
          that's done.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <Button variant="secondary" onClick={becomeFirstAdmin} disabled={busy}>
          {busy ? 'Checking…' : "I'm setting this up — make me the first admin"}
        </Button>
        <Button variant="ghost" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
