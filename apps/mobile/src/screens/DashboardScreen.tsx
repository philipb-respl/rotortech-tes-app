import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { fmtMoney, fmtPeriod, STAGE_LABEL, type Stage, type TesRecord } from '@rotortech-tes/shared';
import { Card } from '../components/Card';
import { Tag } from '../components/Tag';
import { Button } from '../components/Button';
import { PlusIcon } from '../components/Icons';
import { useMyRecords } from '../hooks/useMyRecords';
import { callCreateDraftTes } from '../lib/callables';
import { colors, fonts, textMuted } from '../theme';

const TAG_VARIANT: Record<Stage, 'neutral' | 'outline' | 'accent'> = {
  draft: 'neutral',
  submitted: 'outline',
  approved: 'outline',
  accounts_entry: 'accent',
};

export function DashboardScreen({
  onOpen,
  onCreated,
}: {
  onOpen: (recordId: string, stage: Stage) => void;
  onCreated: (recordId: string) => void;
}) {
  const records = useMyRecords();
  const [creating, setCreating] = useState(false);

  async function startNew() {
    setCreating(true);
    try {
      const res = await callCreateDraftTes();
      onCreated(res.data.recordId);
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.h1}>My TES</Text>
        <Button variant="primary" icon={<PlusIcon />} loading={creating} onPress={startNew} accessibilityLabel="New TES">
          {''}
        </Button>
      </View>
      <FlatList
        data={records ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          records === null ? null : <Text style={styles.empty}>No TES yet — tap + to start one.</Text>
        }
        renderItem={({ item }) => <RecordCard record={item} onPress={() => onOpen(item.id, item.stage)} />}
      />
    </View>
  );
}

function RecordCard({ record, onPress }: { record: TesRecord; onPress: () => void }) {
  return (
    <Card onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.kicker}>{record.tesNo}</Text>
        <Tag variant={TAG_VARIANT[record.stage]}>{STAGE_LABEL[record.stage]}</Tag>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {record.purpose || 'Untitled trip'}
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.meta}>{fmtPeriod(record.startDate || null, record.endDate || null)}</Text>
        <Text style={styles.total}>{fmtMoney(record.expensesTotal)}</Text>
      </View>
      {record.rejected && !!record.approverComment && (
        <Text style={styles.rejected}>Changes requested: {record.approverComment}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 6, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h1: { fontFamily: fonts.heading, fontSize: 24, color: colors.text },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 12 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: textMuted, textAlign: 'center', paddingVertical: 40 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: textMuted },
  title: { fontFamily: fonts.heading, fontSize: 17, color: colors.text, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: textMuted },
  total: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  rejected: { fontFamily: fonts.body, fontSize: 12, color: colors.accent700, marginTop: 2 },
});
