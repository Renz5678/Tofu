import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, ReviewComment, BookStats, CommunityReview, TimelineItem, FeedItem } from './useSocialTypes';
import { BookItem } from '@/lib/openLibrary';
// TIMELINE / FEED
// -----------------------------------------------------

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: async (): Promise<TimelineItem[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Get people I follow
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map((f) => f.following_id) || [];
      if (followingIds.length === 0) return [];

      // 2. Fetch recent reviews from people I follow
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          *,
          profiles:user_id (*),
          books:book_id (*)
        `,
        )
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as TimelineItem[];
    },
  });
}

// -----------------------------------------------------