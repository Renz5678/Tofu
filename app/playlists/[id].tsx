import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { BookCard } from '@/components/BookCard';
import { usePlaylists, usePlaylistItems } from '@/hooks/usePlaylists';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: playlists = [] } = usePlaylists();
  const { data: items = [] } = usePlaylistItems(id);
  
  const playlist = playlists.find((p) => p.id === id);
  if (!playlist) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{playlist.title}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => Alert.alert('Coming Soon', 'Playlist settings will be available in the next update!')}>
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
        <Text style={styles.meta}>{items.length} books · {playlist.is_public ? 'Public' : 'Private'}</Text>

        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={{ width: '48%' }}>
              <BookCard
                id={item.book.id}
                title={item.book.title}
                author={item.book.author}
                coverUrl={item.book.cover_url}
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
