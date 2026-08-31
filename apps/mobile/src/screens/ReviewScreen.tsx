import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fmtDate, fmtMoney, fmtPeriod, totalOf, type TesRecordWithExpenses } from '@rotortech-tes/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { submitRecord } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { colors, fonts, textMuted } from '../theme';

export function ReviewScreen({ record, onBack, onSubmitted }: { record: TesRecordWithExpenses; onBack: () => void; onSubmitted: () => void }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const { toast } = await submitRecord(record.id);
      showToast(toast);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this TES.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Review & Submit" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={{ padding: 12 }}>
          <InfoRow label="Employee" value={record.employeeName} />
          <InfoRow label="Employee ID" value={record.employeeId} />
          <InfoRow label="Project Code" value={record.projectCode || '—'} />
          <InfoRow label="Advance" value={fmtMoney(record.advanceAmount)} />
          <InfoRow label="Location & Period" value={`${record.location} · ${fmtPeriod(record.startDate || null, record.endDate || null)}`} />
          <InfoRow label="Purpose" value={record.purpose} />
        </Card>

        <View style={styles.expenseList}>
          {record.expenses.map((ex) => (
            <View key={ex.id} style={styles.expenseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseCat}>
                  {ex.category} · <Text style={styles.dim}>{fmtDate(ex.date)}</Text>
                </Text>
                <Text style={styles.expenseDesc}>{ex.description}</Text>
              </View>
              <Text style={styles.expenseAmt}>{fmtMoney(ex.amount)}</Text>
            </View>
          ))}
          <View style={[styles.expenseRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{fmtMoney(totalOf(record.expenses))}</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Submitting saves a PDF summary to the shared Rotortech Google Drive folder and sends this TES to your
          Department Head for approval.
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button variant="primary" block loading={submitting} onPress={submit}>
          Submit for Approval
        </Button>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  infoRow: { marginBottom: 6 },
  infoLabel: { fontFamily: fonts.body, fontSize: 11, color: textMuted },
  infoValue: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  expenseList: { gap: 8 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(29,31,32,0.08)' },
  expenseCat: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  expenseDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.text, marginTop: 2 },
  expenseAmt: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  dim: { fontFamily: fonts.body, color: textMuted },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: 12, color: textMuted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent700 },
});
