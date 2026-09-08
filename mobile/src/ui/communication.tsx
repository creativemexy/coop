import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useAccessibility } from './a11y';
import { AppText } from './primitives';
import { darkColors, spacing, type } from './theme';

export type BubbleSender = 'mine' | 'theirs';

interface MessageBubbleProps {
  message: string;
  sender: BubbleSender;
  meta: string;
  isDark?: boolean;
  /** Animate the bubble in when a NEW message arrives (communicates arrival). */
  animateIn?: boolean;
}

/**
 * Chat message bubble. `animateIn` slides/fades the bubble in to visually
 * signal a newly arrived message — skipped under reduce-motion. Text scales
 * with dynamic type and is exposed to screen readers with full context.
 */
export function MessageBubble({ message, sender, meta, isDark = false, animateIn = false }: MessageBubbleProps) {
  const { reduceMotion, scale, highContrast } = useAccessibility();
  const progress = useRef(new Animated.Value(animateIn && !reduceMotion ? 0 : 1)).current;

  useEffect(() => {
    if (animateIn && !reduceMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      progress.setValue(1);
    }
  }, [animateIn, reduceMotion, progress]);

  const mine = sender === 'mine';
  const bubbleBg = mine
    ? isDark ? 'rgba(52,194,176,0.9)' : '#173F38'
    : isDark ? 'rgba(255,255,255,0.14)' : '#E5EDEA';
  const textColor = mine
    ? '#fff'
    : isDark ? '#fff' : '#173F38';
  const metaColor = mine ? 'rgba(255,255,255,0.72)' : isDark ? 'rgba(255,255,255,0.55)' : '#627084';

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Animated.View
        accessibilityLabel={`${mine ? 'You' : 'Support'}: ${message}. ${meta}`}
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          highContrast ? { borderWidth: 1, borderColor: mine ? '#0E4F46' : '#9AA8BC' } : null,
          { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
      >
        <AppText style={[styles.message, { color: textColor, fontSize: scale(type.body) }]}>
          {message}
        </AppText>
        <AppText style={[styles.meta, { color: metaColor, fontSize: scale(type.caption) }]}>
          {meta}
        </AppText>
      </Animated.View>
    </View>
  );
}

/**
 * Typing indicator — animated dots that communicate "a reply is on its way".
 * Static under reduce-motion, but the message is still announced.
 */
export function TypingIndicator({ isDark = false }: { isDark?: boolean }) {
  const { reduceMotion, scale } = useAccessibility();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (reduceMotion) {
      dots.forEach((d) => d.setValue(0.4));
      return;
    }
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.delay(400),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [reduceMotion, dots]);

  const dotColor = isDark ? 'rgba(255,255,255,0.7)' : '#627084';

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Support is typing"
      style={[styles.typingRow, isDark && styles.typingDark]}
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { backgroundColor: dotColor, opacity: d, transform: [{ scale: d.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.2] }) }] }]}
        />
      ))}
      <AppText style={[styles.typingText, { color: dotColor, fontSize: scale(type.caption) }]}>
        Support is typing…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', width: '100%', marginVertical: spacing.xs },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  message: { lineHeight: 21 },
  meta: { marginTop: spacing.xs, fontWeight: '600' },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: spacing.xs,
  },
  typingDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  typingText: { fontWeight: '600' },
});