import { Modal, StyleSheet, Text, View } from 'react-native';
import { Corners } from './Corners';
import { colors, fonts } from '../theme';

export function Dialog({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Corners />
          <Text style={styles.title}>{title}</Text>
          <View style={styles.body}>{children}</View>
          <View style={styles.actions}>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(43,43,45,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, padding: 20, gap: 12 },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
});
