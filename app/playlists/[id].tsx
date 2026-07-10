import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { BookCard } from '@/components/BookCard';
import { usePlaylists, usePlaylistItems, useUpdatePlaylistPositions, PlaylistItem } from '@/hooks/usePlaylists';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: playlists } = usePlaylists();
  const { data: items } = usePlaylistItems(id);
  const { mutate: updatePositions } = useUpdatePlaylistPositions();
  
  const [localData, setLocalData] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    if (items) {
      setLocalData(items);
    }
  }, [items]);

  const playlist = playlists?.find((p) => p.id === id);
  if (!playlist) return null;

  const handleDragEnd = ({ data }: { data: PlaylistItem[] }) => {
    setLocalData(data);
    const updates = data.map((item, index) => ({
      id: item.id,
      book_id: item.book_id,
      position: index,
    }));
    updatePositions({ listId: id, items: updates });
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<PlaylistItem>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.dragItem,
          isActive && { backgroundColor: Colors.surfaceContainerHighest, transform: [{ scale: 1.02 }] },
        ]}
      >
        <MaterialIcons name="drag-handle" size={24} color={Colors.onSurfaceVariant} style={styles.dragHandle} />
        <View style={{ flex: 1 }}>
          <BookCard
            id={item.book.open_library_id}
            title={item.book.title}
            author={item.book.author ?? 'Unknown'}
            coverUrl={item.book.cover_url ?? undefined}
          />
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

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

      <DraggableFlatList
        data={localData}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {playlist.description && (
              <Text style={styles.description}>{playlist.description}</Text>
            )}
            <Text style={styles.meta}>{items.length} books · {playlist.is_public ? 'Public' : 'Private'}</Text>
            <Text style={styles.metaHint}>Long press a book to reorder</Text>
          </View>
        }
      />
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
  listHeader: {
    marginBottom: Spacing.stackMd,
    gap: Spacing.stackSm,
  },
  listContent: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
  },
  description: { ...Typography.styles.bodyMd, color: Colors.onSurfaceVariant, opacity: 0.7 },
  meta: { ...Typography.styles.labelSm, color: Colors.onSurfaceVariant, opacity: 0.5 },
  metaHint: { ...Typography.styles.labelSm, color: Colors.primary, opacity: 0.8, marginTop: 4 },
  dragItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  dragHandle: {
    marginRight: Spacing.stackSm,
  },
});
