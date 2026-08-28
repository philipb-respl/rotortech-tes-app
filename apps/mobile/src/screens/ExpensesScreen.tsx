import { FlatList, StyleSheet, Text, View } from 'react-native';
import { categoryTotals, fmtDate, fmtMoney, totalOf, type Expense, type TesRecordWithExpenses } from '@rotortech-tes/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Tag } from '../components/Tag';
import { Button } from '../components/Button';
import { TrashIcon } from '../components/Icons';
import { removeExpense } from '../lib/records';
import { colors, fonts, textMuted } from '../theme';

export function ExpensesScreen({
  record,
  onBack,
  onEdit,
  onAddExpense,
  onReview,
}: {
  record: TesRecordWithExpenses;
  onBack: () => void;
  onEdit: () => void;
  onAddExpense: () => void;
  onReview: () => void;
}) {
  const total = totalOf(record.expenses);

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={record.tesNo}
        onBack={onBack}
        right={
          <Button variant="ghost" onPress={onEdit}>
            Edit
          </Button>
        }
      />
      <View style={styles.summary}>
        <Text style={styles.purpose}>{record.purpose}</Text>
        <Text style={styles.meta}>
          {record.location} · {fmtDate(record.startDate || null)} – {fmtDate(record.endDate || null)}
        </Text>
      </View>
      {record.rejected && !!record.approverComment && (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedText}>Changes requested: {record.approverComment}</Text>
        </View>
      )}
      <View style={styles.catRow}>
        {categoryTotals(record.expenses).map((c) => (
          <Tag key={c.label} variant="neutral">{`${c.label} · ${c.amountFmt}`}</Tag>
        ))}
      </View>

      <FlatList
        data={record.expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No expenses added yet.</Text>}
        renderItem={({ item }) => <ExpenseRow expense={item} onRemove={() => removeExpense(record.id, item.id)} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
        </View>
        <Button variant="secondary" block onPress={onAddExpense}>
          + Add Expense
        </Button>
        <Button variant="primary" block disabled={record.expenses.length === 0} onPress={onReview}>
          Review & Submit
        </Button>
      </View>
    </View>
  );
}

function ExpenseRow({ expense, onRemove }: { expense: Expense; onRemove: () => void }) {
  return (
    <Card style={{ padding: 10 }}>
      <View style={styles.rowBetween}>
        <Tag variant="accent">{expense.category}</Tag>
        <Text style={styles.dim}>{fmtDate(expense.date)}</Text>
      </View>
      <Text style={styles.desc}>{expense.description}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.dim}>{expense.billNo || ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.amount}>{fmtMoney(expense.amount)}</Text>
          <Button variant="ghost" icon={<TrashIcon />} onPress={onRemove}>
            {''}
          </Button>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { paddingHorizontal: 20 },
  purpose: { fontFamily: fonts.body, fontSize: 13, color: colors.text, opacity: 0.75 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: textMuted, marginTop: 2 },
  rejectedBox: { marginHorizontal: 20, marginTop: 12, padding: 10, borderWidth: 1, borderColor: colors.accent },
  rejectedText: { fontFamily: fonts.body, fontSize: 12, color: colors.text },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  list: { paddingHorizontal: 20, gap: 10, paddingBottom: 8 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: textMuted, textAlign: 'center', paddingVertical: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dim: { fontFamily: fonts.body, fontSize: 11, color: textMuted },
  desc: { fontFamily: fonts.body, fontSize: 14, color: colors.text, marginTop: 4, marginBottom: 4 },
  amount: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  footer: { borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  totalValue: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
});
