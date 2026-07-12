import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Share,
  Modal,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { readingProgress } from '@/lib/metrics';
import { useLibrary, useUpdateBook, BookStatus } from '@/hooks/useLibrary';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useSessionStore } from '@/store/sessionStore';
import { useBookStats, useBookReviews, useMyReview, useToggleReviewLike, CommunityReview } from '@/hooks/useSocial';
import { ProgressBar } from '@/components/ProgressRing';
import { LogBookSheet } from '@/components/LogBookSheet';

export default function BookDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { data: libraryBooks = [] } = useLibrary();
  const { data: favorites = [] } = useFavorites();
  const { mutateAsync: updateBook } = useUpdateBook();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const book = libraryBooks.find((b) => b.id === id);
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const { data: stats } = useBookStats(book?.book_id ?? '');
  const { data: communityReviews = [] } = useBookReviews(book?.book_id ?? '');
  const { data: myReview } = useMyReview(book?.book_id ?? '');

  const [isLogSheetOpen, setIsLogSheetOpen] = React.useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = React.useState(false);
  const shareViewRef = React.useRef<View>(null);

  if (!book) return null; // Or a loading/not-found state

  const progress = readingProgress(book.current_page, book.total_pages || 1);

  const handleStartReading = async () => {
    if (activeSession && activeSession.userBookId !== book.id) {
      Alert.alert(
        'Active Session Exists',
        `You have an active reading session for "${activeSession.bookTitle || 'another book'}".`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Session', 
            onPress: () => router.push('/session/active') 
          },
          { 
            text: 'Discard Old', 
            style: 'destructive',
            onPress: async () => {
              await startSession({
                userBookId: book.id,
                bookTitle: book.title,
                startPage: book.current_page || 0,
                startTime: new Date().toISOString(),
                totalPausedSeconds: 0,
              });
              router.push('/session/active');
            }
          }
        ]
      );
      return;
    }

    if (activeSession?.userBookId !== book.id) {
      await startSession({
        userBookId: book.id,
        bookTitle: book.title,
        startPage: book.current_page || 0,
        startTime: new Date().toISOString(),
        totalPausedSeconds: 0,
      });
    }
    router.push('/session/active');
  };

  const handleUpdateStatus = async (newStatus: BookStatus) => {
    try {
      await updateBook({ userBookId: book.id, status: newStatus });
    } catch (e: any) {
      console.warn('Failed to update status', e);
      Alert.alert('Error', e.message || 'Failed to update status.');
    }
  };

  const handleReRead = async () => {
    try {
      await updateBook({ userBookId: book.id, status: 'reading', currentPage: 0 });
    } catch (e: any) {
      console.warn('Failed to re-read', e);
      Alert.alert('Error', e.message || 'Failed to restart reading.');
    }
  };

  const handleShare = () => {
    setIsShareModalVisible(true);
  };

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

  const handleToggleFavorite = () => {
    if (!book?.book_id) return;
    toggleFavorite(book.book_id, {
      onError: (err: any) => {
        Alert.alert('Error', err.message || 'Failed to update favorites.');
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Hero cover */}
      <View style={[styles.heroContainer, { height: width * 0.65 }]}>
        <Image
          source={{ uri: book.cover_url ?? undefined }}
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
          <MaterialIcons name="arrow-back" size={22} color={colors.onPrimary} />
        </TouchableOpacity>

        {/* Favorite button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8, left: undefined, right: Spacing.containerPadding }]}
          onPress={handleToggleFavorite}
        >
          <MaterialIcons name={isFavorite ? "favorite" : "favorite-border"} size={22} color={isFavorite ? colors.error : colors.onPrimary} />
        </TouchableOpacity>

        {/* Cover image centered */}
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: book.cover_url ?? undefined }}
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

        {/* Start/Continue/Re-read reading button */}
        {book.status === 'finished' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleReRead} activeOpacity={0.85}>
            <MaterialIcons name="replay" size={22} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Read Again</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartReading}
            activeOpacity={0.85}
          >
            <MaterialIcons name="play-circle" size={22} color={colors.onPrimary} />
            <Text style={styles.primaryButtonText}>
              {book.current_page > 0 ? 'Continue Reading' : 'Start Reading'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Status management */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Book Status</Text>
          <View style={styles.statusTabs}>
            {(['reading', 'on_hold', 'finished'] as BookStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusTab, book.status === status && styles.statusTabActive]}
                onPress={() => handleUpdateStatus(status)}
              >
                <Text style={[styles.statusTabText, book.status === status && styles.statusTabTextActive]}>
                  {status === 'on_hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session history placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Sessions</Text>
          <Text style={styles.placeholder}>No sessions yet — start reading to track your progress.</Text>
        </View>

        {/* Review & Rating */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>My Log</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setIsLogSheetOpen(true)}>
                <MaterialIcons name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}>
                <MaterialIcons name="share" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.progressCard, Shadows.card]}>
            {/* Heart */}
            {myReview?.liked && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <MaterialIcons name="favorite" size={16} color="#E91E63" />
                <Text style={{ ...Typography.styles.labelSm, color: '#E91E63' }}>Liked</Text>
              </View>
            )}
            {/* Stars */}
            {myReview?.rating ? (
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFull = myReview.rating! >= star;
                  const isHalf = myReview.rating! >= star - 0.5 && myReview.rating! < star;
                  return (
                    <MaterialIcons
                      key={star}
                      name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                      size={20}
                      color="#FFC107"
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.placeholder}>No rating added yet.</Text>
            )}
            {/* Review text */}
            {myReview?.content ? (
              <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurface }}>
                "{myReview.content}"
              </Text>
            ) : (
              <Text style={styles.placeholder}>No review written yet. Tap ✏️ to add one.</Text>
            )}
            {myReview?.contains_spoilers && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <MaterialIcons name="warning" size={12} color={colors.onSurfaceVariant} />
                <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant }}>Contains spoilers</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.placeholder}>Tap to add a note about this book.</Text>
        </View>

        {/* Community Reviews */}
        <View style={[styles.section, { marginTop: Spacing.stackLg }]}>
          <Text style={styles.sectionTitle}>Community Reviews</Text>
          {communityReviews.length > 0 ? (
            <View style={{ gap: Spacing.stackSm }}>
              {communityReviews.map((review) => (
                <CommunityReviewCard key={review.id} review={review} bookId={book.book_id} />
              ))}
            </View>
          ) : (
            <Text style={styles.placeholder}>No community reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* Log Book Sheet */}
      <LogBookSheet
        visible={isLogSheetOpen}
        bookId={book.book_id}
        bookTitle={book.title}
        onClose={() => setIsLogSheetOpen(false)}
        initialValues={myReview ? {
          rating: myReview.rating ?? 0,
          liked: myReview.liked,
          content: myReview.content ?? '',
          contains_spoilers: myReview.contains_spoilers,
        } : undefined}
      />

      {/* Share Modal Preview */}
      <Modal visible={isShareModalVisible} animationType="slide" transparent>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Review</Text>
            
            {/* The actual view we capture */}
            <View 
              ref={shareViewRef} 
              collapsable={false}
              style={styles.shareCard}
            >
              <Image source={{ uri: book.cover_url ?? undefined }} style={styles.shareCardBackground} contentFit="cover" blurRadius={40} />
              <View style={styles.shareCardOverlay} />
              
              <View style={styles.shareCardContent}>
                <Image source={{ uri: book.cover_url ?? undefined }} style={styles.shareCardCoverLarge} contentFit="cover" />
                
                <Text style={styles.shareCardBookTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.shareCardBookAuthor} numberOfLines={1}>{book.author?.toUpperCase()}</Text>
                
                {book.rating ? (
                  <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 32, justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = book.rating! >= star;
                      const isHalf = book.rating! >= star - 0.5 && book.rating! < star;
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
                ) : <View style={{ height: 32 }} />}
                
                {book.review ? (
                  <Text style={styles.shareCardReviewText}>"{book.review}"</Text>
                ) : null}
              </View>

              <View style={styles.shareCardFooter}>
                <Text style={styles.shareCardTofuLogo}>T O F U</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: colors.surfaceContainerHigh }]} onPress={() => setIsShareModalVisible(false)}>
                <Text style={[styles.primaryButtonText, { color: colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={captureAndShare}>
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

function CommunityReviewCard({ review, bookId }: { review: CommunityReview; bookId: string }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const router = useRouter();
  const { mutate: toggleLike } = useToggleReviewLike();
  const [spoilerRevealed, setSpoilerRevealed] = React.useState(false);

  const handleLike = () => {
    toggleLike({ reviewId: review.id, isLiked: review.is_liked_by_me ?? false, bookId });
  };

  return (
    <View style={[styles.progressCard, Shadows.card]}>
      {/* Author row */}
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

        {review.liked && (
          <MaterialIcons name="favorite" size={12} color="#E91E63" style={{ marginLeft: 2 }} />
        )}

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

      {/* Review text with spoiler gate */}
      {review.contains_spoilers && !spoilerRevealed ? (
        <TouchableOpacity
          onPress={() => setSpoilerRevealed(true)}
          style={{ backgroundColor: colors.surfaceContainer, borderRadius: Radius.md, padding: 12, alignItems: 'center' }}
        >
          <MaterialIcons name="visibility-off" size={18} color={colors.onSurfaceVariant} />
          <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant, marginTop: 4 }}>Tap to reveal spoilers</Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurface, fontStyle: 'italic' }}>"{review.content}"</Text>
      )}

      {/* Footer: likes + comments */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={handleLike}>
          <MaterialIcons
            name={review.is_liked_by_me ? 'favorite' : 'favorite-border'}
            size={16}
            color={review.is_liked_by_me ? '#E91E63' : colors.onSurfaceVariant}
          />
          {(review.likes_count ?? 0) > 0 && (
            <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant }}>{review.likes_count}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onPress={() => router.push(`/review/${review.id}` as any)}
        >
          <MaterialIcons name="chat-bubble-outline" size={16} color={colors.primary} />
          <Text style={{ ...Typography.styles.labelSm, color: colors.primary }}>Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    color: colors.onSurface,
    textAlign: 'center',
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  genreChip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreChipText: {
    ...Typography.styles.labelSm,
    color: colors.onSecondaryContainer,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
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
  progressCard: {
    backgroundColor: colors.surfaceContainerLowest,
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
    color: colors.primary,
    textAlign: 'center',
  },
  progressStatLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  progressDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: colors.outlineVariant,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    ...Shadows.button,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
  statusSection: {
    marginTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    padding: 4,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  statusTabActive: {
    backgroundColor: colors.primary,
  },
  statusTabText: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  statusTabTextActive: {
    color: colors.onPrimary,
  },
  section: {
    gap: Spacing.base,
  },
  sectionTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  placeholder: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  reviewInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: Radius.md,
    padding: 12,
    minHeight: 100,
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onSecondaryContainer,
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
    aspectRatio: 9/16,
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
    fontSize: 15,
    color: '#E0E0E0',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  shareCardFooter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    zIndex: 1,
  },
  shareCardTofuLogo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 6,
  },
});
