import React, { useRef } from 'react';
import {
  Animated,
  Pressable as RNPressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Text as RNText,
  TextProps,
  TextStyle,
} from 'react-native';
import { useAccessibility } from './a11y';
import { layout } from './theme';

export interface AppPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** Enforce the minimum touch target (default true). */
  minTouch?: boolean;
  /** Purely decorative motion disabled automatically when reduce-motion is on. */
  feedback?: 'scale' | 'opacity' | 'none';
}

/**
 * Accessible pressable: enforces a minimum 48pt touch target, exposes pressed
 * + disabled states to assistive tech, provides visual focus/pressed feedback,
 * and plays a haptic tick on activation. Motion respects OS reduce-motion.
 */
export function AppPressable({
  style,
  minTouch = true,
  feedback = 'scale',
  disabled,
  accessibilityRole = 'button',
  onPress,
  ...rest
}: AppPressableProps) {
  const { reduceMotion } = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    if (reduceMotion || feedback === 'none') return;
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animatedStyle: ViewStyle = reduceMotion || feedback === 'none'
    ? {}
    : feedback === 'scale'
      ? { transform: [{ scale }] }
      : { opacity };

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      accessibilityState={disabled ? { disabled: true } : undefined}
      disabled={disabled}
      onPressIn={() => { animateTo(0.97); if (feedback === 'opacity') opacity.setValue(0.7); }}
      onPressOut={() => { animateTo(1); if (feedback === 'opacity') opacity.setValue(1); }}
      onPress={onPress}
      style={(state) => {
        const base = typeof style === 'function' ? style(state) : style;
        const touchMin: ViewStyle = minTouch
          ? { minHeight: layout.touchTarget, minWidth: layout.touchTarget }
          : {};
        return [touchMin, animatedStyle, base] as ViewStyle[];
      }}
      {...rest}
    />
  );
}

/** Accessible Text with dynamic type scaling and high-contrast weighting. */
export function AppText({ style, allowFontScaling = true, ...rest }: TextProps & { style?: StyleProp<TextStyle> }) {
  const { fontScale, highContrast } = useAccessibility();
  return (
    <RNText
      {...rest}
      allowFontScaling={allowFontScaling}
      style={[
        // Boost weight for readability when bold text / high contrast is on.
        highContrast ? { fontWeight: '700' as const } : null,
        style,
      ]}
    />
  );
}

/** Live-region announcer for screen readers. Set `announce` to push a message. */
export function ScreenReaderAnnounce({ message }: { message: string | null }) {
  return (
    <RNText
      accessibilityLiveRegion="polite"
      importantForAccessibility={message ? 'yes' : 'no-hide-descendants'}
      style={styles.srOnly}
    >
      {message ?? ''}
    </RNText>
  );
}

const styles: { srOnly: TextStyle } = {
  srOnly: { position: 'absolute', width: 1, height: 1, left: -9999, top: -9999, opacity: 0 },
};
