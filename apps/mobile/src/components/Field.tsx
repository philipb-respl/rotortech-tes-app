import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, textMuted70 } from '../theme';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps & { multiline?: boolean }) {
  return (
    <TextInput
      placeholderTextColor="rgba(29,31,32,0.4)"
      {...props}
      style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: 'top' }, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: textMuted70, fontFamily: fonts.body },
  input: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 4,
    fontFamily: fonts.body,
  },
});
