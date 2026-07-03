import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { EmptyState } from '@/components/EmptyState';

const MOCK_TIER_LISTS = [
  { id: '1', title: 'My 2024 Reading Tier List', bookCount: 8, updatedAt: '2 days ago' },
  { id: '2', title: 'Fantasy Novels Ranked', bookCount: 12, updatedAt: '1 week ago' },
];

export default function TierListsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tier Lists</Text>
        <TouchableOpacity style={styles.addButton} hitSlop={12}>
          <MaterialIcons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {MOCK_TIER_LISTS.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No tier lists yet"
          description="Create your first book tier list to rank your reads."
          actionLabel="Create Tier List"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_TIER_LISTS.map((tl) => (
            <TouchableOpacity
              key={tl.id}
              style={[styles.card, Shadows.card]}
              onPress={() => router.push(`/tier-lists/${tl.id}` as any)}
              activeOpacity={0.85}
            >
              {/* Tier badges preview */}
              <View style={styles.tierPreview}>
                {['S', 'A', 'B', 'C', 'D'].map((tier) => (
                  <View key={tier} style={[styles.tierBadge, { backgroundColor: tierColor(tier) }]}>
                    <Text style={styles.tierBadgeText}>{tier}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{tl.title}</Text>
                <Text style={styles.cardMeta}>{tl.bookCount} books · {tl.updatedAt}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function tierColor(tier: string): string {
  const map: Record<string, string> = {
    S: Colors.primary,
    A: Colors.primaryContainer,
    B: Colors.secondaryContainer,
    C: Colors.surfaceContainerHigh,
    D: Colors.surfaceContainerHighest,
  };
  return map[tier] ?? Colors.surfaceContainer;
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  tierPreview: {
    flexDirection: 'column',
    gap: 2,
  },
  tierBadge: {
    width: 24,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeText: {
    ...Typography.styles.labelSm,
    fontSize: 9,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  cardTitle: { ...Typography.styles.titleSm, fontSize: 15, color: Colors.onSurface },
  cardMeta: { ...Typography.styles.labelSm, color: Colors.onSurfaceVariant, opacity: 0.6 },
});
