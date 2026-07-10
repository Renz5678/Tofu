import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useSessionStore } from '@/store/sessionStore';
import { calculateElapsedSeconds, formatSessionTime } from '@/lib/timer';

export function GlobalSessionBanner() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { activeSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    
    setElapsed(calculateElapsedSeconds(activeSession));
    
    if (activeSession.pausedAt) return;

    const interval = setInterval(() => {
      setElapsed(calculateElapsedSeconds(activeSession));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession]);

  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (activeSession && !activeSession.pausedAt) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1);
    }
  }, [activeSession?.pausedAt, activeSession]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!activeSession) return null;

  const isPaused = !!activeSession.pausedAt;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.container, { width: width - Spacing.containerPadding * 2 }]}
    >
      <TouchableOpacity 
        style={styles.content} 
        onPress={() => router.push('/session/active')}
        activeOpacity={0.9}
      >
        <View style={styles.leftContent}>
          <Animated.View style={[styles.indicator, isPaused && styles.indicatorPaused, animatedIndicatorStyle]} />
          <View>
            <Text style={styles.title} numberOfLines={1}>{activeSession.bookTitle || 'Reading Session'}</Text>
            <Text style={styles.subtitle}>{isPaused ? 'Paused' : 'Active'} · Page {activeSession.startPage}</Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.timer}>{formatSessionTime(elapsed)}</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.onPrimaryContainer} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.stackMd,
    left: Spacing.containerPadding,
    backgroundColor: colors.primaryContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
    elevation: 8, // higher elevation to float over other elements
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.stackMd,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
    flex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  indicatorPaused: {
    backgroundColor: colors.onSurfaceVariant,
  },
  title: {
    ...Typography.styles.labelLg,
    color: colors.onPrimaryContainer,
  },
  subtitle: {
    ...Typography.styles.labelSm,
    color: colors.onPrimaryContainer,
    opacity: 0.7,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
  },
  timer: {
    ...Typography.styles.numericXl,
    fontSize: 20,
    color: colors.onPrimaryContainer,
    fontVariant: ['tabular-nums'],
  },
});
