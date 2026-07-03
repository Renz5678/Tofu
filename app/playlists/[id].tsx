import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BookCard } from '@/components/BookCard';
import { MOCK_PLAYLISTS } from '@/lib/mockData';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const playlist = MOCK_PLAYLISTS.find((p) => p.id === id) ?? MOCK_PLAYLISTS[0];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{playlist.title}</Text>
        <TouchableOpacity hitSlop={12}>
          <MaterialIcons name="more-vert" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {playlist.description && (
          <Text style={styles.description}>{playlist.description}</Text>
        )}
        <Text style={styles.meta}>{playlist.books.length} books · {playlist.is_public ? 'Public' : 'Private'}</Text>

        <View style={styles.grid}>
          {playlist.books.map((book) => (
            <View key={book.id} style={{ width: '48%' }}>
              <BookCard
                id={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url}
                currentPage={book.current_page}
                totalPages={book.total_pages}
              />
            </View>
          ))}
        </View>
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
    gap: Spacing.stackSm,
  },
  description: { ...Typography.styles.bodyMd, color: Colors.onSurfaceVariant, opacity: 0.7 },
  meta: { ...Typography.styles.labelSm, color: Colors.onSurfaceVariant, opacity: 0.5 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gutter,
    marginTop: Spacing.base,
  },
});
