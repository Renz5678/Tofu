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
import { MOCK_PLAYLISTS } from '@/lib/mockData';

export default function PlaylistsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Lists</Text>
        <TouchableOpacity style={styles.addButton} hitSlop={12}>
          <MaterialIcons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {MOCK_PLAYLISTS.length === 0 ? (
        <EmptyState
          icon="playlist-play"
          title="No reading lists yet"
          description="Create curated lists of books to read next."
          actionLabel="Create a List"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_PLAYLISTS.map((pl) => (
            <TouchableOpacity
              key={pl.id}
              style={[styles.card, Shadows.card]}
              onPress={() => router.push(`/playlists/${pl.id}` as any)}
              activeOpacity={0.85}
            >
              {/* Cover collage */}
              <View style={styles.collage}>
                {pl.books.slice(0, 4).map((book, i) => (
                  <View
                    key={book.id}
                    style={[
                      styles.collageCell,
                      i === 0 && { borderTopLeftRadius: Radius.md },
                      i === 1 && { borderTopRightRadius: Radius.md },
                      i === 2 && { borderBottomLeftRadius: Radius.md },
                      i === 3 && { borderBottomRightRadius: Radius.md },
                    ]}
                  >
                    <Image
                      source={{ uri: book.cover_url }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{pl.title}</Text>
                {pl.description && (
                  <Text style={styles.cardDesc} numberOfLines={2}>{pl.description}</Text>
                )}
                <Text style={styles.cardMeta}>
                  {pl.books.length} books · {pl.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
          ))}
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
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  collage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  collageCell: {
    width: '50%',
    height: '50%',
    overflow: 'hidden',
  },
  cardTitle: { ...Typography.styles.titleSm, fontSize: 15, color: Colors.onSurface },
  cardDesc: { ...Typography.styles.bodyMd, fontSize: 13, color: Colors.onSurfaceVariant, opacity: 0.7 },
  cardMeta: { ...Typography.styles.labelSm, color: Colors.onSurfaceVariant, opacity: 0.6 },
});
