import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Corners } from './Corners';
import { colors, fonts, textMuted } from '../theme';
import { Text } from 'react-native';

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.card, style]}>
      <Corners />
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

export function CardKicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 0,
    padding: 12,
    gap: 6,
  },
  kicker: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent, fontFamily: fonts.bodyMedium },
  title: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
});

export { textMuted };
