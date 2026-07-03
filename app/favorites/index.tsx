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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { EmptyState } from '@/components/EmptyState';
import { MOCK_FAVORITES } from '@/lib/mockData';

const SLOTS = [1, 2, 3, 4, 5];

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const hasFavorites = MOCK_FAVORITES.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <TouchableOpacity hitSlop={12}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {!hasFavorites ? (
        <EmptyState
          icon="favorite-border"
          title="No favorites yet"
          description="Add up to 5 all-time favorite books to showcase your reading taste."
          actionLabel="Browse Library"
          onAction={() => router.push('/(tabs)/library')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionSub}>Your top 5 all-time favorites</Text>

          {SLOTS.map((rank) => {
            const fav = MOCK_FAVORITES.find((f: any) => f.rank === rank);
            return (
              <View key={rank} style={[styles.favoriteCard, Shadows.card]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{rank}</Text>
                </View>
                {fav ? (
                  <>
                    <View style={styles.favCover}>
                      <Image source={{ uri: fav.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                    </View>
                    <View style={styles.favInfo}>
                      <Text style={styles.favTitle} numberOfLines={2}>{fav.title}</Text>
                      <Text style={styles.favAuthor}>{fav.author}</Text>
                      <View style={styles.favChips}>
                        {fav.genres.slice(0, 2).map((g: string) => (
                          <View key={g} style={styles.chip}>
                            <Text style={styles.chipText}>{g}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity hitSlop={12}>
                      <MaterialIcons name="drag-handle" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlot}
                    onPress={() => router.push('/(tabs)/library')}
                  >
                    <MaterialIcons name="add" size={24} color={Colors.primary} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptySlotText}>Add a book</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
  headerTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
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
  favoriteCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimaryContainer,
    fontSize: 12,
  },
  favCover: {
    width: 52,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  favInfo: {
    flex: 1,
    gap: 4,
  },
  favTitle: {
    ...Typography.styles.titleSm,
    fontSize: 15,
    color: Colors.onSurface,
  },
  favAuthor: {
    ...Typography.styles.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  favChips: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    ...Typography.styles.labelSm,
    color: Colors.onSecondaryContainer,
    fontSize: 10,
  },
  emptySlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.stackMd,
  },
  emptySlotText: {
    ...Typography.styles.labelLg,
    color: Colors.primary,
    opacity: 0.5,
  },
});
