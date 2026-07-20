import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import { usePlaylists, useAddPlaylistItem } from '@/hooks/usePlaylists';

interface Props {
  visible: boolean;
  bookId: string; // The internal books.id
  onClose: () => void;
}

export function AddToPlaylistSheet({ visible, bookId, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const insets = useSafeAreaInsets();

  const { data: playlists = [], isLoading } = usePlaylists();
  const { mutateAsync: addItem, isPending } = useAddPlaylistItem();

  const [addingTo, setAddingTo] = useState<string | null>(null);

  const handleSelectPlaylist = async (listId: string) => {
    try {
      setAddingTo(listId);
      await addItem({ listId, bookId });
      Alert.alert('Success', 'Book added to playlist!');
      onClose();
    } catch (error: any) {
      if (error.code === '23505') {
        Alert.alert('Already Added', 'This book is already in the playlist.');
      } else {
        Alert.alert('Error', error.message || 'Could not add to playlist');
      }
    } finally {
      setAddingTo(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.stackLg) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to Reading List</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="queue-music"
                size={48}
                color={colors.onSurfaceVariant}
                style={{ opacity: 0.5 }}
              />
              <Text style={styles.emptyText}>You haven't created any reading lists yet.</Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: Spacing.containerPadding, gap: Spacing.stackSm }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistItem}
                  onPress={() => handleSelectPlaylist(item.id)}
                  disabled={addingTo !== null}
                >
                  <View style={styles.playlistIcon}>
                    <MaterialIcons name="list" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playlistTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.playlistDesc} numberOfLines={1}>
                      {item.is_public ? 'Public' : 'Private'}
                    </Text>
                  </View>
                  {addingTo === item.id && (
                    <ActivityIndicator color={colors.primary} size="small" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surfaceContainer,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.containerPadding,
      paddingVertical: Spacing.stackMd,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    headerTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
    },
    closeButton: {
      padding: 4,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      gap: 12,
    },
    emptyText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    playlistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceContainerHighest,
      padding: 12,
      borderRadius: Radius.md,
      gap: 12,
    },
    playlistIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playlistTitle: {
      ...Typography.styles.labelLg,
      color: colors.onSurface,
    },
    playlistDesc: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
    },
  });
