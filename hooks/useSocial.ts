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
  likes_count: number;
}

/** A review row from the dedicated reviews table */
export interface CommunityReview {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  liked: boolean;
  content: string | null;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  profiles: Profile;
  /** Number of review_likes rows for this review */
  likes_count: number;
  /** Whether the current user has liked this review (populated client-side) */
  is_liked_by_me?: boolean;
}

export interface TimelineItem {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  liked: boolean;
  content: string | null;
  contains_spoilers: boolean;
  created_at: string;
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

      // 2. Fetch recent reviews from people I follow
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (*),
          books:book_id (*)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as TimelineItem[];
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

export function useBulkBookStats(bookIds: string[]) {
  return useQuery({
    queryKey: ['bulkBookStats', bookIds],
    queryFn: async (): Promise<Record<string, BookStats>> => {
      const { data, error } = await supabase
        .from('book_stats')
        .select('*')
        .in('book_id', bookIds);

      if (error) throw error;
      
      const statsMap: Record<string, BookStats> = {};
      if (data) {
        data.forEach(stat => {
          statsMap[stat.book_id] = stat as BookStats;
        });
      }
      return statsMap;
    },
    enabled: bookIds.length > 0,
  });
}

export function useBookReviews(bookId: string) {
  return useQuery({
    queryKey: ['bookReviews', bookId],
    queryFn: async (): Promise<CommunityReview[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch reviews with profile and like count
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (*),
          review_likes (id, user_id)
        `)
        .eq('book_id', bookId)
        .not('content', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        likes_count: row.review_likes?.length ?? 0,
        is_liked_by_me: user ? row.review_likes?.some((l: any) => l.user_id === user.id) : false,
        review_likes: undefined, // strip raw join data
      })) as CommunityReview[];
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
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (*),
          review_likes (id, user_id)
        `)
        .eq('id', reviewId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        ...data,
        likes_count: data.review_likes?.length ?? 0,
        is_liked_by_me: user ? data.review_likes?.some((l: any) => l.user_id === user.id) : false,
        review_likes: undefined,
      } as CommunityReview;
    },
    enabled: !!reviewId,
  });
}

/** Fetch the current user's own review for a specific book */
export function useMyReview(bookId: string) {
  return useQuery({
    queryKey: ['myReview', bookId],
    queryFn: async (): Promise<CommunityReview | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CommunityReview | null;
    },
    enabled: !!bookId,
  });
}

export interface UpsertReviewInput {
  bookId: string;
  rating?: number | null;
  liked?: boolean;
  content?: string | null;
  contains_spoilers?: boolean;
}

/** Create or update the current user's review for a book */
export function useUpsertReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertReviewInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('reviews').upsert(
        {
          user_id: user.id,
          book_id: input.bookId,
          rating: input.rating ?? null,
          liked: input.liked ?? false,
          content: input.content ?? null,
          contains_spoilers: input.contains_spoilers ?? false,
        },
        { onConflict: 'user_id,book_id' }
      );
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['myReview', variables.bookId] });
      qc.invalidateQueries({ queryKey: ['bookReviews', variables.bookId] });
      qc.invalidateQueries({ queryKey: ['bookStats', variables.bookId] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

/** Toggle a like on a community review */
export function useToggleReviewLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, isLiked, bookId }: { reviewId: string; isLiked: boolean; bookId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        // Already liked — remove the like
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Not yet liked — add the like
        const { error } = await supabase
          .from('review_likes')
          .insert({ review_id: reviewId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['bookReviews', variables.bookId] });
      qc.invalidateQueries({ queryKey: ['review', variables.reviewId] });
    },
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
