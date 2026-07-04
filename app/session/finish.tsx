import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useLibrary, useUpdateBook } from '@/hooks/useLibrary';
import { useSessionStore } from '@/store/sessionStore';
import { useLogSession } from '@/hooks/useReadingSessions';
import { ActivityIndicator } from 'react-native';

export default function SessionFinishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeSession, clearSession } = useSessionStore();
  const { data: libraryBooks = [] } = useLibrary();
  const book = libraryBooks.find((b) => b.id === activeSession?.userBookId);
  const { mutateAsync: logSession, isPending: isLogging } = useLogSession();
  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateBook();
  const isPending = isLogging || isUpdating;

  const [endTime] = useState(() => new Date());
  const [endPage, setEndPage] = useState(book ? String(book.current_page) : '');
  const [notes, setNotes] = useState('');

  if (!activeSession || !book) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
         <Text style={{ color: Colors.onSurface }}>No active session to finish.</Text>
         <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: Colors.primary }}>Go Back</Text>
         </TouchableOpacity>
      </View>
    );
  }

  const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - new Date(activeSession.startTime).getTime()) / 1000) - (activeSession.totalPausedSeconds || 0));
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const parsedEnd = parseInt(endPage, 10);
  const isValidNumber = !isNaN(parsedEnd);
  
  // Real-time validation state
  let errorMessage: string | null = null;
  if (isValidNumber) {
    if (parsedEnd < activeSession.startPage) {
      errorMessage = `Must be at least page ${activeSession.startPage}.`;
    } else if (book.total_pages && parsedEnd > book.total_pages) {
      errorMessage = `Cannot exceed total pages (${book.total_pages}).`;
    }
  }

  const isSaveDisabled = isPending || (isValidNumber && errorMessage !== null);

  const pagesRead = Math.max(0, (isNaN(parsedEnd) ? book.current_page : parsedEnd) - activeSession.startPage);
  const pace = durationMinutes > 0 ? Math.round(pagesRead / (durationMinutes / 60)) : 0;

  const handleSave = async () => {
    if (errorMessage) {
      Alert.alert('Invalid Page', errorMessage);
      return;
    }

    try {
      await logSession({
        userBookId: activeSession.userBookId,
        startTime: new Date(activeSession.startTime),
        endTime,
        startPage: activeSession.startPage,
        endPage: isNaN(parsedEnd) ? book.current_page : parsedEnd,
        pausedSeconds: activeSession.totalPausedSeconds || 0,
        notes: notes.trim() || undefined,
      });

      let isFinished = false;
      const finalPage = isNaN(parsedEnd) ? book.current_page : parsedEnd;
      if (book.total_pages && finalPage >= book.total_pages) {
        await updateBook({ userBookId: activeSession.userBookId, status: 'finished' });
        isFinished = true;
      }

      await clearSession();

      if (isFinished) {
        Alert.alert(
          'Congratulations! 🎉',
          "You've finished this book! It has been moved to your 'Finished' tab.",
          [{ text: 'Awesome', onPress: () => router.replace('/(tabs)/dashboard') }]
        );
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (e) {
      console.warn('Failed to save session', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Complete</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy / celebration */}
        <View style={styles.celebrationCard}>
          <MaterialIcons name="emoji-events" size={48} color={Colors.onPrimaryContainer} />
          <Text style={styles.celebrationText}>Great reading session!</Text>
          <Text style={styles.celebrationSub}>{durationMinutes} minutes · {pagesRead} pages</Text>
        </View>

        {/* Session recap */}
        <View style={[styles.recapCard, Shadows.card]}>
          {/* Book */}
          <View style={styles.bookRow}>
            <View style={styles.cover}>
              <Image source={{ uri: book.cover_url ?? undefined }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author ?? 'Unknown'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="Duration" value={`${durationMinutes}m`} />
            <StatItem label="Pages Read" value={String(pagesRead)} />
            <StatItem label="Pace" value={`${pace} p/h`} />
          </View>
        </View>

        {/* End page input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT PAGE</Text>
          <TextInput
            style={[styles.pageInput, errorMessage ? { borderColor: Colors.error, borderWidth: 1 } : null]}
            value={endPage}
            onChangeText={setEndPage}
            keyboardType="numeric"
            placeholder={String(book.current_page)}
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
          />
          <Text style={[styles.pageHint, errorMessage ? { color: Colors.error } : null]}>
            {errorMessage || 'Update your last page read'}
          </Text>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SESSION NOTES (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="How was this reading session? Any thoughts on the book?"
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
            textAlignVertical="top"
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.primaryButton, isSaveDisabled && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={isSaveDisabled}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Save Session</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/share/session/latest')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="share" size={18} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Share Reading Recap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  headerTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  celebrationCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    gap: Spacing.base,
  },
  trophyEmoji: {
    fontSize: 48,
  },
  celebrationText: {
    ...Typography.styles.titleSm,
    color: Colors.onPrimaryContainer,
  },
  celebrationSub: {
    ...Typography.styles.bodyMd,
    color: Colors.onPrimaryContainer,
    opacity: 0.8,
  },
  recapCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
    ...Shadows.card,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  bookTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.stackSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.outlineVariant,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.styles.numericXl,
    fontSize: 22,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    ...Typography.styles.labelSm,
    color: Colors.primary,
    marginLeft: 4,
  },
  pageInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  pageHint: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
    marginLeft: 4,
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
    minHeight: 100,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.button,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.xl,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.primary,
  },
});
