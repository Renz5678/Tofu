import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, ReviewComment, BookStats, CommunityReview, TimelineItem, FeedItem } from './useSocialTypes';
import { BookItem } from '@/lib/openLibrary';
// FOLLOWERS / FOLLOWING
// -----------------------------------------------------

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followingId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: followingId,
      });
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: followingId,
        actor_id: user.id,
        type: 'follow',
      });
    },
    onSuccess: (_, followingId) => {
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['isFollowing', followingId] });
      qc.invalidateQueries({ queryKey: ['followCounts', followingId] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followingId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);
      if (error) throw error;
    },
    onSuccess: (_, followingId) => {
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['isFollowing', followingId] });
      qc.invalidateQueries({ queryKey: ['followCounts', followingId] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!userId,
  });
}

export function useFollowCounts(userId: string) {
  return useQuery({
    queryKey: ['followCounts', userId],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);
      return {
        followers: followers.count || 0,
        following: following.count || 0,
      };
    },
    enabled: !!userId,
  });
}

export function useFollowersList(userId: string) {
  return useQuery({
    queryKey: ['followersList', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followers')
        .select(
          `
          follower_id,
          profiles!followers_follower_id_fkey (*)
        `,
        )
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((d: any) => d.profiles as Profile);
    },
    enabled: !!userId,
  });
}

export function useFollowingList(userId: string) {
  return useQuery({
    queryKey: ['followingList', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followers')
        .select(
          `
          following_id,
          profiles!followers_following_id_fkey (*)
        `,
        )
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((d: any) => d.profiles as Profile);
    },
    enabled: !!userId,
  });
}

// -----------------------------------------------------
// PUBLIC PROFILE
// -----------------------------------------------------

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function usePublicFavorites(userId: string) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_books')
        .select(
          `
          *,
          book:books (*),
          favorite_book_likes (user_id)
        `,
        )
        .eq('user_id', userId)
        .order('rank', { ascending: true });

      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      return data.map((fav: any) => ({
        ...fav,
        likes_count: fav.favorite_book_likes?.length ?? 0,
        is_liked_by_me: user
          ? fav.favorite_book_likes?.some((l: any) => l.user_id === user.id)
          : false,
      }));
    },
    enabled: !!userId,
  });
}

export function usePublicPlaylists(userId: string) {
  return useQuery({
    queryKey: ['publicPlaylists', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_lists')
        .select(
          `
          *,
          items:reading_list_items (
            position,
            book:books ( cover_url )
          ),
          reading_list_likes (user_id)
        `,
        )
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      return data.map((pl: any) => ({
        ...pl,
        likes_count: pl.reading_list_likes?.length ?? 0,
        is_liked_by_me: user
          ? pl.reading_list_likes?.some((l: any) => l.user_id === user.id)
          : false,
      }));
    },
    enabled: !!userId,
  });
}

// -----------------------------------------------------