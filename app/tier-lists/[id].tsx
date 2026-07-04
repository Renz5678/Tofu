import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useTierLists, useTierListItems } from '@/hooks/useTierLists';

const TIER_COLORS: Record<string, string> = {
  S: '#2d3a47',
  A: '#404e5d',
  B: '#576158',
  C: '#d8e2d7',
  D: '#e4e2dd',
};

export default function TierListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: tierLists = [] } = useTierLists();
  const { data: items = [] } = useTierListItems(id);
  const tierList = tierLists.find(t => t.id === id);

  if (!tierList) return null;

  const tiers = tierList.tiers || [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tierList.title}</Text>
        <TouchableOpacity onPress={() => router.push(`/share/tier-list/${id}` as any)} hitSlop={12}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.noteText}>
          Drag-and-drop tier placement will be enabled in a follow-up build.
        </Text>

        {tiers.map((tier) => (
            <View key={tier} style={styles.tierRow}>
              <View style={[styles.tierLabel, { backgroundColor: TIER_COLORS[tier] ?? Colors.surfaceContainer }]}>
                <Text style={[styles.tierLabelText, { color: ['S', 'A', 'B'].includes(tier) ? Colors.onPrimary : Colors.onSurface }]}>
                  {tier.substring(0, 2)}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierBooks}>
                {items.filter(i => i.tier === tier).map((item) => (
                  <View key={item.id} style={styles.tierBook}>
                    <Image
                      source={{ uri: item.book.cover_url }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.tierAddSlot}>
                  <MaterialIcons name="add" size={20} color={Colors.primary} style={{ opacity: 0.5 }} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          ))}
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
  headerTitle: { ...Typography.styles.titleSm, color: Colors.onSurface, flex: 1, marginHorizontal: Spacing.stackSm },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.base,
  },
  noteText: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.base,
    fontStyle: 'italic',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 80,
    backgroundColor: Colors.surfaceContainerLow,
  },
  tierLabel: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabelText: {
    ...Typography.styles.headlineMd,
    fontWeight: '700',
  },
  tierBooks: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    minWidth: '100%',
  },
  tierBook: {
    width: 52,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tierAddSlot: {
    width: 52,
    height: 72,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
