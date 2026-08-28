import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Card } from '../components/Card';
import { Field, Input } from '../components/Field';
import { Button } from '../components/Button';
import { colors, fonts, textMuted } from '../theme';

export function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Image source={require('../../assets/rotortech-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.h1}>{mode === 'signin' ? 'Sign in' : 'Create your account'}</Text>
          <Text style={styles.sub}>Travel Expense Settlement — submit and track your TES.</Text>

          {mode === 'signup' && (
            <Field label="Full name">
              <Input value={name} onChangeText={setName} placeholder="e.g. Anil Kumar" autoCapitalize="words" />
            </Field>
          )}
          <Field label="Work email">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="you@rotortech.in"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </Field>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button variant="primary" block loading={busy} onPress={submit}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}</Text>
            <Button
              variant="ghost"
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(message: string): string {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) return 'Incorrect email or password.';
  if (message.includes('auth/email-already-in-use')) return 'That email already has an account — sign in instead.';
  if (message.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
  if (message.includes('auth/invalid-email')) return 'That email address looks invalid.';
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, gap: 14, padding: 24 },
  logo: { height: 22, width: 160, alignSelf: 'flex-start', marginBottom: 4 },
  h1: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, color: textMuted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent700 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  switchLabel: { fontFamily: fonts.body, fontSize: 12, color: textMuted },
});
