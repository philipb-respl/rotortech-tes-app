import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fmtMoney, fmtPeriod, statusSteps, type TesRecord } from '@rotortech-tes/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, CardKicker } from '../components/Card';
import { Button } from '../components/Button';
import { CheckIcon } from '../components/Icons';
import { colors, fonts, textMuted } from '../theme';

export function StatusScreen({ record, onBack }: { record: TesRecord; onBack: () => void }) {
  const steps = statusSteps(record);

  return (
    <View style={styles.flex}>
      <ScreenHeader title={record.tesNo} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.purpose}>{record.purpose}</Text>
        <Text style={styles.meta}>
          {fmtPeriod(record.startDate || null, record.endDate || null)} · {fmtMoney(record.expensesTotal)}
        </Text>

        <View style={styles.steps}>
          {steps.map((s) => (
            <View key={s.label} style={styles.stepRow}>
              <View style={[styles.stepDot, s.done && styles.stepDotDone]}>{s.done && <CheckIcon />}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepDate}>{s.dateFmt}</Text>
              </View>
            </View>
          ))}
        </View>

        {record.stage === 'accounts_entry' && (
          <Card style={{ padding: 12 }}>
            <CardKicker>Settlement</CardKicker>
            <View style={styles.settleGrid}>
              <SettleCell label="Advance" value={fmtMoney(record.advanceAmount)} />
              <SettleCell label="Expense Approved" value={fmtMoney(record.expenseApproved)} />
              <SettleCell label="Balance to Employee" value={fmtMoney(record.balanceEmployee)} />
              <SettleCell label="Balance to Company" value={fmtMoney(record.balanceCompany)} />
            </View>
          </Card>
        )}

        <Button variant="secondary" block onPress={onBack}>
          Back to My TES
        </Button>
      </ScrollView>
    </View>
  );
}

function SettleCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settleCell}>
      <Text style={styles.settleLabel}>{label}</Text>
      <Text style={styles.settleValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
  purpose: { fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.75 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: textMuted, marginTop: -10 },
  steps: { gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { borderColor: colors.accent },
  stepLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  stepDate: { fontFamily: fonts.body, fontSize: 11, color: textMuted },
  settleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  settleCell: { width: '45%' },
  settleLabel: { fontFamily: fonts.body, fontSize: 12, color: textMuted },
  settleValue: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
});
