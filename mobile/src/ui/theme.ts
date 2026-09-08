import { Platform } from 'react-native';

/** Shared visual language for the member app. Keep colours and touch targets here. */
export const colors = {
  brand: '#0B3B60',
  brandDark: '#06263F',
  accent: '#0F766E',
  background: '#F6F8FB',
  surface: '#FFFFFF',
  text: '#122033',
  muted: '#627084',
  border: '#E2E8F0',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B42318',
};

/** Dark-mode equivalents. Surface/hovered tones tuned for contrast on OLED-ish surfaces. */
export const darkColors = {
  brand: '#4FA8E0',
  brandDark: '#1C4E7A',
  accent: '#34C2B0',
  background: '#0B1220',
  surface: '#131C2E',
  text: '#E7EDF6',
  muted: '#9AA8BC',
  border: '#26354C',
  success: '#3FBF6E',
  warning: '#F0B254',
  danger: '#FF6B5E',
};

/** Spacing scale, derived from an 8px grid. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

/** Type scale in points; components multiply by fontScale for dynamic text sizing. */
export const type = {
  caption: 11,
  small: 13,
  body: 15,
  title: 18,
  heading: 22,
  display: 28,
};

export const layout = {
  pagePadding: 20,
  radius: 16,
  /** Minimum touch target per WCAG 2.5.5 / Apple HIG. */
  touchTarget: 48,
  shadow: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: {},
  }),
};