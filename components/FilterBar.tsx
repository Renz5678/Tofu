import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Typography, Spacing, Radius } from '@/theme';

export type FilterChip = {
  label: string;
  value: string;
};

interface FilterBarProps {
  chips: FilterChip[];
  activeValue?: string;
  onSelect?: (value: string | null) => void;
  style?: object;
}

export function FilterBar({ chips, activeValue, onSelect, style }: FilterBarProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [selected, setSelected] = useState<string | null>(activeValue ?? null);

  const handlePress = (value: string) => {
    const next = selected === value ? null : value;
    setSelected(next);
    onSelect?.(next);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, style]}
      >
        {chips.map((chip) => {
          const active = selected === chip.value;
          return (
            <TouchableOpacity
              key={chip.value}
              onPress={() => handlePress(chip.value)}
              activeOpacity={0.75}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            >
              <Text
                style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Status tab row (Reading / Finished / On Hold) ───────────────────────────
interface StatusTabsProps {
  tabs: { label: string; value: string }[];
  activeValue: string;
  onSelect: (value: string) => void;
}

export function StatusTabs({ tabs, activeValue, onSelect }: StatusTabsProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.tabRow}>
      {tabs.map((tab) => {
        const active = tab.value === activeValue;
        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onSelect(tab.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      paddingVertical: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.gutter,
      paddingVertical: Spacing.base,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    chipActive: {
      backgroundColor: colors.chipActive,
      borderColor: colors.chipActive,
    },
    chipInactive: {
      backgroundColor: colors.chipInactive,
      borderColor: colors.outlineVariant,
    },
    chipText: {
      ...Typography.styles.labelLg,
    },
    chipTextActive: {
      color: colors.chipActiveText,
    },
    chipTextInactive: {
      color: colors.chipInactiveText,
    },
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...Typography.styles.labelLg,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    tabTextInactive: {
      color: colors.onSurfaceVariant,
      opacity: 0.6,
    },
  });
