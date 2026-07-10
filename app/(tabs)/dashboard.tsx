import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { TopBar } from '@/components/TopBar';
import { ProgressRing, ProgressBar } from '@/components/ProgressRing';
import { useLibrary } from '@/hooks/useLibrary';
import { useSessionStore } from '@/store/sessionStore';
import { useProfile } from '@/hooks/useProfile';
import { useTimeline, TimelineItem } from '@/hooks/useSocial';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { data: profile } = useProfile();
  const { data: readingBooks = [] } = useLibrary('reading');
  const { data: timeline = [], isLoading: isTimelineLoading } = useTimeline();

  const currentBook = readingBooks[0];
  const bookProgress = currentBook ? (currentBook.current_page / (currentBook.total_pages || 1)) : 0;
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const handleContinueReading = async () => {
    if (!currentBook) return;
    
    if (activeSession && activeSession.userBookId !== currentBook.id) {
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
                userBookId: currentBook.id,
                bookTitle: currentBook.title,
                startPage: currentBook.current_page || 0,
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

    if (activeSession?.userBookId !== currentBook.id) {
      await startSession({
        userBookId: currentBook.id,
        bookTitle: currentBook.title,
        startPage: currentBook.current_page || 0,
        startTime: new Date().toISOString(),
        totalPausedSeconds: 0,
      });
    }
    router.push('/session/active');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar
        streak={profile?.streak?.current_streak ?? 0}
        avatarUrl={profile?.avatar_url ?? undefined}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.welcomeHeading}>
            {getGreeting()}, {profile?.display_name || profile?.username || 'Reader'}
          </Text>
        </Animated.View>


        {/* Current Read */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Read</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
              <Text style={styles.sectionLink}>View Library</Text>
            </TouchableOpacity>
          </View>

          {currentBook ? (
            <AnimatedPressable onPress={handleContinueReading}>
              <View style={[styles.currentReadCard, Shadows.card]}>
                {/* Cover */}
                <View style={styles.currentReadCover}>
                  <Image
                    source={{ uri: currentBook.cover_url ?? undefined }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                  {bookProgress < 1 && (
                  <View style={styles.readBadge}>
                    <Text style={styles.readBadgeText}>
                      {Math.round(bookProgress * 100)}% READ
                    </Text>
                  </View>
                )}
                </View>

                {/* Info */}
                <View style={styles.currentReadInfo}>
                  <View>
                    <Text style={styles.currentReadTitle} numberOfLines={2}>{currentBook.title}</Text>
                    <Text style={styles.currentReadAuthor} numberOfLines={1}>
                      {currentBook.author ?? 'Unknown'} {currentBook.genres?.[0] ? `· ${currentBook.genres[0]}` : ''}
                    </Text>
                  </View>
                  <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>
                        Page {currentBook.current_page} of {currentBook.total_pages ?? '?'}
                      </Text>
                    </View>
                    <ProgressBar progress={bookProgress} height={4} />
                  </View>

                  <View style={styles.continueButton}>
                    <MaterialIcons name="play-circle" size={20} color={colors.onPrimary} />
                    <Text style={styles.continueButtonText}>Continue Reading</Text>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          ) : (
            <View style={[styles.currentReadCard, { padding: Spacing.stackLg, alignItems: 'center', flexDirection: 'column' }]}>
              <View style={styles.emptyStateIllustration}>
                <MaterialIcons name="auto-stories" size={48} color={colors.primary} style={{ opacity: 0.8 }} />
              </View>
              <Text style={{ ...Typography.styles.titleSm, color: colors.onSurface, marginTop: 12 }}>No Active Books</Text>
              <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7, marginTop: 4, paddingHorizontal: 16 }}>
                Search for a book to start tracking your reading habit and build your streaks.
              </Text>
              <AnimatedPressable onPress={() => router.push('/(tabs)/search')} style={{ width: '100%' }}>
                <View style={[styles.continueButton, { marginTop: 24, width: '100%' }]}>
                  <MaterialIcons name="search" size={20} color={colors.onPrimary} />
                  <Text style={styles.continueButtonText}>Find a Book</Text>
                </View>
              </AnimatedPressable>
            </View>
          )}
        </Animated.View>

        {/* Social Feed */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Feed</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.sectionLink}>Find Friends</Text>
            </TouchableOpacity>
          </View>

          {isTimelineLoading ? (
            <Text style={styles.placeholder}>Loading feed...</Text>
          ) : timeline.length > 0 ? (
            timeline.map((item, index) => (
              <TimelineCard key={item.id} item={item} />
            ))
          ) : (
            <View style={[styles.currentReadCard, { padding: Spacing.stackLg, alignItems: 'center', flexDirection: 'column' }]}>
              <View style={styles.emptyStateIllustration}>
                <MaterialIcons name="people" size={48} color={colors.primary} style={{ opacity: 0.8 }} />
              </View>
              <Text style={{ ...Typography.styles.titleSm, color: colors.onSurface, marginTop: 12 }}>It's quiet here...</Text>
              <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7, marginTop: 4, paddingHorizontal: 16 }}>
                Follow your friends to see their reviews, ratings, and reading progress.
              </Text>
              <AnimatedPressable onPress={() => router.push('/(tabs)/search')} style={{ width: '100%' }}>
                <View style={[styles.continueButton, { marginTop: 24, width: '100%', backgroundColor: colors.secondaryContainer }]}>
                  <MaterialIcons name="search" size={20} color={colors.onSecondaryContainer} />
                  <Text style={[styles.continueButtonText, { color: colors.onSecondaryContainer }]}>Find Readers</Text>
                </View>
              </AnimatedPressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function AnimatedPressable({ onPress, children, style }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => scale.value = withTiming(0.97, { duration: 100 })}
      onPressOut={() => scale.value = withTiming(1, { duration: 150 })}
      onPress={onPress}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const router = useRouter();

  const timeAgo = formatDistanceToNow(new Date(item.added_at), { addSuffix: true });
  
  let actionText = 'started reading';
  if (item.status === 'finished') actionText = 'finished reading';
  if (item.review || item.rating) actionText = 'reviewed';

  return (
    <View style={[styles.timelineCard, Shadows.card]}>
      <View style={styles.timelineHeader}>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
          onPress={() => router.push(`/profile/${item.profiles.id}` as any)}
        >
          {item.profiles.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.timelineAvatar} />
          ) : (
            <View style={[styles.timelineAvatar, { backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.onPrimaryContainer, fontWeight: 'bold' }}>
                {item.profiles.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.timelineUserText} numberOfLines={1}>
              <Text style={{ fontWeight: '600', color: colors.onSurface }}>{item.profiles.display_name || item.profiles.username}</Text>
              <Text style={{ color: colors.onSurfaceVariant }}> {actionText}</Text>
            </Text>
            <Text style={styles.timelineTime}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.timelineBookRow}
        onPress={() => router.push(`/book/${item.book_id}` as any)}
      >
        <Image source={{ uri: item.books.cover_url ?? undefined }} style={styles.timelineCover} contentFit="cover" />
        <View style={styles.timelineBookInfo}>
          <Text style={styles.timelineBookTitle} numberOfLines={2}>{item.books.title}</Text>
          <Text style={styles.timelineBookAuthor} numberOfLines={1}>{item.books.author}</Text>
          
          {item.rating ? (
            <View style={styles.timelineRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons 
                  key={star} 
                  name={item.rating! >= star ? 'star' : item.rating! >= star - 0.5 ? 'star-half' : 'star-outline'} 
                  size={14} 
                  color="#FFC107" 
                />
              ))}
            </View>
          ) : null}

          {item.review ? (
            <Text style={styles.timelineReview} numberOfLines={4}>"{item.review}"</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  section: {
    gap: Spacing.stackSm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  sectionLink: {
    ...Typography.styles.labelSm,
    color: colors.primary,
  },
  welcomeHeading: {
    ...Typography.styles.displayLgMobile,
    color: colors.onSurface,
  },
  welcomeSub: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: Spacing.gutter,
  },
  bentoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    gap: Spacing.base,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  bentoCardHalf: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bentoStat: {
    ...Typography.styles.numericXl,
    fontSize: 32,
    color: colors.primary,
  },
  bentoLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  bentoSublabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  currentReadCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  currentReadCover: {
    width: 120,
    aspectRatio: 2 / 3,
    position: 'relative',
  },
  readBadge: {
    position: 'absolute',
    top: 10,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  readBadgeText: {
    ...Typography.styles.labelSm,
    color: colors.onPrimary,
    fontSize: 10,
  },
  currentReadInfo: {
    flex: 1,
    padding: Spacing.stackMd,
    justifyContent: 'space-between',
    gap: Spacing.stackSm,
  },
  currentReadTitle: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
    fontSize: 20,
  },
  currentReadAuthor: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  progressSection: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  emptyStateIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 14,
  },
  continueButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
  timelineCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
  },
  timelineUserText: {
    ...Typography.styles.bodyMd,
    fontSize: 14,
  },
  timelineTime: {
    ...Typography.styles.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  timelineBookRow: {
    flexDirection: 'row',
    gap: Spacing.stackSm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.stackSm,
  },
  timelineCover: {
    width: 60,
    height: 90,
    borderRadius: Radius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  timelineBookInfo: {
    flex: 1,
    gap: 4,
  },
  timelineBookTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  timelineBookAuthor: {
    ...Typography.styles.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  timelineRatingRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  timelineReview: {
    ...Typography.styles.bodyMd,
    fontSize: 13,
    color: colors.onSurface,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
