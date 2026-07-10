import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useProfile } from '@/hooks/useProfile';
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { useGoals } from '@/hooks/useGoals';
import { useLibrary } from '@/hooks/useLibrary';
import { ProgressRing, ProgressBar } from '@/components/ProgressRing';
import { format } from 'date-fns';

type Period = 'day' | 'week' | 'month';

const PERIOD_TABS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [period, setPeriod] = useState<Period>('week');

  const { data: profile } = useProfile();
  const { data: sessions = [] } = useReadingSessions();
  const { data: goals = [] } = useGoals();
  const { data: libraryBooks = [] } = useLibrary();

  const totalBooksRead = libraryBooks.filter(b => b.status === 'finished').length;
  const totalPagesRead = sessions.reduce((acc, s) => acc + s.pages_read, 0);
  
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60;
  const avgPagesPerHour = totalMinutes > 0 ? Math.round(totalPagesRead / (totalMinutes / 60)) : 0;

  const dailyMinuteGoal = goals.find(g => g.goal_type === 'minutes_per_day')?.target_value || 30;
  const dailyPageGoal = goals.find(g => g.goal_type === 'pages_per_day')?.target_value || 20;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.start_time.startsWith(todayStr));
  const todayMinutes = Math.round(todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);
  const todayPages = todaySessions.reduce((acc, s) => acc + s.pages_read, 0);

  const minuteProgress = Math.min(1, todayMinutes / dailyMinuteGoal);
  const pageProgress = Math.min(1, todayPages / dailyPageGoal);
  const currentStreak = profile?.streak?.current_streak ?? 0;
  const isStreakActive = currentStreak >= 3;

  const chartData: number[] = [];
  const chartLabels: string[] = [];
  const today = new Date();
  
  if (period === 'week') {
    const last7Dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    last7Dates.forEach(dateStr => {
      const d = new Date(dateStr);
      chartLabels.push(WEEK_DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]);
      const dayMins = sessions
        .filter(s => s.start_time.startsWith(dateStr))
        .reduce((acc, s) => acc + s.duration_seconds, 0) / 60;
      chartData.push(Math.round(dayMins));
    });
  } else if (period === 'day') {
    chartData.push(todayMinutes);
    chartLabels.push('Today');
  } else {
    // simplified month view for now
    chartData.push(0, 0, 0, 0);
    chartLabels.push('W1', 'W2', 'W3', 'W4');
  }

  const maxChartVal = Math.max(...chartData, 1);

  // Recent Sessions
  const recentSessions = sessions.slice(0, 5).map(s => {
    const book = libraryBooks.find(b => b.id === s.user_book_id);
    const dateStr = s.start_time.split('T')[0];
    let dateDisplay = dateStr;
    if (dateStr === todayStr) dateDisplay = 'Today';
    else if (dateStr === new Date(Date.now() - 86400000).toISOString().split('T')[0]) dateDisplay = 'Yesterday';
    else dateDisplay = format(new Date(s.start_time), 'MMM d');
    
    return {
      id: s.id,
      book: book?.title ?? 'Unknown Book',
      minutes: Math.round(s.duration_seconds / 60),
      pages: s.pages_read,
      date: dateDisplay
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{totalBooksRead}</Text>
            <Text style={styles.summaryLabel}>Books Read</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{totalPagesRead.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Pages Read</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{Math.round(totalMinutes / 60)}</Text>
            <Text style={styles.summaryLabel}>Hours Read</Text>
          </View>
        </Animated.View>

        {/* Progress ring cluster */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[styles.ringCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Today's Goals</Text>
            <View style={[styles.streakBadge, !isStreakActive && { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons 
                name="local-fire-department" 
                size={16} 
                color={isStreakActive ? colors.onPrimaryContainer : colors.onSurfaceVariant} 
              />
              <Text style={[styles.streakText, !isStreakActive && { color: colors.onSurfaceVariant }]}>
                {isStreakActive ? `${currentStreak} Day Streak` : `${currentStreak}/3 to Streak`}
              </Text>
            </View>
          </View>
          <View style={styles.ringRow}>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={minuteProgress}
                size={100}
                strokeWidth={10}
                showLabel
                labelText={`${todayMinutes}m`}
              />
              <Text style={styles.ringLabel}>Minutes</Text>
            </View>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={pageProgress}
                size={100}
                strokeWidth={10}
                showLabel
                labelText={`${todayPages}p`}
              />
              <Text style={styles.ringLabel}>Pages</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bar chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={[styles.chartCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Minutes Read</Text>
          </View>
          
          <View style={styles.periodPills}>
            {PERIOD_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setPeriod(tab.value)}
                style={[styles.periodPill, period === tab.value && styles.periodPillActive]}
              >
                <Text style={[styles.periodPillText, period === tab.value && styles.periodPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.barChart}>
            {chartData.map((val, i) => {
              const barH = maxChartVal > 0 ? (val / maxChartVal) * 80 : 0;
              const isToday = period === 'week' && i === 6;
              const targetHeight = barH;
              return (
                <View key={i} style={styles.barColumn}>
                  {val > 0 && <Text style={styles.barValue}>{val}</Text>}
                  <AnimatedBar targetHeight={targetHeight} isToday={isToday} />
                  <Text style={styles.barLabel}>{chartLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Recent sessions */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={[styles.sessionsCard, Shadows.card]}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {recentSessions.length === 0 ? (
            <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, paddingVertical: Spacing.stackSm }}>
              No reading sessions yet.
            </Text>
          ) : (
            recentSessions.map((s, i) => (
              <View key={s.id} style={[styles.sessionRow, i > 0 && styles.sessionRowBorder]}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionBook} numberOfLines={1}>{s.book}</Text>
                  <Text style={styles.sessionDate}>{s.date}</Text>
                </View>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>{s.minutes}m</Text>
                  <Text style={[styles.sessionStat, { color: colors.onSurfaceVariant, opacity: 0.5 }]}>
                    · {s.pages}p
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}



function AnimatedBar({ targetHeight, isToday }: { targetHeight: number; isToday: boolean }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const height = useSharedValue(0);

  React.useEffect(() => {
    height.value = withTiming(targetHeight, { 
      duration: 1000, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [targetHeight]);

  const animStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: isToday ? colors.primary : `${colors.primary}33` },
        animStyle,
      ]}
    />
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
  },
  periodRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
  },
  periodPills: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 4,
    width: '100%',
    marginBottom: Spacing.stackSm,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  periodPillText: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  periodPillTextActive: {
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.base,
    gap: Spacing.stackMd,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: Spacing.stackMd,
    paddingHorizontal: Spacing.gutter,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryVal: {
    ...Typography.styles.numericXl,
    fontSize: 24,
    color: colors.primary,
  },
  summaryLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  summaryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.outlineVariant,
  },
  ringCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  cardTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ringItem: {
    alignItems: 'center',
    gap: Spacing.base,
  },
  ringLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  chartCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tertiaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    gap: 4,
  },
  streakText: {
    ...Typography.styles.labelSm,
    color: colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    ...Typography.styles.labelSm,
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  bar: {
    width: 10,
    borderRadius: 5,
  },
  barLabel: {
    ...Typography.styles.labelSm,
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  sessionsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.stackSm,
  },
  sessionRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionBook: {
    ...Typography.styles.labelLg,
    color: colors.onSurface,
  },
  sessionDate: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sessionStat: {
    ...Typography.styles.labelLg,
    color: colors.primary,
  },
});
