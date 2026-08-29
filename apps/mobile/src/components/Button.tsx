import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Corners } from './Corners';
import { colors, fonts } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** For icon-only buttons: children stays '' (nothing visible next to the
   *  icon) but screen readers still need a real name — pass it here. */
  accessibilityLabel?: string;
}

/** Primary/secondary buttons wear the blueprint frame + corner marks, per
 *  the Industry design system; ghost (text) buttons don't. */
export function Button({
  children,
  onPress,
  variant = 'secondary',
  disabled,
  loading,
  block,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const framed = variant === 'primary' || variant === 'secondary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        block && styles.block,
        pressed && !disabled && variant === 'primary' && { backgroundColor: colors.accent700 },
        pressed && !disabled && variant === 'secondary' && { backgroundColor: 'rgba(29,31,32,0.08)' },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {framed && <Corners />}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? colors.bg : colors.accent} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.label,
                variant === 'primary' && { color: colors.bg },
                variant === 'secondary' && { color: colors.text },
                variant === 'ghost' && { color: colors.accent },
              ]}
            >
              {children}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 0,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: 'transparent', borderColor: colors.divider },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 4 },
  block: { width: '100%', marginTop: 6 },
  disabled: { opacity: 0.45 },
  label: { fontFamily: fonts.heading, fontSize: 14 },
});
