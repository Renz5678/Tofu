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
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { EmptyState } from '@/components/EmptyState';
import { usePlaylists, useCreatePlaylist } from '@/hooks/usePlaylists';

export default function PlaylistsIndexScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: playlists = [] } = usePlaylists();
  const { mutateAsync: createPlaylist } = useCreatePlaylist();

  const handleCreate = async () => {
    try {
      const list = await createPlaylist('My Reading List');
      router.push(`/playlists/${list.id}`);
    } catch (e) {
      console.error('Failed to create playlist', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Lists</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreate} hitSlop={12}>
          <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="playlist-play"
          title="No reading lists yet"
          description="Create curated lists of books to read next."
          actionLabel="Create a List"
          onAction={handleCreate}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {playlists.map((pl) => (
            <TouchableOpacity
              key={pl.id}
              style={[styles.card, Shadows.card]}
              onPress={() => router.push(`/playlists/${pl.id}` as any)}
              activeOpacity={0.85}
            >
              {/* Cover collage fallback */}
              <View style={styles.collage}>
                <MaterialIcons name="auto-awesome-motion" size={32} color={colors.primary} style={{ margin: 'auto' }} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{pl.title}</Text>
                {pl.description && (
                  <Text style={styles.cardDesc} numberOfLines={2}>{pl.description}</Text>
                )}
                <Text style={styles.cardMeta}>
                  {pl.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
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
  collageCell: {
    width: '50%',
    height: '50%',
    overflow: 'hidden',
  },
  cardTitle: { ...Typography.styles.titleSm, fontSize: 15, color: colors.onSurface },
  cardDesc: { ...Typography.styles.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, opacity: 0.7 },
  cardMeta: { ...Typography.styles.labelSm, color: colors.onSurfaceVariant, opacity: 0.6 },
});
