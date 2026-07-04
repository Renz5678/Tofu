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
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
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
      book: book?.title ?? 'Unknown Book',
      minutes: Math.round(s.duration_seconds / 60),
      pages: s.pages_read,
      date: dateDisplay
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      {/* Period toggle */}
      <View style={styles.periodRow}>
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
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Aggregate stats */}
        <View style={styles.statsGrid}>
          <StatCard value={`${totalBooksRead}`} label="Books Read" />
          <StatCard value={`${totalPagesRead.toLocaleString()}`} label="Pages Read" />
          <StatCard value={`${currentStreak}`} label="Day Streak" />
          <StatCard value={`${avgPagesPerHour}`} label="Pages / Hour" />
        </View>

        {/* Progress ring cluster */}
        <View style={[styles.ringCard, Shadows.card]}>
          <Text style={styles.cardTitle}>Today's Goals</Text>
          <View style={styles.ringRow}>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={minuteProgress}
                size={88}
                strokeWidth={8}
                showLabel
                labelText={`${todayMinutes}m`}
              />
              <Text style={styles.ringLabel}>Minutes</Text>
            </View>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={pageProgress}
                size={88}
                strokeWidth={8}
                showLabel
                labelText={`${todayPages}p`}
              />
              <Text style={styles.ringLabel}>Pages</Text>
            </View>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={currentStreak > 0 ? 1 : 0}
                size={88}
                strokeWidth={8}
                showLabel
                labelText={`${currentStreak}`}
                color={Colors.tertiaryFixedDim}
              />
              <Text style={styles.ringLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={[styles.chartCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Minutes Read</Text>
            <Text style={styles.chartSubtitle}>Last 7 days</Text>
          </View>
          <View style={styles.barChart}>
            {chartData.map((val, i) => {
              const barH = maxChartVal > 0 ? (val / maxChartVal) * 100 : 4;
              const isToday = period === 'week' && i === 6;
              return (
                <View key={i} style={styles.barColumn}>
                  <Text style={styles.barValue}>{val}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, barH),
                        backgroundColor: isToday ? Colors.primary : `${Colors.primary}33`,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{chartLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent sessions */}
        <View style={[styles.sessionsCard, Shadows.card]}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {recentSessions.length === 0 ? (
            <Text style={{ ...Typography.styles.bodyMd, color: Colors.onSurfaceVariant, paddingVertical: Spacing.stackSm }}>
              No reading sessions yet.
            </Text>
          ) : (
            recentSessions.map((s, i) => (
              <View key={i} style={[styles.sessionRow, i > 0 && styles.sessionRowBorder]}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionBook} numberOfLines={1}>{s.book}</Text>
                  <Text style={styles.sessionDate}>{s.date}</Text>
                </View>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>{s.minutes}m</Text>
                  <Text style={[styles.sessionStat, { color: Colors.onSurfaceVariant, opacity: 0.5 }]}>
                    · {s.pages}p
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.statCard, Shadows.card]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
  },
  periodRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
  },
  periodPills: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 4,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  periodPillText: {
    ...Typography.styles.labelLg,
    color: Colors.onSurfaceVariant,
  },
  periodPillTextActive: {
    color: Colors.primary,
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.base,
    gap: Spacing.stackMd,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: 4,
  },
  statValue: {
    ...Typography.styles.numericXl,
    fontSize: 32,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  ringCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  cardTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
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
    color: Colors.onSurfaceVariant,
  },
  chartCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartSubtitle: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
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
    color: Colors.onSurfaceVariant,
  },
  bar: {
    width: 10,
    borderRadius: 5,
  },
  barLabel: {
    ...Typography.styles.labelSm,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  sessionsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
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
    borderTopColor: Colors.outlineVariant,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionBook: {
    ...Typography.styles.labelLg,
    color: Colors.onSurface,
  },
  sessionDate: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sessionStat: {
    ...Typography.styles.labelLg,
    color: Colors.primary,
  },
});
