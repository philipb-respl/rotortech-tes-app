import { View } from 'react-native';
import { colors } from '../theme';

const INK = 'rgba(29,31,32,0.55)';

function Corner({ top, bottom, left, right }: { top?: number; bottom?: number; left?: number; right?: number }) {
  return (
    <View style={{ position: 'absolute', width: 11, height: 11, top, bottom, left, right }} pointerEvents="none">
      <View style={{ position: 'absolute', left: 5, top: 0, width: 1, height: 11, backgroundColor: INK }} />
      <View style={{ position: 'absolute', top: 5, left: 0, width: 11, height: 1, backgroundColor: INK }} />
    </View>
  );
}

/** The "+" registration marks every blueprint-framed element (card,
 *  primary/secondary button, dialog) wears — ported from `.blueprint >
 *  .corner` in the Industry design system's styles.css. */
export function Corners() {
  return (
    <>
      <Corner top={-6} left={-6} />
      <Corner top={-6} right={-6} />
      <Corner bottom={-6} left={-6} />
      <Corner bottom={-6} right={-6} />
    </>
  );
}

export const dividerColor = colors.divider;
