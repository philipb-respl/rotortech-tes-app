import { useState, type FormEvent } from 'react';
import { supabase } from '../supabase';
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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      } else {
        // `data.name` lands in raw_user_meta_data, which the
        // on_auth_user_created trigger reads to seed profiles.name.
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (signUpError) throw signUpError;
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

/** GoTrue's messages are mostly readable already, but a few leak
 *  implementation detail; rewrite those and pass the rest through. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'That email already has an account — sign in instead.';
  }
  if (m.includes('password should be at least')) return 'Password must be at least 6 characters.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'That email address looks invalid.';
  if (m.includes('email not confirmed')) return 'Check your inbox and confirm your email address first.';
  return message || 'Something went wrong. Please try again.';
}
