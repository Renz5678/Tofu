import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import { BookCard } from '@/components/BookCard';
import {
  usePlaylists,
  usePlaylistItems,
  useUpdatePlaylist,
  PlaylistItem,
} from '@/hooks/usePlaylists';

export default function PlaylistDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: playlists } = usePlaylists();
  const { data: items } = usePlaylistItems(id);
  const { mutateAsync: updatePlaylist } = useUpdatePlaylist();

  const [localData, setLocalData] = useState<PlaylistItem[]>([]);

  // Modal State
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (items) {
      setLocalData(items);
    }
  }, [items]);

  const playlist = playlists?.find((p) => p.id === id);

  const handleOpenSettings = () => {
    if (!playlist) return;
    setEditTitle(playlist.title);
    setEditIsPublic(playlist.is_public);
    setSettingsModalVisible(true);
  };

  const handleSaveSettings = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await updatePlaylist({
        id,
        title: editTitle.trim(),
        is_public: editIsPublic,
      });
      setSettingsModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update reading list settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!playlist) return null;

  const renderItem = ({ item }: { item: PlaylistItem }) => {
    const bookData = Array.isArray(item.book) ? item.book[0] : item.book;

    return (
      <View style={styles.gridItem}>
        <BookCard
          id={bookData?.open_library_id}
          title={bookData?.title}
          author={bookData?.author ?? 'Unknown'}
          coverUrl={bookData?.cover_url ?? undefined}
          onPress={() => {
            const discoverBook = {
              key: bookData?.open_library_id,
              title: bookData?.title,
              author: bookData?.author,
              cover_url: bookData?.cover_url,
              number_of_pages: bookData?.total_pages,
            };
            router.push(
              `/discover/${encodeURIComponent(bookData?.open_library_id || '')}?bookData=${encodeURIComponent(
                JSON.stringify(discoverBook)
              )}` as any
            );
          }}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playlist.title}
        </Text>
        <TouchableOpacity hitSlop={12} onPress={handleOpenSettings}>
          <MaterialIcons name="more-vert" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={localData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
            <Text style={styles.meta}>
              {items?.length ?? 0} books · {playlist.is_public ? 'Public' : 'Private'}
            </Text>
          </View>
        }
      />

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reading List Settings</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Reading List Name"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Make Public</Text>
                <Text style={styles.switchDesc}>
                  Allow visitors to see this list on your profile.
                </Text>
              </View>
              <Switch
                value={editIsPublic}
                onValueChange={setEditIsPublic}
                trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSettingsModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveSettings}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.containerPadding,
      paddingBottom: Spacing.stackSm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    headerTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
      flex: 1,
      marginHorizontal: Spacing.stackSm,
    },
    listHeader: {
      marginBottom: Spacing.stackMd,
      gap: Spacing.stackSm,
    },
    listContent: {
      paddingHorizontal: Spacing.containerPadding,
      paddingTop: Spacing.stackMd,
    },
    description: { ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, opacity: 0.7 },
    meta: { ...Typography.styles.labelSm, color: colors.onSurfaceVariant, opacity: 0.5 },
    columnWrapper: {
      gap: Spacing.base,
      marginBottom: Spacing.base,
    },
    gridItem: {
      flex: 1,
      maxWidth: '48%',
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: Spacing.containerPadding,
    },
    modalContent: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radius.xl,
      padding: Spacing.containerPadding,
      gap: Spacing.stackMd,
    },
    modalTitle: {
      ...Typography.styles.headlineMd,
      color: colors.onSurface,
      marginBottom: Spacing.stackSm,
    },
    fieldGroup: { gap: 6 },
    label: { ...Typography.styles.labelSm, color: colors.onSurfaceVariant, marginLeft: 4 },
    modalInput: {
      ...Typography.styles.bodyMd,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: Radius.md,
      padding: 16,
      color: colors.onSurface,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.stackSm,
      gap: Spacing.base,
    },
    switchLabel: { ...Typography.styles.titleSm, color: colors.onSurface },
    switchDesc: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
      marginTop: 2,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.stackSm,
      marginTop: Spacing.base,
    },
    modalCancel: { paddingHorizontal: 20, paddingVertical: 12 },
    modalCancelText: { ...Typography.styles.labelLg, color: colors.onSurfaceVariant },
    modalSave: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: Radius.full,
      minWidth: 120,
      alignItems: 'center',
    },
    modalSaveText: { ...Typography.styles.labelLg, color: colors.onPrimary },
  });
