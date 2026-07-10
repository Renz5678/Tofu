import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { usePublicProfile, useFollowCounts, useIsFollowing, useFollowUser, useUnfollowUser, usePublicFavorites } from '@/hooks/useSocial';
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

  const { mutate: follow, isPending: isFollowingPending } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowingPending } = useUnfollowUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
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
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{counts?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{counts?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
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
          <Text style={styles.sectionTitle}>Top 5 Books</Text>
          {favorites && favorites.length > 0 ? (
            <View style={styles.favoritesGrid}>
              {favorites.map((fav) => (
                <TouchableOpacity 
                  key={fav.id} 
                  style={styles.favoriteCard}
                  onPress={() => router.push(`/book/${fav.book_id}` as any)}
                >
                  <Image source={{ uri: fav.book.cover_url ?? undefined }} style={styles.favoriteCover} />
                  <Text style={styles.favoriteRank}>#{fav.rank}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No favorites picked yet.</Text>
          )}
        </View>

      </ScrollView>
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
    ...Typography.styles.titleMd,
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
    ...Typography.styles.titleMd,
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
    ...Typography.styles.labelMd,
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
  },
  favoriteCard: {
    width: 64,
    gap: 4,
  },
  favoriteCover: {
    width: 64,
    height: 96,
    borderRadius: Radius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  favoriteRank: {
    ...Typography.styles.labelSm,
    color: colors.primary,
    textAlign: 'center',
  },
});
