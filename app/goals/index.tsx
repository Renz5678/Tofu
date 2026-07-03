import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { ProgressRing } from '@/components/ProgressRing';

const MOCK_GOALS = [
  { id: '1', type: 'pages_per_day', target: 40, current: 28, active: true, label: 'Pages per day' },
  { id: '2', type: 'minutes_per_day', target: 60, current: 45, active: true, label: 'Minutes per day' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Goals</Text>
        <TouchableOpacity style={styles.addButton} hitSlop={12}>
          <MaterialIcons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSub}>Track your daily and weekly reading goals</Text>

        {MOCK_GOALS.map((goal) => {
          const progress = Math.min(1, goal.current / goal.target);
          return (
            <View key={goal.id} style={[styles.goalCard, Shadows.card]}>
              <ProgressRing
                progress={progress}
                size={80}
                strokeWidth={8}
                showLabel
                labelText={`${Math.round(progress * 100)}%`}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.goalLabel}>{goal.label}</Text>
                <Text style={styles.goalValues}>
                  {goal.current} / {goal.target}
                </Text>
                <View style={styles.goalStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: goal.active ? Colors.primary : Colors.outline }]} />
                  <Text style={styles.goalStatusText}>{goal.active ? 'Active' : 'Paused'}</Text>
                </View>
              </View>
              <TouchableOpacity hitSlop={12}>
                <MaterialIcons name="more-vert" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add goal placeholder */}
        <TouchableOpacity style={styles.addGoalCard}>
          <MaterialIcons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addGoalText}>Add a new goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  headerTitle: { ...Typography.styles.titleSm, color: Colors.onSurface },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  sectionSub: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
    marginBottom: Spacing.base,
  },
  goalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  goalLabel: { ...Typography.styles.titleSm, fontSize: 15, color: Colors.onSurface },
  goalValues: { ...Typography.styles.bodyMd, color: Colors.onSurfaceVariant },
  goalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  goalStatusText: { ...Typography.styles.labelSm, color: Colors.onSurfaceVariant },
  addGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    paddingVertical: Spacing.stackMd,
  },
  addGoalText: { ...Typography.styles.labelLg, color: Colors.primary },
});
