import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Card } from '../components/Card';
import { Field, Input } from '../components/Field';
import { Button } from '../components/Button';

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim() && cred.user) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <div className="auth-brand">
          <img src="/rotortech-logo.png" alt="Rotortech" style={{ height: 22 }} />
        </div>
        <h3 style={{ margin: 0 }}>{mode === 'signin' ? 'Sign in' : 'Create your account'}</h3>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
          Travel Expense Settlement — Dept Head, Accounts and Admin console.
        </p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vikram Shah" required />
            </Field>
          )}
          <Field label="Work email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@rotortech.in"
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </Field>
          {error && <div className="auth-error">{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <div className="form-actions-inline">
          <span className="text-muted" style={{ fontSize: 12 }}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function friendlyAuthError(message: string): string {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('auth/email-already-in-use')) return 'That email already has an account — sign in instead.';
  if (message.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
  if (message.includes('auth/invalid-email')) return 'That email address looks invalid.';
  return 'Something went wrong. Please try again.';
}
