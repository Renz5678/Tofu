import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { ProgressRing } from '@/components/ProgressRing';
import { useGoals, useUpsertGoal, GoalType } from '@/hooks/useGoals';
import { useReadingSessions } from '@/hooks/useReadingSessions';

const LABELS: Record<GoalType, string> = {
  pages_per_day: 'Pages per day',
  minutes_per_day: 'Minutes per day',
  pages_per_week: 'Pages per week'
};

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: goals = [] } = useGoals();
  const { data: sessions = [] } = useReadingSessions();
  const { mutateAsync: upsertGoal } = useUpsertGoal();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<GoalType>('pages_per_day');
  const [targetValue, setTargetValue] = useState('');
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes');

  const handleOpenModal = (type?: GoalType, initialValue?: number) => {
    setEditingType(type || 'pages_per_day');
    if (type === 'minutes_per_day' && initialValue && initialValue >= 60 && initialValue % 60 === 0) {
      setTimeUnit('hours');
      setTargetValue(String(initialValue / 60));
    } else {
      setTimeUnit('minutes');
      setTargetValue(initialValue ? String(initialValue) : '');
    }
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    let val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid number greater than 0.');
      return;
    }
    if (editingType === 'minutes_per_day' && timeUnit === 'hours') {
      val = Math.round(val * 60);
    } else {
      val = Math.round(val);
    }
    try {
      await upsertGoal({ goal_type: editingType, target_value: val });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save goal.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.start_time.startsWith(todayStr));
  const todayPages = todaySessions.reduce((acc, s) => acc + s.pages_read, 0);
  const todayMinutes = Math.round(todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);

  const thisWeekSessions = sessions.filter(s => {
    const d = new Date(s.start_time);
    const now = new Date();
    return Math.abs(now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  });
  const weekPages = thisWeekSessions.reduce((acc, s) => acc + s.pages_read, 0);

  const mergedGoals = goals.map(g => {
    let current = 0;
    if (g.goal_type === 'pages_per_day') current = todayPages;
    if (g.goal_type === 'minutes_per_day') current = todayMinutes;
    if (g.goal_type === 'pages_per_week') current = weekPages;
    
    return {
      ...g,
      label: LABELS[g.goal_type] || g.goal_type,
      current,
      target: g.target_value
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Goals</Text>
        <TouchableOpacity style={styles.addButton} hitSlop={12} onPress={() => handleOpenModal()}>
          <MaterialIcons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSub}>Track your daily and weekly reading goals</Text>

        {mergedGoals.map((goal) => {
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
              <TouchableOpacity hitSlop={12} onPress={() => handleOpenModal(goal.goal_type, goal.target)}>
                <MaterialIcons name="edit" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add goal placeholder */}
        <TouchableOpacity style={styles.addGoalCard} onPress={() => handleOpenModal()}>
          <MaterialIcons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addGoalText}>Add a new goal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Goal Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Reading Goal</Text>
            
            <View style={styles.modalTypeRow}>
              {(Object.keys(LABELS) as GoalType[]).map(key => (
                <TouchableOpacity
                  key={key}
                  style={[styles.modalTypePill, editingType === key && styles.modalTypePillActive]}
                  onPress={() => setEditingType(key)}
                >
                  <Text style={[styles.modalTypeText, editingType === key && styles.modalTypeTextActive]}>
                    {LABELS[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View>
              <TextInput
                style={styles.modalInput}
                keyboardType={editingType === 'minutes_per_day' && timeUnit === 'hours' ? 'decimal-pad' : 'number-pad'}
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder={`Target value (e.g. ${editingType === 'minutes_per_day' && timeUnit === 'hours' ? '1.5' : '30'})`}
                placeholderTextColor={Colors.onSurfaceVariant}
                autoFocus
              />
              
              {editingType === 'minutes_per_day' && (
                <View style={styles.unitToggleRow}>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, timeUnit === 'minutes' && styles.unitToggleBtnActive]}
                    onPress={() => setTimeUnit('minutes')}
                  >
                    <Text style={[styles.unitToggleText, timeUnit === 'minutes' && styles.unitToggleTextActive]}>Minutes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitToggleBtn, timeUnit === 'hours' && styles.unitToggleBtnActive]}
                    onPress={() => setTimeUnit('hours')}
                  >
                    <Text style={[styles.unitToggleText, timeUnit === 'hours' && styles.unitToggleTextActive]}>Hours</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveGoal}>
                <Text style={styles.modalSaveText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerPadding,
  },
  modalContent: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  modalTitle: { ...Typography.styles.headlineSm, color: Colors.onSurface, marginBottom: Spacing.stackSm },
  modalTypeRow: { gap: Spacing.stackSm },
  modalTypePill: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  modalTypePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalTypeText: { ...Typography.styles.labelLg, color: Colors.onSurfaceVariant },
  modalTypeTextActive: { color: Colors.onPrimary, fontWeight: 'bold' },
  modalInput: {
    ...Typography.styles.bodyLg,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: 16, marginTop: Spacing.stackSm,
    color: Colors.onSurface,
  },
  unitToggleRow: {
    flexDirection: 'row',
    marginTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  unitToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  unitToggleBtnActive: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.secondaryContainer,
  },
  unitToggleText: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  unitToggleTextActive: {
    color: Colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.stackSm, marginTop: Spacing.base },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 12 },
  modalCancelText: { ...Typography.styles.labelLg, color: Colors.onSurfaceVariant },
  modalSave: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: Radius.full },
  modalSaveText: { ...Typography.styles.labelLg, color: Colors.onPrimary },
});
