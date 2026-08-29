import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, textMuted70 } from '../theme';

/** A native <select> stand-in: tap to open a bottom sheet of options. Kept
 *  as a plain custom component (no @react-native-picker/picker dependency)
 *  since the option set here is always small and fixed (expense
 *  categories). */
export function PickerField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close">
          <View style={styles.sheet}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.option, opt === value && styles.optionActive]}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: opt === value }}
              >
                <Text style={[styles.optionText, opt === value && { color: colors.accent700 }]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: textMuted70, fontFamily: fonts.body },
  trigger: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 15, color: colors.text, fontFamily: fonts.body },
  chevron: { fontSize: 16, color: textMuted70 },
  backdrop: { flex: 1, backgroundColor: 'rgba(43,43,45,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, paddingVertical: 8, paddingBottom: 28 },
  option: { paddingVertical: 14, paddingHorizontal: 20 },
  optionActive: { backgroundColor: colors.accent100 },
  optionText: { fontSize: 16, fontFamily: fonts.body, color: colors.text },
});
