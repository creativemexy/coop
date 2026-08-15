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

export const layout = {
  pagePadding: 20,
  radius: 16,
  touchTarget: 48,
  shadow: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: {},
  }),
};
