import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../supabase';
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
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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

/** GoTrue's messages are mostly readable already; rewrite the few that
 *  leak implementation detail and pass the rest through. */
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
