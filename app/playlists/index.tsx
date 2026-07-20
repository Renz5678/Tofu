import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { EmptyState } from '@/components/EmptyState';
import {
  usePlaylists,
  useCreatePlaylist,
  useDeletePlaylist,
  useUpdatePlaylist,
  Playlist,
} from '@/hooks/usePlaylists';
import { useLibrary } from '@/hooks/useLibrary';
import { PlaylistCoverCollage } from '@/components/PlaylistCoverCollage';

export default function PlaylistsIndexScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: playlists = [] } = usePlaylists();
  const { data: library = [] } = useLibrary();
  const { mutateAsync: createPlaylist } = useCreatePlaylist();
  const { mutateAsync: deletePlaylist } = useDeletePlaylist();
  const { mutateAsync: updatePlaylist } = useUpdatePlaylist();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedLongPressPlaylist, setSelectedLongPressPlaylist] = useState<Playlist | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');

  const handleOpenCreate = () => {
    setNewPlaylistTitle('My Reading List');
    setSelectedBookIds([]);
    setCreateModalVisible(true);
  };

  const handleSaveNewPlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    setIsCreating(true);
    try {
      const list = await createPlaylist({
        title: newPlaylistTitle.trim(),
        bookIds: selectedBookIds,
      });
      setCreateModalVisible(false);
      router.push(`/playlists/${list.id}`);
    } catch (e) {
      console.error('Failed to create playlist', e);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleBookSelection = (bookId: string) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleMakePublicToggle = async (pl: Playlist) => {
    try {
      await updatePlaylist({ id: pl.id, is_public: !pl.is_public });
      setSelectedLongPressPlaylist(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (pl: Playlist) => {
    Alert.alert('Delete List', `Are you sure you want to delete "${pl.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlaylist(pl.id);
            setSelectedLongPressPlaylist(null);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleSaveRename = async () => {
    if (!renameTitle.trim() || !selectedLongPressPlaylist) return;
    try {
      await updatePlaylist({ id: selectedLongPressPlaylist.id, title: renameTitle.trim() });
      setRenameModalVisible(false);
      setSelectedLongPressPlaylist(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Lists</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate} hitSlop={12}>
          <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="playlist-play"
          title="No reading lists yet"
          description="Create curated lists of books to read next."
          actionLabel="Create a List"
          onAction={handleOpenCreate}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {playlists.map((pl) => {
            const coverUrls = pl.items
              ? (pl.items
                  .map((item) => (Array.isArray(item.book) ? item.book[0] : item.book)?.cover_url)
                  .filter(Boolean) as string[])
              : [];
            return (
              <TouchableOpacity
                key={pl.id}
                style={[styles.card, Shadows.card]}
                onPress={() => router.push(`/playlists/${pl.id}` as any)}
                onLongPress={() => setSelectedLongPressPlaylist(pl)}
                activeOpacity={0.85}
              >
                {coverUrls.length > 0 ? (
                  <PlaylistCoverCollage coverUrls={coverUrls} size={72} />
                ) : (
                  <View style={styles.collage}>
                    <MaterialIcons
                      name="auto-awesome-motion"
                      size={32}
                      color={colors.primary}
                      style={{ margin: 'auto' }}
                    />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.cardTitle}>{pl.title}</Text>
                  {pl.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {pl.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>{pl.is_public ? 'Public' : 'Private'}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.onSurfaceVariant}
                  style={{ opacity: 0.4 }}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Create Playlist Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalContent,
              { marginTop: insets.top + 40, marginBottom: insets.bottom + 20 },
            ]}
          >
            <Text style={styles.modalTitle}>New Reading List</Text>

            <TextInput
              style={styles.modalInput}
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              placeholder="List Name"
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
            />

            <Text style={styles.modalSubTitle}>Select books to add (optional):</Text>

            <FlatList
              data={library}
              keyExtractor={(item) => item.id}
              style={{ flex: 1, marginTop: Spacing.stackSm }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedBookIds.includes(item.book_id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.bookRow,
                      isSelected && { backgroundColor: `${colors.primary}11` },
                    ]}
                    onPress={() => toggleBookSelection(item.book_id)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item.cover_url ?? undefined }}
                      style={styles.bookCover}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>
                        {item.author}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={isSelected ? colors.primary : colors.outlineVariant}
                    />
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setCreateModalVisible(false)}
                disabled={isCreating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, isCreating && { opacity: 0.7 }]}
                onPress={handleSaveNewPlaylist}
                disabled={isCreating || !newPlaylistTitle.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalSaveText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Long Press Action Sheet */}
      <Modal
        visible={!!selectedLongPressPlaylist && !renameModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedLongPressPlaylist(null)}
          />
          {selectedLongPressPlaylist && (
            <View
              style={[
                styles.actionSheet,
                { paddingBottom: Math.max(insets.bottom, Spacing.stackLg) },
              ]}
            >
              <Text style={styles.sheetTitle}>{selectedLongPressPlaylist.title}</Text>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => {
                  setRenameTitle(selectedLongPressPlaylist.title);
                  setRenameModalVisible(true);
                }}
              >
                <MaterialIcons name="edit" size={24} color={colors.onSurface} />
                <Text style={styles.sheetActionText}>Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleMakePublicToggle(selectedLongPressPlaylist)}
              >
                <MaterialIcons
                  name={selectedLongPressPlaylist.is_public ? 'lock' : 'public'}
                  size={24}
                  color={colors.onSurface}
                />
                <Text style={styles.sheetActionText}>
                  {selectedLongPressPlaylist.is_public ? 'Make Private' : 'Make Public'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleDelete(selectedLongPressPlaylist)}
              >
                <MaterialIcons name="delete" size={24} color={colors.error} />
                <Text style={[styles.sheetActionText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.renameModalContent}>
            <Text style={styles.modalTitle}>Rename List</Text>
            <TextInput
              style={styles.modalInput}
              value={renameTitle}
              onChangeText={setRenameTitle}
              placeholder="List Name"
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveRename}
                disabled={!renameTitle.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
    headerTitle: { ...Typography.styles.titleSm, color: colors.onSurface },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: Spacing.containerPadding,
      paddingTop: Spacing.stackMd,
      gap: Spacing.stackSm,
    },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
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
      backgroundColor: colors.surfaceContainerHigh,
    },
    cardTitle: { ...Typography.styles.titleSm, fontSize: 15, color: colors.onSurface },
    cardDesc: {
      ...Typography.styles.bodyMd,
      fontSize: 13,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
    cardMeta: { ...Typography.styles.labelSm, color: colors.onSurfaceVariant, opacity: 0.6 },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      padding: Spacing.containerPadding,
    },
    modalTitle: {
      ...Typography.styles.headlineMd,
      color: colors.onSurface,
      marginBottom: Spacing.stackSm,
    },
    modalInput: {
      ...Typography.styles.bodyMd,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: Radius.md,
      padding: 16,
      color: colors.onSurface,
    },
    modalSubTitle: {
      ...Typography.styles.labelLg,
      color: colors.onSurfaceVariant,
      marginTop: Spacing.stackLg,
    },
    bookRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.stackSm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
      gap: Spacing.stackSm,
      borderRadius: Radius.md,
    },
    bookCover: {
      width: 40,
      height: 60,
      borderRadius: Radius.xs,
      backgroundColor: colors.surfaceContainer,
    },
    bookTitle: { ...Typography.styles.titleSm, color: colors.onSurface },
    bookAuthor: { ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, fontSize: 13 },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.stackSm,
      marginTop: Spacing.stackLg,
    },
    modalCancel: { paddingHorizontal: 20, paddingVertical: 12 },
    modalCancelText: { ...Typography.styles.labelLg, color: colors.onSurfaceVariant },
    modalSave: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: Radius.full,
      minWidth: 100,
      alignItems: 'center',
    },
    modalSaveText: { ...Typography.styles.labelLg, color: colors.onPrimary },

    // Sheet Styles
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    actionSheet: {
      backgroundColor: colors.surfaceContainer,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.containerPadding,
      gap: Spacing.stackSm,
    },
    sheetTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurfaceVariant,
      marginBottom: Spacing.stackSm,
    },
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.stackMd,
      gap: Spacing.base,
    },
    sheetActionText: { ...Typography.styles.labelLg, color: colors.onSurface },

    // Rename Modal
    renameModalContent: {
      backgroundColor: colors.surfaceContainerLowest,
      padding: Spacing.containerPadding,
      margin: Spacing.containerPadding,
      borderRadius: Radius.xl,
    },
  });
