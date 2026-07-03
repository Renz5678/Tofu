import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { ProgressRing } from '@/components/ProgressRing';
import { MOCK_STATS } from '@/lib/mockData';

type Period = 'day' | 'week' | 'month';

const PERIOD_TABS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('week');
  const maxWeekly = Math.max(...MOCK_STATS.weeklyData);

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
          <StatCard value={`${MOCK_STATS.totalBooksRead}`} label="Books Read" />
          <StatCard value={`${MOCK_STATS.totalPagesRead.toLocaleString()}`} label="Pages Read" />
          <StatCard value={`${MOCK_STATS.currentStreak}`} label="Day Streak 🔥" />
          <StatCard value={`${MOCK_STATS.avgPagesPerHour}`} label="Pages / Hour" />
        </View>

        {/* Progress ring cluster */}
        <View style={[styles.ringCard, Shadows.card]}>
          <Text style={styles.cardTitle}>Today's Goals</Text>
          <View style={styles.ringRow}>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={MOCK_STATS.todayMinutes / MOCK_STATS.dailyGoalMinutes}
                size={88}
                strokeWidth={8}
                showLabel
                labelText={`${MOCK_STATS.todayMinutes}m`}
              />
              <Text style={styles.ringLabel}>Minutes</Text>
            </View>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={MOCK_STATS.todayPages / MOCK_STATS.dailyGoalPages}
                size={88}
                strokeWidth={8}
                showLabel
                labelText={`${MOCK_STATS.todayPages}p`}
              />
              <Text style={styles.ringLabel}>Pages</Text>
            </View>
            <View style={styles.ringItem}>
              <ProgressRing
                progress={0.6}
                size={88}
                strokeWidth={8}
                showLabel
                labelText="60%"
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
            {MOCK_STATS.weeklyData.map((val, i) => {
              const barH = maxWeekly > 0 ? (val / maxWeekly) * 100 : 4;
              const isToday = i === new Date().getDay() - 1;
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
                  <Text style={styles.barLabel}>{WEEK_DAYS[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent sessions placeholder */}
        <View style={[styles.sessionsCard, Shadows.card]}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {[
            { book: 'The Midnight Library', minutes: 32, pages: 18, date: 'Today' },
            { book: 'Midnight in Kyoto', minutes: 45, pages: 28, date: 'Yesterday' },
            { book: 'The Silent Garden', minutes: 20, pages: 12, date: '2 days ago' },
          ].map((s, i) => (
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
          ))}
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
