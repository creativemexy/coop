import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useAccessibility } from './a11y';
import { AppText, ScreenReaderAnnounce } from './primitives';
import { darkColors, layout, spacing, type } from './theme';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastData {
  id: number;
  message: string;
  kind: ToastKind;
}

/** Accessible toast: announces to screen readers and animates in/out. */
export function Toast({ toast }: { toast: ToastData | null }) {
  const { reduceMotion, scale } = useAccessibility();
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const anims: Animated.CompositeAnimation[] = [];
    if (!reduceMotion) {
      anims.push(
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        ]),
      );
    } else {
      opacity.setValue(1);
    }
    const hideTimer = setTimeout(() => {
      if (!reduceMotion) {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -12, duration: 220, useNativeDriver: true }),
        ]).start(() => setVisible(false));
      } else {
        setVisible(false);
      }
    }, 3200);
    return () => clearTimeout(hideTimer);
  }, [toast, reduceMotion, opacity, translateY]);

  if (!toast || !visible) return null;

  const kindBg =
    toast.kind === 'success' ? darkColors.success :
    toast.kind === 'error' ? darkColors.danger :
    '#2563eb';

  return (
    <>
      <ScreenReaderAnnounce message={toast.message} />
      <Animated.View
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
        style={[styles.toast, { backgroundColor: kindBg, opacity, transform: [{ translateY }] }]}
      >
        <AppText style={[styles.text, { fontSize: scale(type.small) }]}>{toast.message}</AppText>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: layout.radius,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: '90%',
  },
  text: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});