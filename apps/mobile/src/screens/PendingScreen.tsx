import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../supabase';
import { bootstrapFirstAdmin } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors, fonts, textMuted } from '../theme';

export function PendingScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function becomeFirstAdmin() {
    setBusy(true);
    setError('');
    try {
      await bootstrapFirstAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.center}>
      <Card style={styles.card}>
        <Text style={styles.h1}>Account created</Text>
        <Text style={styles.body}>
          Your account is waiting for an admin to assign a role and activate it. You'll be able to sign in once
          that's done.
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button variant="secondary" loading={busy} onPress={becomeFirstAdmin}>
          I'm setting this up — make me the first admin
        </Button>
        <Button variant="ghost" onPress={() => void supabase.auth.signOut()}>
          Sign out
        </Button>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, gap: 12, padding: 24 },
  h1: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 13, color: textMuted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent700 },
});
