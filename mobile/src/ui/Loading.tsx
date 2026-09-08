import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';
import { useAccessibility } from './a11y';
import { AppText } from './primitives';
import { layout, spacing, type } from './theme';

/** Accessible loading indicator with an announced label for screen readers. */
export function LoadingView({
  label = 'Loading…',
  light = false,
}: {
  label?: string;
  light?: boolean;
}) {
  const { palette, scale } = useAccessibility();
  const { reduceMotion } = useAccessibility();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, reduceMotion]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={styles.row}
    >
      <Animated.View style={reduceMotion ? undefined : { opacity: pulse }}>
        <ActivityIndicator color={light ? '#fff' : palette.brand} size="small" />
      </Animated.View>
      <AppText style={[styles.label, { color: light ? '#fff' : palette.muted, fontSize: scale(type.small) }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  label: { fontWeight: '500' },
});