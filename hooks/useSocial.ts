import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseBookRow } from './useLibrary';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export interface BookStats {
  book_id: string;
  average_rating: number | null;
  ratings_count: number;
  reviews_count: number;
}

export interface CommunityReview {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  review: string | null;
  status: string;
  added_at: string;
  finished_at: string | null;
  profiles: Profile;
}

export interface TimelineItem {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  review: string | null;
  status: string;
  added_at: string;
  finished_at: string | null;
  profiles: Profile;
  books: DatabaseBookRow;
}

// -----------------------------------------------------
// FOLLOWERS / FOLLOWING
// -----------------------------------------------------

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: followingId,
      });
      if (error) throw error;
    },
    onSuccess: (_, followingId) => {
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['isFollowing', followingId] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
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
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);
      return {
        followers: followers.count || 0,
        following: following.count || 0
      };
    },
    enabled: !!userId,
  });
}

// -----------------------------------------------------
// TIMELINE / FEED
// -----------------------------------------------------

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: async (): Promise<TimelineItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Get people I follow
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      if (followingIds.length === 0) return [];

      // 2. Fetch recent user_books activity from these users
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          profiles:user_id (*),
          books:book_id (*)
        `)
        .in('user_id', followingIds)
        .order('added_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TimelineItem[];
    },
  });
}

// -----------------------------------------------------
// PUBLIC PROFILE
// -----------------------------------------------------

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
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
        .select(`
          *,
          book:books (*)
        `)
        .eq('user_id', userId)
        .order('rank', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// -----------------------------------------------------
// COMMUNITY REVIEWS & STATS
// -----------------------------------------------------

export function useBookStats(bookId: string) {
  return useQuery({
    queryKey: ['bookStats', bookId],
    queryFn: async (): Promise<BookStats | null> => {
      const { data, error } = await supabase
        .from('book_stats')
        .select('*')
        .eq('book_id', bookId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BookStats;
    },
    enabled: !!bookId,
  });
}

export function useBookReviews(bookId: string) {
  return useQuery({
    queryKey: ['bookReviews', bookId],
    queryFn: async (): Promise<CommunityReview[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('book_id', bookId)
        .not('review', 'is', null)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as CommunityReview[];
    },
    enabled: !!bookId,
  });
}

export function useReviewComments(reviewId: string) {
  return useQuery({
    queryKey: ['reviewComments', reviewId],
    queryFn: async (): Promise<ReviewComment[]> => {
      const { data, error } = await supabase
        .from('review_comments')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ReviewComment[];
    },
    enabled: !!reviewId,
  });
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async (): Promise<CommunityReview | null> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('id', reviewId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CommunityReview;
    },
    enabled: !!reviewId,
  });
}

export function useAddReviewComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('review_comments').insert({
        review_id: reviewId,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: (_, { reviewId }) => {
      qc.invalidateQueries({ queryKey: ['reviewComments', reviewId] });
    },
  });
}
