import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Typography } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─────────────────────────────────────────────
// ProgressRing
// ─────────────────────────────────────────────
interface ProgressRingProps {
  progress: number;       // 0–1
  size?: number;          // diameter in px
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  labelText?: string;     // override — defaults to percentage
}

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  color = Colors.primary,
  trackColor,
  showLabel = false,
  labelText,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const defaultTrack = trackColor ?? `${color}1A`; // 10% opacity

  const displayLabel = labelText ?? `${Math.round(progress * 100)}%`;

  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 1000,
      easing: Easing.out(Easing.cubic)
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return { strokeDashoffset };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={defaultTrack}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {showLabel && (
        <View style={[StyleSheet.absoluteFillObject, styles.labelContainer]}>
          <Text style={[styles.label, { color }]}>{displayLabel}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// ProgressBar (slim horizontal)
// ─────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0–1
  height?: number;
  color?: string;
  trackColor?: string;
  style?: object;
}

export function ProgressBar({
  progress,
  height = 4,
  color = Colors.primary,
  trackColor = Colors.secondaryContainer,
  style,
}: ProgressBarProps) {
  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 1000,
      easing: Easing.out(Easing.cubic)
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  return (
    <View
      style={[
        styles.trackBar,
        { height, backgroundColor: trackColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
          animatedStyle
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...Typography.styles.labelSm,
    fontWeight: '700',
  },
  trackBar: {
    width: '100%',
    overflow: 'hidden',
  },
});
