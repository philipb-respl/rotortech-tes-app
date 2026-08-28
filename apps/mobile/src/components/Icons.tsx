import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/** Lucide-style stroke icons, ported 1:1 from the prototype's inline SVGs
 *  (stroke-width 1.5, per the Industry design system's icon guidance). */
function withDefaults(size: number, stroke: string, strokeWidth: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}

export function PlusIcon({ size = 16, color = colors.bg }: { size?: number; color?: string }) {
  return (
    <Svg {...withDefaults(size, color, 1.5)}>
      <Path d="M5 12h14" />
      <Path d="M12 5v14" />
    </Svg>
  );
}

export function BackIcon({ size = 18, color = colors.text }: { size?: number; color?: string }) {
  return (
    <Svg {...withDefaults(size, color, 1.5)}>
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

export function TrashIcon({ size = 14, color = colors.text }: { size?: number; color?: string }) {
  return (
    <Svg {...withDefaults(size, color, 1.5)}>
      <Path d="M3 6h18" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <Path d="M10 11v6" />
      <Path d="M14 11v6" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function CheckIcon({ size = 12, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg {...withDefaults(size, color, 2.5)}>
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function CameraIcon({ size = 22, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg {...withDefaults(size, color, 1.5)}>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </Svg>
  );
}
