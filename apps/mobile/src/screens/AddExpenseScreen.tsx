import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { EXPENSE_CATEGORIES, todayIso, type ExpenseCategory } from '@rotortech-tes/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { Field, Input } from '../components/Field';
import { PickerField } from '../components/PickerField';
import { DateField, isValidIsoDate } from '../components/DateField';
import { Button } from '../components/Button';
import { CameraIcon } from '../components/Icons';
import { saveNewExpense } from '../lib/records';
import { colors, fonts, textMuted70 } from '../theme';

export function AddExpenseScreen({ recordId, onCancel, onSaved }: { recordId: string; onCancel: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState<ExpenseCategory>('Travel Fare');
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billNo, setBillNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const invalid = !amount || Number(amount) <= 0 || !isValidIsoDate(date);

  async function pickReceipt(source: 'camera' | 'library') {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `Allow ${source === 'camera' ? 'camera' : 'photo library'} access to attach a receipt.`);
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  function chooseReceiptSource() {
    Alert.alert('Add receipt photo', undefined, [
      { text: 'Take photo', onPress: () => pickReceipt('camera') },
      { text: 'Choose from library', onPress: () => pickReceipt('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function save() {
    setSaving(true);
    try {
      await saveNewExpense(
        recordId,
        { category, date, amount: Number(amount), description, billNo, remarks },
        receiptUri,
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add Expense" onBack={onCancel} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <PickerField label="Category" value={category} options={EXPENSE_CATEGORIES} onChange={(v) => setCategory(v as ExpenseCategory)} />
        <View style={styles.row}>
          <View style={styles.half}>
            <DateField label="Date" value={date} onChange={setDate} />
          </View>
          <View style={styles.half}>
            <Field label="Amount (₹)">
              <Input value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
            </Field>
          </View>
        </View>
        <Field label="Description">
          <Input value={description} onChangeText={setDescription} placeholder="e.g. Ahmedabad to Bhuj cab" />
        </Field>
        <Field label="Bill / Ticket No">
          <Input value={billNo} onChangeText={setBillNo} placeholder="Optional" />
        </Field>
        <Field label="Receipt">
          <Pressable style={styles.receiptSlot} onPress={chooseReceiptSource}>
            {receiptUri ? (
              <Image source={{ uri: receiptUri }} style={styles.receiptImage} resizeMode="cover" />
            ) : (
              <View style={styles.receiptPlaceholder}>
                <CameraIcon />
                <Text style={styles.receiptPlaceholderText}>Tap to add receipt photo</Text>
              </View>
            )}
          </Pressable>
        </Field>
        <Field label="Remarks">
          <Input value={remarks} onChangeText={setRemarks} placeholder="Optional" multiline numberOfLines={2} />
        </Field>
        <Button variant="primary" block disabled={invalid} loading={saving} onPress={save}>
          Save Expense
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 100, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  receiptSlot: {
    height: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  receiptImage: { width: '100%', height: '100%' },
  receiptPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  receiptPlaceholderText: { fontFamily: fonts.body, fontSize: 12, color: textMuted70 },
});
