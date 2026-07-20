import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import {
  usePublicProfile,
  useFollowCounts,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  usePublicFavorites,
  usePublicPlaylists,
} from '@/hooks/useSocial';
import { useToggleFavoriteLike } from '@/hooks/useFavorites';
import { useTogglePlaylistLike } from '@/hooks/usePlaylists';
import { PlaylistCoverCollage } from '@/components/PlaylistCoverCollage';
import { supabase } from '@/lib/supabase';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const { data: profile, isLoading } = usePublicProfile(id);
  const { data: counts } = useFollowCounts(id);
  const { data: isFollowing } = useIsFollowing(id);
  const { data: favorites } = usePublicFavorites(id);
  const { data: playlists } = usePublicPlaylists(id);

  const { mutate: follow, isPending: isFollowingPending } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowingPending } = useUnfollowUser();

  const { mutate: toggleFavLike } = useToggleFavoriteLike();
  const { mutate: togglePlaylistLike } = useTogglePlaylistLike();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.onSurface }}>User not found.</Text>
      </View>
    );
  }

  const isSelf = currentUserId === id;

  const handleToggleFollow = () => {
    if (isFollowing) {
      unfollow(id);
    } else {
      follow(id);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{profile.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.displayName}>{profile.display_name || profile.username}</Text>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push(`/profile/${id}/followers` as any)}
            >
              <Text style={styles.statNumber}>{counts?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push(`/profile/${id}/following` as any)}
            >
              <Text style={styles.statNumber}>{counts?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {!isSelf && currentUserId && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleToggleFollow}
              disabled={isFollowingPending || isUnfollowingPending}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Books</Text>
          {favorites && favorites.length > 0 ? (
            <View style={styles.favoritesGrid}>
              {favorites.map((fav) => (
                <TouchableOpacity
                  key={fav.id}
                  style={styles.favoriteCard}
                  onPress={() => router.push(`/book/${fav.book_id}` as any)}
                >
                  <Image
                    source={{ uri: fav.book.cover_url ?? undefined }}
                    style={styles.favoriteCover}
                  />
                  <Text style={styles.favoriteRank}>#{fav.rank}</Text>

                  <TouchableOpacity
                    style={styles.likeBadge}
                    onPress={() =>
                      toggleFavLike({
                        favoriteBookId: fav.id,
                        isLiked: fav.is_liked_by_me,
                        ownerId: id,
                      })
                    }
                    hitSlop={8}
                  >
                    <MaterialIcons
                      name={fav.is_liked_by_me ? 'favorite' : 'favorite-border'}
                      size={12}
                      color={fav.is_liked_by_me ? colors.error : colors.onSurface}
                    />
                    <Text style={[styles.likeText, fav.is_liked_by_me && { color: colors.error }]}>
                      {fav.likes_count || 0}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No favorites picked yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Lists</Text>
          {playlists && playlists.length > 0 ? (
            <View style={styles.playlistsCol}>
              {playlists.map((pl) => {
                const coverUrls = pl.items
                  ? (pl.items
                      .map(
                        (item: any) =>
                          (Array.isArray(item.book) ? item.book[0] : item.book)?.cover_url,
                      )
                      .filter(Boolean) as string[])
                  : [];

                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={[styles.playlistCard, Shadows.card]}
                    onPress={() => router.push(`/playlists/${pl.id}` as any)}
                    activeOpacity={0.85}
                  >
                    {coverUrls.length > 0 ? (
                      <PlaylistCoverCollage coverUrls={coverUrls} size={64} />
                    ) : (
                      <View style={styles.collage}>
                        <MaterialIcons
                          name="auto-awesome-motion"
                          size={28}
                          color={colors.primary}
                          style={{ margin: 'auto' }}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.playlistTitle}>{pl.title}</Text>
                      {pl.description && (
                        <Text style={styles.playlistDesc} numberOfLines={2}>
                          {pl.description}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.playlistLikeBtn}
                      onPress={() =>
                        togglePlaylistLike({
                          listId: pl.id,
                          isLiked: pl.is_liked_by_me,
                          ownerId: id,
                        })
                      }
                      hitSlop={12}
                    >
                      <MaterialIcons
                        name={pl.is_liked_by_me ? 'favorite' : 'favorite-border'}
                        size={18}
                        color={pl.is_liked_by_me ? colors.error : colors.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.playlistLikeText,
                          pl.is_liked_by_me && { color: colors.error },
                        ]}
                      >
                        {pl.likes_count || 0}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No public reading lists.</Text>
          )}
        </View>
      </ScrollView>
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
    },
    scroll: {
      paddingBottom: Spacing.stackLg * 2,
    },
    profileHeader: {
      alignItems: 'center',
      padding: Spacing.stackLg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      marginBottom: Spacing.stackSm,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      ...Typography.styles.displayLgMobile,
      color: colors.onPrimaryContainer,
    },
    displayName: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.stackLg,
      marginTop: Spacing.stackMd,
    },
    statBox: {
      alignItems: 'center',
    },
    statNumber: {
      ...Typography.styles.titleSm,
      color: colors.primary,
    },
    statLabel: {
      ...Typography.styles.labelSm,
      color: colors.onSurfaceVariant,
    },
    followButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 10,
      borderRadius: Radius.full,
      marginTop: Spacing.stackLg,
    },
    followButtonText: {
      ...Typography.styles.labelLg,
      color: colors.onPrimary,
    },
    followingButton: {
      backgroundColor: colors.surfaceContainerHighest,
    },
    followingButtonText: {
      color: colors.onSurface,
    },
    section: {
      padding: Spacing.containerPadding,
      gap: Spacing.stackSm,
    },
    sectionTitle: {
      ...Typography.styles.titleSm,
      color: colors.onSurface,
    },
    emptyText: {
      ...Typography.styles.bodyMd,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    favoritesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.stackSm,
      justifyContent: 'center',
    },
    favoriteCard: {
      width: 80,
      gap: 4,
      marginBottom: 16,
    },
    favoriteCover: {
      width: 80,
      height: 120,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceVariant,
    },
    favoriteRank: {
      ...Typography.styles.labelSm,
      color: colors.primary,
      textAlign: 'center',
    },
    likeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.surfaceContainerHighest,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.full,
      marginTop: 2,
    },
    likeText: {
      ...Typography.styles.labelSm,
      fontSize: 10,
      color: colors.onSurface,
    },
    playlistsCol: {
      gap: Spacing.stackSm,
    },
    playlistCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.stackSm,
      gap: Spacing.stackSm,
    },
    collage: {
      width: 64,
      height: 64,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceContainerHigh,
    },
    playlistTitle: { ...Typography.styles.titleSm, fontSize: 14, color: colors.onSurface },
    playlistDesc: {
      ...Typography.styles.bodyMd,
      fontSize: 12,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
    playlistLikeBtn: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
    },
    playlistLikeText: {
      ...Typography.styles.labelSm,
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
  });
