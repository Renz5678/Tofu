import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useLibrary } from '@/hooks/useLibrary';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { calculateElapsedSeconds, formatSessionTime } from '@/lib/timer';

export default function ActiveSessionScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { activeSession, pauseSession, resumeSession, isLoading } = useSessionStore();
  const { data: libraryBooks = [] } = useLibrary();

  const book = libraryBooks.find((b) => b.id === activeSession?.userBookId);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) return;

    setElapsed(calculateElapsedSeconds(activeSession));

    if (activeSession.pausedAt) return; // Don't run interval if paused

    const interval = setInterval(() => {
      setElapsed(calculateElapsedSeconds(activeSession));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const isPaused = !!activeSession?.pausedAt;

  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (activeSession && !isPaused) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.7, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(1);
    }
  }, [isPaused, activeSession]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.primary }} />;
  }

  if (!activeSession || !book) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.onPrimary, opacity: 0.8, marginBottom: 20 }}>
          No active session found.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Session</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Book info */}
      <View style={styles.bookRow}>
        <View style={styles.sessionCover}>
          <Image
            source={{ uri: book.cover_url ?? undefined }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor}>{book.author ?? 'Unknown'}</Text>
          <Text style={styles.bookPage}>
            Page {activeSession.startPage} of {book.total_pages ?? '?'}
          </Text>
        </View>
      </View>

      {/* Timer display */}
      <Animated.View style={[styles.timerContainer, animatedStyle]}>
        <Text style={[styles.timerValue, isPaused && { opacity: 0.7 }]}>
          {formatSessionTime(elapsed)}
        </Text>
        <Text style={styles.timerLabel}>{isPaused ? 'Session Paused' : 'Session Active'}</Text>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlPrimary}
          onPress={() => (isPaused ? resumeSession() : pauseSession())}
        >
          <MaterialIcons
            name={isPaused ? 'play-arrow' : 'pause'}
            size={36}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Finish session button */}
      <View style={[styles.finishArea, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => router.replace('/session/finish')}
          activeOpacity={0.85}
        >
          <Text style={styles.finishButtonText}>Finish Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.containerPadding,
      paddingBottom: Spacing.stackMd,
    },
    headerTitle: {
      ...Typography.styles.labelLg,
      color: colors.onPrimary,
      opacity: 0.8,
    },
    bookRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.containerPadding,
      gap: Spacing.stackMd,
      marginBottom: Spacing.stackLg,
    },
    sessionCover: {
      width: 64,
      height: 88,
      borderRadius: Radius.md,
      overflow: 'hidden',
      ...Shadows.overlay,
    },
    bookInfo: {
      flex: 1,
      gap: 4,
    },
    bookTitle: {
      ...Typography.styles.titleSm,
      color: colors.onPrimary,
    },
    bookAuthor: {
      ...Typography.styles.bodyMd,
      color: `${colors.onPrimary}BB`,
      fontSize: 14,
    },
    bookPage: {
      ...Typography.styles.labelSm,
      color: `${colors.onPrimary}88`,
    },
    timerContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.stackLg,
    },
    timerValue: {
      fontFamily: 'HankenGrotesk_700Bold',
      fontSize: 64,
      lineHeight: 72,
      letterSpacing: -2,
      color: colors.onPrimary,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    timerLabel: {
      ...Typography.styles.labelLg,
      color: `${colors.onPrimary}88`,
      marginTop: Spacing.base,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.stackLg,
      paddingVertical: Spacing.stackMd,
    },
    controlPrimary: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.onPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.overlay,
    },
    controlSecondary: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1.5,
      borderColor: `${colors.onPrimary}44`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishArea: {
      paddingHorizontal: Spacing.containerPadding,
      paddingTop: Spacing.stackLg,
      alignItems: 'center',
      gap: Spacing.base,
    },
    finishButton: {
      width: '100%',
      backgroundColor: `${colors.onPrimary}22`,
      borderWidth: 1.5,
      borderColor: `${colors.onPrimary}44`,
      borderRadius: Radius.xl,
      paddingVertical: 16,
      alignItems: 'center',
    },
    finishButtonText: {
      ...Typography.styles.labelLg,
      color: colors.onPrimary,
    },
    finishNote: {
      ...Typography.styles.labelSm,
      color: `${colors.onPrimary}55`,
      textAlign: 'center',
      fontSize: 11,
    },
  });
