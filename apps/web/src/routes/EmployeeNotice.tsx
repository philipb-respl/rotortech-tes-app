import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function EmployeeNotice() {
  return (
    <div className="center-screen">
      <Card className="auth-card">
        <h3 style={{ margin: 0 }}>Use the Rotortech TES mobile app</h3>
        <p className="text-muted" style={{ fontSize: 13 }}>
          Submitting expenses happens in the Rotortech TES mobile app, where you can attach receipt photos on the go.
          This web console is for Department Heads, Accounts and Admin.
        </p>
        <Button variant="ghost" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
