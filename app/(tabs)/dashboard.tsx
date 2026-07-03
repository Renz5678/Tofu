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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { TopBar } from '@/components/TopBar';
import { ProgressRing, ProgressBar } from '@/components/ProgressRing';
import { MOCK_BOOKS, MOCK_STATS, MOCK_USER } from '@/lib/mockData';

const CURRENT_BOOK = MOCK_BOOKS[0];
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const minuteProgress = MOCK_STATS.todayMinutes / MOCK_STATS.dailyGoalMinutes;
  const pageProgress = MOCK_STATS.todayPages / MOCK_STATS.dailyGoalPages;
  const bookProgress = CURRENT_BOOK.current_page / CURRENT_BOOK.total_pages;

  const maxWeekly = Math.max(...MOCK_STATS.weeklyData);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopBar
        streak={MOCK_STATS.currentStreak}
        avatarUrl={MOCK_USER.avatar_url}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.section}>
          <Text style={styles.welcomeHeading}>
            Good{getGreeting()}, {MOCK_USER.display_name}
          </Text>
          <Text style={styles.welcomeSub}>Your reading sanctuary is ready.</Text>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Reading Time Ring */}
          <View style={[styles.bentoCard, styles.bentoCardHalf]}>
            <ProgressRing
              progress={minuteProgress}
              size={96}
              strokeWidth={8}
              showLabel
              labelText={`${MOCK_STATS.todayMinutes}`}
            />
            <Text style={styles.bentoLabel}>Daily Goal</Text>
            <Text style={[styles.bentoSublabel, { opacity: 0.5 }]}>
              {MOCK_STATS.todayMinutes}/{MOCK_STATS.dailyGoalMinutes} min
            </Text>
          </View>

          {/* Pages Today */}
          <View style={[styles.bentoCard, styles.bentoCardHalf]}>
            <Text style={styles.bentoStat}>{MOCK_STATS.todayPages}</Text>
            <Text style={styles.bentoSublabel}>Pages today</Text>
            <ProgressBar
              progress={pageProgress}
              height={6}
              style={{ marginTop: Spacing.stackSm }}
            />
            <Text style={[styles.bentoSublabel, { marginTop: 6, opacity: 0.6 }]}>
              Goal: {MOCK_STATS.dailyGoalPages}
            </Text>
          </View>
        </View>

        {/* Current Read */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Read</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
              <Text style={styles.sectionLink}>View Library</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.currentReadCard, Shadows.card]}>
            {/* Cover */}
            <View style={styles.currentReadCover}>
              <Image
                source={{ uri: CURRENT_BOOK.cover_url }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              <View style={styles.readBadge}>
                <Text style={styles.readBadgeText}>
                  {Math.round(bookProgress * 100)}% READ
                </Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.currentReadInfo}>
              <View>
                <Text style={styles.currentReadTitle}>{CURRENT_BOOK.title}</Text>
                <Text style={styles.currentReadAuthor}>
                  {CURRENT_BOOK.author} · {CURRENT_BOOK.genres[0]}
                </Text>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    Page {CURRENT_BOOK.current_page} of {CURRENT_BOOK.total_pages}
                  </Text>
                  <Text style={[styles.progressLabel, { color: Colors.primary, fontWeight: '700' }]}>
                    ~12m left
                  </Text>
                </View>
                <ProgressBar progress={bookProgress} height={4} />
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.push('/session/active')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="play-circle" size={20} color={Colors.onPrimary} />
                <Text style={styles.continueButtonText}>Continue Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={[styles.weeklyCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, Typography.styles.labelLg]}>Weekly Progress</Text>
            <Text style={styles.weeklySubtitle}>Last 7 Days</Text>
          </View>
          <View style={styles.barChart}>
            {MOCK_STATS.weeklyData.map((val, i) => {
              const barH = maxWeekly > 0 ? (val / maxWeekly) * 80 : 4;
              const isToday = i === new Date().getDay() - 1;
              return (
                <View key={i} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, barH),
                        backgroundColor: isToday ? Colors.primary : `${Colors.primary}33`,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{WEEK_DAYS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
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
    color: Colors.onSurface,
  },
  sectionLink: {
    ...Typography.styles.labelSm,
    color: Colors.primary,
  },
  welcomeHeading: {
    ...Typography.styles.displayLgMobile,
    color: Colors.onSurface,
  },
  welcomeSub: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: Spacing.gutter,
  },
  bentoCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    gap: Spacing.base,
    ...Shadows.card,
  },
  bentoCardHalf: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bentoStat: {
    ...Typography.styles.numericXl,
    fontSize: 32,
    color: Colors.primary,
  },
  bentoLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  bentoSublabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  currentReadCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
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
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  readBadgeText: {
    ...Typography.styles.labelSm,
    color: Colors.onPrimary,
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
    color: Colors.onSurface,
    fontSize: 20,
  },
  currentReadAuthor: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
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
    color: Colors.onSurfaceVariant,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    ...Shadows.button,
  },
  continueButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  weeklyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  weeklySubtitle: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
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
    color: Colors.onSurfaceVariant,
  },
});
