import { useState, useEffect } from 'react';
import { AccessibilityInfo, useColorScheme, PixelRatio } from 'react-native';
import { colors, darkColors } from './theme';

export interface AccessibilitySettings {
  /** Respect the OS "reduce motion" setting; disable decorative/purposeful animations. */
  reduceMotion: boolean;
  /** True when the OS "bold text" accessibility setting is on (approximates high contrast). */
  boldText: boolean;
  /** True when the OS invert-colors / screen reader high-contrast mode is active. */
  highContrast: boolean;
  /** Current dynamic type scale (e.g. 1.0 default, 1.3 large). */
  fontScale: number;
  /** Palette to use — derived from color scheme + high contrast. */
  palette: typeof colors;
  /** Resolve a size scaled by the user's dynamic type setting. */
  scale: (size: number) => number;
}

/**
 * Subscribes to OS accessibility settings so every component can adapt
 * (reduced motion, bold text, dynamic type, dark mode) in real time.
 */
export function useAccessibility(): AccessibilitySettings {
  const scheme = useColorScheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [boldText, setBoldText] = useState(false);
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    AccessibilityInfo.isBoldTextEnabled().then(setBoldText).catch(() => {});

    const mo = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const bo = AccessibilityInfo.addEventListener('boldTextChanged', setBoldText);
    if (mo?.remove) unsubs.push(() => mo.remove());
    if (bo?.remove) unsubs.push(() => bo.remove());

    return () => { unsubs.forEach((u) => u()); };
  }, []);

  const highContrast = boldText;
  const isDark = scheme === 'dark';
  const palette = isDark ? darkColors : colors;

  return {
    reduceMotion,
    boldText,
    highContrast,
    fontScale,
    palette,
    scale: (size: number) => Math.round(size * fontScale),
  };
}

/** Whether the OS reduce-motion setting is on (module-level for use outside React). */
export function useReduceMotion(): boolean {
  return useAccessibility().reduceMotion;
}
