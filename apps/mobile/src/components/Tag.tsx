import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

type Variant = 'accent' | 'neutral' | 'outline';

export function Tag({ variant = 'neutral', children }: { variant?: Variant; children: string }) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, variant === 'accent' && { color: colors.accent800 }, variant === 'outline' && { color: colors.accent }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.neutral800 },
  accent: { backgroundColor: colors.accent100 },
  neutral: { backgroundColor: colors.neutral100 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
});
