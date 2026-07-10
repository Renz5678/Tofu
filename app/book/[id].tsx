import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { readingProgress } from '@/lib/metrics';
import { useLibrary, useUpdateBook, BookStatus } from '@/hooks/useLibrary';
import { useSessionStore } from '@/store/sessionStore';
import { ProgressBar } from '@/components/ProgressRing';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { data: libraryBooks = [] } = useLibrary();
  const { mutateAsync: updateBook } = useUpdateBook();
  const book = libraryBooks.find((b) => b.id === id);
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const [isEditingReview, setIsEditingReview] = React.useState(false);
  const [draftRating, setDraftRating] = React.useState(0);
  const [draftReview, setDraftReview] = React.useState('');
  
  const [isShareModalVisible, setIsShareModalVisible] = React.useState(false);
  const shareViewRef = React.useRef<View>(null);

  React.useEffect(() => {
    if (book) {
      setDraftRating(book.rating || 0);
      setDraftReview(book.review || '');
    }
  }, [book?.rating, book?.review]);

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

  const handleUpdateStatus = async (newStatus: BookStatus) => {
    try {
      await updateBook({ userBookId: book.id, status: newStatus });
    } catch (e) {
      console.warn('Failed to update status', e);
    }
  };

  const handleReRead = async () => {
    try {
      await updateBook({ userBookId: book.id, status: 'reading', currentPage: 0 });
    } catch (e) {
      console.warn('Failed to re-read', e);
    }
  };

  const handleSaveReview = async () => {
    try {
      await updateBook({ userBookId: book.id, rating: draftRating, review: draftReview });
      setIsEditingReview(false);
    } catch (e) {
      console.warn('Failed to save review', e);
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
          <MaterialIcons name="arrow-back" size={22} color={Colors.onPrimary} />
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
            <MaterialIcons name="replay" size={22} color={Colors.onPrimary} />
            <Text style={styles.primaryButtonText}>Read Again</Text>
          </TouchableOpacity>
        ) : (
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

        {/* Review & Rating (Only if Finished) */}
        {book.status === 'finished' && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>My Review</Text>
              {!isEditingReview && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setIsEditingReview(true)}>
                    <MaterialIcons name="edit" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare}>
                    <MaterialIcons name="share" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {!isEditingReview && (
              <View style={[styles.progressCard, Shadows.card]}>
                {book.rating ? (
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = book.rating! >= star;
                      const isHalf = book.rating! >= star - 0.5 && book.rating! < star;
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
                {book.review ? (
                  <Text style={{ ...Typography.styles.bodyMd, color: Colors.onSurface }}>
                    "{book.review}"
                  </Text>
                ) : (
                  <Text style={styles.placeholder}>No review written yet.</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Notes placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.placeholder}>Tap to add a note about this book.</Text>
        </View>
      </ScrollView>

      {/* Edit Review Modal */}
      <Modal visible={isEditingReview} animationType="fade" transparent>
        <View style={styles.shareModalOverlay}>
          <View style={[styles.shareModalContent, { width: '90%' }]}>
            <Text style={styles.shareModalTitle}>Rate & Review</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.base }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = draftRating >= star;
                const isHalf = draftRating >= star - 0.5 && draftRating < star;
                return (
                  <View key={star} style={{ position: 'relative' }}>
                    <MaterialIcons 
                      name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'} 
                      size={44} 
                      color="#FFC107" 
                    />
                    <View style={{ position: 'absolute', width: '100%', height: '100%', flexDirection: 'row' }}>
                      <TouchableOpacity 
                        style={{ flex: 1 }} 
                        onPress={() => setDraftRating(star === 1 && draftRating === 0.5 ? 0 : star - 0.5)} 
                        activeOpacity={1}
                      />
                      <TouchableOpacity 
                        style={{ flex: 1 }} 
                        onPress={() => setDraftRating(star)} 
                        activeOpacity={1}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            
            <TextInput
              style={[styles.reviewInput, { width: '100%', marginBottom: Spacing.base }]}
              multiline
              placeholder="What did you think of the book?"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={draftReview}
              onChangeText={setDraftReview}
            />
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: Colors.surfaceContainerHigh }]} onPress={() => setIsEditingReview(false)}>
                <Text style={[styles.primaryButtonText, { color: Colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleSaveReview}>
                <Text style={styles.primaryButtonText}>Save Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: Colors.surfaceContainerHigh }]} onPress={() => setIsShareModalVisible(false)}>
                <Text style={[styles.primaryButtonText, { color: Colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={captureAndShare}>
                <MaterialIcons name="ios-share" size={20} color={Colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Share Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusSection: {
    marginTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
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
    backgroundColor: Colors.primary,
  },
  statusTabText: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  statusTabTextActive: {
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
  reviewInput: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: 12,
    minHeight: 100,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onSecondaryContainer,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.containerPadding,
  },
  shareModalContent: {
    width: '85%',
    backgroundColor: Colors.surfaceContainerLowest,
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
    color: Colors.onSurface,
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
