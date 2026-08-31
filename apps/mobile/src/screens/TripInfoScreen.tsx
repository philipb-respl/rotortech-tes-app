import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TesRecord } from '@rotortech-tes/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { Field, Input } from '../components/Field';
import { DateField, isValidIsoDate } from '../components/DateField';
import { Button } from '../components/Button';
import { updateDraftFields } from '../lib/records';
import { colors, fonts } from '../theme';

export function TripInfoScreen({ record, onBack, onContinue }: { record: TesRecord; onBack: () => void; onContinue: () => void }) {
  const [projectCode, setProjectCode] = useState(record.projectCode);
  const [purpose, setPurpose] = useState(record.purpose);
  const [location, setLocation] = useState(record.location);
  const [startDate, setStartDate] = useState(record.startDate);
  const [endDate, setEndDate] = useState(record.endDate);
  const [advanceAmount, setAdvanceAmount] = useState(record.advanceAmount ? String(record.advanceAmount) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const datesOk = (!startDate || isValidIsoDate(startDate)) && (!endDate || isValidIsoDate(endDate));

  async function saveAndContinue() {
    setSaving(true);
    setError('');
    try {
      // One statement rather than a field-per-request fan-out: the whole
      // form either lands or it doesn't, so a failure halfway can't leave
      // the draft half-edited.
      await updateDraftFields(record.id, {
        projectCode,
        purpose,
        location,
        startDate,
        endDate,
        advanceAmount: Number(advanceAmount) || 0,
      });
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save these trip details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Trip Details" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="Name">
          <Input value={record.employeeName} editable={false} />
        </Field>
        <Field label="Employee ID">
          <Input value={record.employeeId} editable={false} />
        </Field>
        <Field label="Project Code">
          <Input value={projectCode} onChangeText={setProjectCode} placeholder="e.g. PRJ-WF-14" autoCapitalize="characters" />
        </Field>
        <Field label="Purpose">
          <Input value={purpose} onChangeText={setPurpose} placeholder="Reason for travel" multiline numberOfLines={2} />
        </Field>
        <Field label="Location">
          <Input value={location} onChangeText={setLocation} placeholder="City, State" />
        </Field>
        <View style={styles.row}>
          <View style={styles.half}>
            <DateField label="TES Start Date" value={startDate} onChange={setStartDate} />
          </View>
          <View style={styles.half}>
            <DateField label="TES End Date" value={endDate} onChange={setEndDate} />
          </View>
        </View>
        <Field label="Advance Amount (₹)">
          <Input value={advanceAmount} onChangeText={setAdvanceAmount} placeholder="0" keyboardType="numeric" />
        </Field>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button variant="primary" block disabled={!datesOk} loading={saving} onPress={saveAndContinue}>
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 100, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.accent700 },
});
