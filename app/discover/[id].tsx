import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BookItem } from '@/lib/openLibrary';
import { useBookStats, useBookReviews, CommunityReview } from '@/hooks/useSocial';
import { useLibrary, useAddBook } from '@/hooks/useLibrary';

export default function DiscoverBookScreen() {
  const { id, bookData } = useLocalSearchParams<{ id: string, bookData: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const book: BookItem | null = bookData ? JSON.parse(bookData) : null;

  const { data: stats } = useBookStats(id);
  const { data: communityReviews = [] } = useBookReviews(id);
  const { data: libraryBooks = [] } = useLibrary();
  const { mutateAsync: addBook, isPending: isAdding } = useAddBook();

  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);

  const libraryBook = libraryBooks.find(b => b.open_library_id === id);
  const isAdded = !!libraryBook;

  useEffect(() => {
    if (!book) return;
    const fetchSynopsis = async () => {
      setLoadingSynopsis(true);
      try {
        const res = await fetch(`https://openlibrary.org${book.open_library_id}.json`);
        const data = await res.json();
        if (data.description) {
          const desc = typeof data.description === 'string' ? data.description : data.description.value;
          setSynopsis(desc);
        } else {
          setSynopsis(null);
        }
      } catch (e) {
        setSynopsis(null);
      } finally {
        setLoadingSynopsis(false);
      }
    };
    fetchSynopsis();
  }, [book]);

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.onSurface }}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAdd = async () => {
    if (isAdded) return;
    try {
      await addBook({ book });
    } catch (e) {
      console.warn('Failed to add book', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover & Basic Info */}
        <View style={styles.heroSection}>
          <View style={styles.coverWrapper}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
                <MaterialIcons name="menu-book" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
              </View>
            )}
          </View>
          
          <Text style={styles.title}>{book.title}</Text>
          {book.author && <Text style={styles.author}>{book.author}</Text>}

          {stats && (stats.ratings_count > 0 || stats.reviews_count > 0) && (
            <View style={styles.statsRow}>
              {stats.average_rating && (
                <View style={styles.statPill}>
                  <MaterialIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.statPillText}>{stats.average_rating}</Text>
                </View>
              )}
              {stats.ratings_count > 0 && (
                <Text style={styles.statLightText}>{stats.ratings_count} ratings</Text>
              )}
              {stats.reviews_count > 0 && (
                <Text style={styles.statLightText}>· {stats.reviews_count} reviews</Text>
              )}
            </View>
          )}
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          {isAdded ? (
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primaryContainer }]} 
              onPress={() => router.push(`/book/${libraryBook.id}` as any)}
            >
              <MaterialIcons name="auto-stories" size={20} color={colors.onPrimaryContainer} />
              <Text style={[styles.primaryButtonText, { color: colors.onPrimaryContainer }]}>View in My Library</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleAdd}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color={colors.onPrimary} />
                  <Text style={styles.primaryButtonText}>Add to Library</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Metadata grid */}
        <View style={styles.metadataGrid}>
          {book.total_pages && (
            <View style={styles.metadataItem}>
              <MaterialIcons name="menu-book" size={20} color={colors.primary} />
              <View>
                <Text style={styles.metadataLabel}>Length</Text>
                <Text style={styles.metadataValue}>{book.total_pages} pages</Text>
              </View>
            </View>
          )}
          {book.language && (
            <View style={styles.metadataItem}>
              <MaterialIcons name="language" size={20} color={colors.primary} />
              <View>
                <Text style={styles.metadataLabel}>Language</Text>
                <Text style={[styles.metadataValue, {textTransform: 'uppercase'}]}>{book.language}</Text>
              </View>
            </View>
          )}
        </View>

        {book.genres && book.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreChips}>
              {Array.from(new Set(book.genres.flatMap(g => g.split(',').map(s => s.trim())))).slice(0, 8).map((g, i) => {
                const formatted = g.replace(/series:/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <View key={i} style={styles.genreChip}>
                    <Text style={styles.genreChipText}>{formatted}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Synopsis */}
        {loadingSynopsis ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: Spacing.stackLg }} />
        ) : synopsis ? (
          <View style={styles.synopsisContainer}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsisText}>
              {synopsis
                .replace(/\[([^\]]*pdf[^\]]*)\]\([^\)]+\)/gi, '')
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                .replace(/\bpdf\b\.*/gi, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/__/g, '')
                .replace(/\s{2,}/g, ' ')
                .trim()}
            </Text>
          </View>
        ) : null}

        {/* Community Reviews */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Community Reviews</Text>
          {communityReviews.length > 0 ? (
            <View style={{ gap: Spacing.stackSm }}>
              {communityReviews.map((review) => (
                <CommunityReviewCard key={review.id} review={review} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No community reviews yet.</Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function CommunityReviewCard({ review }: { review: CommunityReview }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const router = useRouter();

  return (
    <View style={styles.reviewCard}>
      <TouchableOpacity 
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}
        onPress={() => router.push(`/profile/${review.profiles.id}` as any)}
      >
        {review.profiles.avatar_url ? (
          <Image source={{ uri: review.profiles.avatar_url }} style={{ width: 24, height: 24, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.onPrimaryContainer, fontSize: 10, fontWeight: 'bold' }}>
              {review.profiles.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={{ ...Typography.styles.labelSm, color: colors.onSurface }}>{review.profiles.display_name || review.profiles.username}</Text>
        
        {review.rating && (
          <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons 
                key={star} 
                name={review.rating! >= star ? 'star' : review.rating! >= star - 0.5 ? 'star-half' : 'star-outline'} 
                size={12} 
                color="#FFC107" 
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurface, fontStyle: 'italic' }}>"{review.review}"</Text>

      <TouchableOpacity 
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}
        onPress={() => router.push(`/review/${review.id}` as any)}
      >
        <MaterialIcons name="chat-bubble-outline" size={16} color={colors.primary} />
        <Text style={{ ...Typography.styles.labelSm, color: colors.primary }}>View Comments</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  scroll: {
    padding: Spacing.containerPadding,
    paddingBottom: Spacing.stackLg * 2,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.stackLg,
  },
  coverWrapper: {
    width: 140,
    height: 210,
    borderRadius: Radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
    ...Shadows.card,
    marginBottom: Spacing.base,
  },
  noCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  author: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  statPillText: {
    ...Typography.styles.labelSm,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLightText: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
  },
  actionContainer: {
    marginBottom: Spacing.stackLg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    ...Shadows.button,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
  metadataGrid: {
    flexDirection: 'row',
    gap: Spacing.stackSm,
    marginBottom: Spacing.stackLg,
  },
  metadataItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
    backgroundColor: colors.surfaceContainerLow,
    padding: Spacing.stackSm,
    borderRadius: Radius.lg,
  },
  metadataLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  metadataValue: {
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
  },
  genresContainer: {
    marginBottom: Spacing.stackLg,
  },
  sectionTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
    marginBottom: Spacing.stackSm,
  },
  genreChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreChipText: {
    ...Typography.styles.labelSm,
    color: colors.onSurface,
    fontSize: 12,
  },
  synopsisContainer: {
    marginBottom: Spacing.stackLg,
  },
  synopsisText: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  reviewsContainer: {
    marginBottom: Spacing.stackLg,
  },
  emptyText: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  reviewCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.stackSm,
    ...Shadows.card,
  },
});
