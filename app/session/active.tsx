import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useLibrary } from '@/hooks/useLibrary';

export default function ActiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { activeSession, pauseSession, resumeSession, isLoading } = useSessionStore();
  const { data: libraryBooks = [] } = useLibrary();

  const book = libraryBooks.find((b) => b.id === activeSession?.userBookId);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    
    const calculateElapsed = () => {
      const end = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() : Date.now();
      return Math.floor((end - new Date(activeSession.startTime).getTime()) / 1000) - (activeSession.totalPausedSeconds || 0);
    };

    setElapsed(Math.max(0, calculateElapsed()));
    
    if (activeSession.pausedAt) return; // Don't run interval if paused

    const interval = setInterval(() => {
      setElapsed(Math.max(0, calculateElapsed()));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h === '00' ? '' : h + ':'}${m}:${s}`;
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: Colors.primary }} />;
  }

  if (!activeSession || !book) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.onPrimary, opacity: 0.8, marginBottom: 20 }}>No active session found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.onPrimary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPaused = !!activeSession.pausedAt;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Session</Text>
        <TouchableOpacity hitSlop={12}>
          <MaterialIcons name="more-vert" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
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
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author ?? 'Unknown'}</Text>
          <Text style={styles.bookPage}>Page {activeSession.startPage} of {book.total_pages ?? '?'}</Text>
        </View>
      </View>

      {/* Timer display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerValue, isPaused && { opacity: 0.7 }]}>{formatTime(elapsed)}</Text>
        <Text style={styles.timerLabel}>{isPaused ? 'Session Paused' : 'Session Time'}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlSecondary}>
          <MaterialIcons name="replay-10" size={28} color={`${Colors.onPrimary}99`} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlPrimary}
          onPress={() => isPaused ? resumeSession() : pauseSession()}
        >
          <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={36} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlSecondary}>
          <MaterialIcons name="forward-10" size={28} color={`${Colors.onPrimary}99`} />
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackMd,
  },
  headerTitle: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
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
    color: Colors.onPrimary,
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: `${Colors.onPrimary}BB`,
    fontSize: 14,
  },
  bookPage: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}88`,
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
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  timerLabel: {
    ...Typography.styles.labelLg,
    color: `${Colors.onPrimary}88`,
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
    backgroundColor: Colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.overlay,
  },
  controlSecondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: `${Colors.onPrimary}44`,
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
    backgroundColor: `${Colors.onPrimary}22`,
    borderWidth: 1.5,
    borderColor: `${Colors.onPrimary}44`,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  finishNote: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}55`,
    textAlign: 'center',
    fontSize: 11,
  },
});
