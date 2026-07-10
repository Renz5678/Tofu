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
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { useGoals } from '@/hooks/useGoals';
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { data: profile } = useProfile();
  const { data: sessions = [] } = useReadingSessions();
  const { data: goals = [] } = useGoals();
  const { data: readingBooks = [] } = useLibrary('reading');

  const currentBook = readingBooks[0];
  const bookProgress = currentBook ? (currentBook.current_page / (currentBook.total_pages || 1)) : 0;
  const startSession = useSessionStore((s) => s.startSession);
  const activeSession = useSessionStore((s) => s.activeSession);

  const dailyMinuteGoal = goals.find(g => g.goal_type === 'minutes_per_day')?.target_value || 30;
  const dailyPageGoal = goals.find(g => g.goal_type === 'pages_per_day')?.target_value || 20;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.start_time.startsWith(todayStr));
  
  const todayMinutes = Math.round(todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);
  const todayPages = todaySessions.reduce((acc, s) => acc + s.pages_read, 0);

  const minuteProgress = Math.min(1, todayMinutes / dailyMinuteGoal);
  const pageProgress = Math.min(1, todayPages / dailyPageGoal);

  // Weekly data (last 7 days ending today)
  const weeklyData = [0, 0, 0, 0, 0, 0, 0];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const last7Labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return weekDays[d.getDay() === 0 ? 6 : d.getDay() - 1]; 
  });

  sessions.forEach(s => {
    const dateStr = s.start_time.split('T')[0];
    const idx = last7Dates.indexOf(dateStr);
    if (idx !== -1) {
      weeklyData[idx] += Math.round(s.duration_seconds / 60);
    }
  });


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

  const maxWeekly = Math.max(...weeklyData, 1);
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
            Good {getGreeting()}, {profile?.display_name || profile?.username || 'Reader'}
          </Text>
          <Text style={styles.welcomeSub}>Your reading sanctuary is ready.</Text>
        </Animated.View>

        {/* Stats Bento Grid */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.bentoGrid}>
          {/* Reading Time Ring */}
          <View style={[styles.bentoCard, styles.bentoCardHalf]}>
            <ProgressRing
              progress={minuteProgress}
              size={96}
              strokeWidth={8}
              showLabel
              labelText={`${todayMinutes}`}
            />
            <Text style={styles.bentoLabel}>Daily Goal</Text>
            <Text style={[styles.bentoSublabel, { opacity: 0.5 }]}>
              {todayMinutes}/{dailyMinuteGoal} min
            </Text>
          </View>

          {/* Pages Today */}
          <View style={[styles.bentoCard, styles.bentoCardHalf]}>
            <Text style={styles.bentoStat}>{todayPages}</Text>
            <Text style={styles.bentoSublabel}>Pages today</Text>
            <ProgressBar
              progress={pageProgress}
              height={6}
              style={{ marginTop: Spacing.stackSm }}
            />
            <Text style={[styles.bentoSublabel, { marginTop: 6, opacity: 0.6 }]}>
              Goal: {dailyPageGoal}
            </Text>
          </View>
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

        {/* Weekly Progress */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={[styles.weeklyCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, Typography.styles.labelLg]}>Weekly Progress</Text>
            <Text style={styles.weeklySubtitle}>Last 7 Days</Text>
          </View>
          <View style={styles.barChart}>
            {weeklyData.map((val, i) => {
              const barH = (val / maxWeekly) * 80;
              const isToday = i === 6;
              return (
                <View key={i} style={styles.barColumn}>
                  <Animated.View
                    entering={FadeInDown.delay(400 + i * 50).springify()}
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, barH),
                        backgroundColor: isToday ? colors.primary : `${colors.primary}33`,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{last7Labels[i]}</Text>
                </View>
              );
            })}
          </View>
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
  weeklyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  weeklySubtitle: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    ...Typography.styles.labelSm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
});
