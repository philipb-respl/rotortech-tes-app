import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors, fonts, textMuted } from '../theme';

export function NotEmployeeScreen({ role }: { role: string }) {
  return (
    <View style={styles.center}>
      <Card style={styles.card}>
        <Text style={styles.h1}>Use the Rotortech TES web console</Text>
        <Text style={styles.body}>
          Your account's role ({role}) reviews and processes TES submissions on the web console, not this app. Sign
          in there instead.
        </Text>
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
});
