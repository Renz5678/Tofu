import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { readingProgress } from '@/lib/metrics';
import { useLibrary } from '@/hooks/useLibrary';
import { useSessionStore } from '@/store/sessionStore';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { data: libraryBooks = [] } = useLibrary();
  const book = libraryBooks.find((b) => b.id === id);
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  if (!book) return null; // Or a loading/not-found state

  const progress = readingProgress(book.current_page, book.total_pages || 1);

  const handleStartReading = async () => {
    if (activeSession?.userBookId !== book.id) {
      await startSession({
        userBookId: book.id,
        startPage: book.current_page,
        startTime: new Date().toISOString(),
        totalPausedSeconds: 0,
      });
    }
    router.push('/session/active');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Hero cover */}
      <View style={[styles.heroContainer, { height: width * 0.65 }]}>
        <Image
          source={{ uri: book.cover_url }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          blurRadius={20}
        />
        <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>

        {/* Cover image centered */}
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: book.cover_url }}
            style={styles.cover}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Book info */}
        <View style={styles.infoSection}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>
          <View style={styles.metaRow}>
            {book.genres?.map((g) => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{g}</Text>
              </View>
            ))}
            {book.language && (
              <View style={styles.genreChip}>
                <Text style={styles.genreChipText}>{book.language.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress card */}
        <View style={[styles.progressCard, Shadows.card]}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressStat}>{book.current_page}</Text>
              <Text style={styles.progressStatLabel}>Current Page</Text>
            </View>
            <View style={styles.progressDivider} />
            <View>
              <Text style={styles.progressStat}>{book.total_pages}</Text>
              <Text style={styles.progressStatLabel}>Total Pages</Text>
            </View>
            <View style={styles.progressDivider} />
            <View>
              <Text style={styles.progressStat}>{Math.round(progress * 100)}%</Text>
              <Text style={styles.progressStatLabel}>Complete</Text>
            </View>
          </View>
          <ProgressBar progress={progress} height={6} style={{ marginTop: Spacing.stackSm }} />
        </View>

        {/* Start/Continue reading button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartReading}
          activeOpacity={0.85}
        >
          <MaterialIcons name="play-circle" size={22} color={Colors.onPrimary} />
          <Text style={styles.primaryButtonText}>
            {book.current_page > 0 ? 'Continue Reading' : 'Start Reading'}
          </Text>
        </TouchableOpacity>

        {/* Session history placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Sessions</Text>
          <Text style={styles.placeholder}>No sessions yet — start reading to track your progress.</Text>
        </View>

        {/* Notes placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.placeholder}>Tap to add a note about this book.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.stackMd,
  },
  heroOverlay: {
    backgroundColor: 'rgba(45,58,71,0.70)',
  },
  backButton: {
    position: 'absolute',
    left: Spacing.containerPadding,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrapper: {
    width: 120,
    height: 180,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.overlay,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  infoSection: {
    alignItems: 'center',
    gap: Spacing.base,
  },
  bookTitle: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  genreChip: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreChipText: {
    ...Typography.styles.labelSm,
    color: Colors.onSecondaryContainer,
  },
  progressCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressStat: {
    ...Typography.styles.numericXl,
    fontSize: 28,
    color: Colors.primary,
    textAlign: 'center',
  },
  progressStatLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  progressDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: Colors.outlineVariant,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    ...Shadows.button,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  section: {
    gap: Spacing.base,
  },
  sectionTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
  },
  placeholder: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
