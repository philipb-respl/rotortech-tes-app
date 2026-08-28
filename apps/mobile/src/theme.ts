/** Industry design-system tokens, ported from
 *  project/_ds/.../styles.css `:root` into React Native values. Colors and
 *  spacing are copied verbatim; px values translate 1:1 to RN's density-
 *  independent units. */
export const colors = {
  bg: '#f2f2f3',
  surface: '#e9e9ea',
  text: '#1d1f20',
  accent: '#5980a6',
  divider: 'rgba(29,31,32,0.16)',

  neutral100: '#f5f5f8',
  neutral200: '#e7e7ea',
  neutral800: '#424244',

  accent100: '#eef6ff',
  accent600: '#597ea3',
  accent700: '#416180',
  accent800: '#2c455d',
  accent900: '#1d2d3d',
};

export const textMuted = 'rgba(29,31,32,0.55)';
export const textMuted70 = 'rgba(29,31,32,0.70)';

export const fonts = {
  heading: 'BarlowCondensed_600SemiBold',
  headingRegular: 'BarlowCondensed_400Regular',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_700Bold',
};

export const space = { 1: 3, 2: 7, 3: 10, 4: 14, 6: 20, 8: 27 };
export const radius = { sm: 2, md: 4, lg: 7 };
