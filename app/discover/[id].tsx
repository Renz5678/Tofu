import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BookItem, fetchSynopsis } from '@/lib/openLibrary';
import { useBookStats, useBookReviews, CommunityReview, useMyReview } from '@/hooks/useSocial';
import { useLibrary, useAddBook } from '@/hooks/useLibrary';
import { LogBookSheet } from '@/components/LogBookSheet';

export default function DiscoverBookScreen() {
  const { id, bookData } = useLocalSearchParams<{ id: string; bookData: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const decodedId = decodeURIComponent(id || '');
  const book: BookItem | null = bookData ? JSON.parse(bookData) : null;

  const { data: stats } = useBookStats(decodedId);
  const { data: communityReviews = [] } = useBookReviews(decodedId);
  const { data: myReview } = useMyReview(decodedId);
  const { data: libraryBooks = [] } = useLibrary();
  const { mutateAsync: addBook, isPending: isAdding } = useAddBook();

  const libraryBook = libraryBooks.find((b) => b.open_library_id === decodedId);
  const isAdded = !!libraryBook;

  // Cached synopsis fetch — result persists for 5 min so back-navigation
  // never triggers a second network request to the slow Works API.
  const { data: synopsis = null, isLoading: loadingSynopsis } = useQuery({
    queryKey: ['synopsis', decodedId],
    queryFn: () => fetchSynopsis(decodedId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // keep in cache for 30 minutes
    enabled: !!decodedId && decodedId.startsWith('/works/'),
    retry: 1,
  });

  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const shareViewRef = useRef<View>(null);

  const captureAndShare = async () => {
    try {
      if (!shareViewRef.current) return;
      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share your review',
        mimeType: 'image/png',
      });
      setIsShareModalVisible(false);
    } catch (error) {
      console.warn('Error sharing image', error);
    }
  };

  const handleSaveReviewSuccess = () => {
    if (!isAdded) {
      Alert.alert('Review Saved!', 'Would you like to add this book to your reading library?', [
        { text: 'No Thanks', style: 'cancel' },
        { text: 'Yes, Add', onPress: () => handleAdd() },
      ]);
    }
  };

  if (!book) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
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
              <Image
                source={{ uri: book.cover_url }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
                <MaterialIcons
                  name="menu-book"
                  size={48}
                  color={colors.onSurfaceVariant}
                  style={{ opacity: 0.3 }}
                />
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
              <Text style={[styles.primaryButtonText, { color: colors.onPrimaryContainer }]}>
                View in My Library
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleAdd} disabled={isAdding}>
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
                <Text style={[styles.metadataValue, { textTransform: 'uppercase' }]}>
                  {book.language}
                </Text>
              </View>
            </View>
          )}
        </View>

        {book.genres && book.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreChips}>
              {Array.from(new Set(book.genres.flatMap((g) => g.split(',').map((s) => s.trim()))))
                .slice(0, 8)
                .map((g, i) => {
                  const formatted = g
                    .replace(/series:/i, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <View key={i} style={styles.genreChip}>
                      <Text style={styles.genreChipText}>{formatted}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Rate this book / Your Rating */}
        <View style={styles.rateSection}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={styles.sectionTitle}>{myReview ? 'Your Rating' : 'Rate this book'}</Text>
            {myReview && (
              <TouchableOpacity onPress={() => setIsShareModalVisible(true)} style={{ padding: 4 }}>
                <MaterialIcons name="share" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const ratingValue = myReview?.rating || 0;
              const isFull = star <= ratingValue;
              const isHalf = !isFull && star - 0.5 <= ratingValue;
              return (
                <TouchableOpacity key={star} onPress={() => setIsLogSheetOpen(true)}>
                  <MaterialIcons
                    name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                    size={36}
                    color={colors.primary}
                    style={{ opacity: myReview?.rating ? 1 : 0.8 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Synopsis */}
        {loadingSynopsis ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: Spacing.stackLg }}
          />
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
        ) : (
          <View style={styles.synopsisContainer}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={[styles.synopsisText, { fontStyle: 'italic', opacity: 0.6 }]}>
              No synopsis available.
            </Text>
          </View>
        )}

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

      {/* Log Book Sheet */}
      <LogBookSheet
        visible={isLogSheetOpen}
        book={book}
        onClose={() => setIsLogSheetOpen(false)}
        onSaveSuccess={handleSaveReviewSuccess}
        initialValues={
          myReview
            ? {
                rating: myReview.rating ?? 0,
                liked: myReview.liked,
                content: myReview.content ?? '',
                contains_spoilers: myReview.contains_spoilers,
              }
            : undefined
        }
      />

      {/* Share Modal */}
      <Modal visible={isShareModalVisible} animationType="slide" transparent>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Review</Text>

            <View ref={shareViewRef} collapsable={false} style={styles.shareCard}>
              <Image
                source={{ uri: book.cover_url ?? undefined }}
                style={styles.shareCardBackground}
                contentFit="cover"
                blurRadius={40}
              />
              <View style={styles.shareCardOverlay} />

              <View style={styles.shareCardContent}>
                <Image
                  source={{ uri: book.cover_url ?? undefined }}
                  style={styles.shareCardCoverLarge}
                  contentFit="cover"
                />

                <Text style={styles.shareCardBookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.shareCardBookAuthor} numberOfLines={1}>
                  {book.author?.toUpperCase()}
                </Text>

                {myReview?.rating ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 12,
                      marginBottom: 32,
                      justifyContent: 'center',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = myReview.rating! >= star;
                      const isHalf = myReview.rating! >= star - 0.5 && myReview.rating! < star;
                      return (
                        <MaterialIcons
                          key={star}
                          name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                          size={16}
                          color="#00E054"
                        />
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ height: 32 }} />
                )}

                {myReview?.content ? (
                  <Text style={styles.shareCardReviewText}>"{myReview.content}"</Text>
                ) : null}
              </View>

              <View style={styles.shareCardFooter}>
                <Text style={styles.shareCardTofuLogo}>T O F U</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { flex: 1, backgroundColor: colors.surfaceContainerHigh },
                ]}
                onPress={() => setIsShareModalVisible(false)}
              >
                <Text style={[styles.primaryButtonText, { color: colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={captureAndShare}
              >
                <MaterialIcons name="ios-share" size={20} color={colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Share Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
          <Image
            source={{ uri: review.profiles.avatar_url }}
            style={{ width: 24, height: 24, borderRadius: 12 }}
          />
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.onPrimaryContainer, fontSize: 10, fontWeight: 'bold' }}>
              {review.profiles.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={{ ...Typography.styles.labelSm, color: colors.onSurface }}>
          {review.profiles.display_name || review.profiles.username}
        </Text>

        {review.rating && (
          <View style={{ flexDirection: 'row', marginLeft: 'auto' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={
                  review.rating! >= star
                    ? 'star'
                    : review.rating! >= star - 0.5
                      ? 'star-half'
                      : 'star-outline'
                }
                size={12}
                color="#FFC107"
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {review.content ? (
        <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurface, fontStyle: 'italic' }}>
          "{review.content}"
        </Text>
      ) : null}

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

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
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
    rateSection: {
      marginBottom: Spacing.stackLg,
      alignItems: 'center',
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.stackLg,
      borderRadius: Radius.xl,
    },
    section: {
      marginBottom: Spacing.stackLg,
      gap: Spacing.base,
    },
    progressCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radius.xl,
      padding: Spacing.stackMd,
    },
    placeholder: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      opacity: 0.6,
    },
    shareModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: Spacing.containerPadding,
    },
    shareModalContent: {
      width: '85%',
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    shareModalTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
      marginBottom: Spacing.base,
    },
    shareCard: {
      width: '100%',
      aspectRatio: 9 / 16,
      backgroundColor: '#0F0F0F',
      borderRadius: Radius.lg,
      overflow: 'hidden',
      paddingHorizontal: 40,
      paddingTop: 60,
      paddingBottom: 32,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    shareCardBackground: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.7,
    },
    shareCardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15,15,15,0.85)',
    },
    shareCardContent: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    shareCardCoverLarge: {
      width: 140,
      height: 210,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.8,
      shadowRadius: 24,
      elevation: 20,
    },
    shareCardBookTitle: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: 6,
    },
    shareCardBookAuthor: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      fontWeight: '600',
      letterSpacing: 2,
      textAlign: 'center',
    },
    shareCardReviewText: {
      fontSize: 13,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    shareCardFooter: {
      alignItems: 'center',
      zIndex: 1,
    },
    shareCardTofuLogo: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 4,
      color: '#00E054',
    },
  });
