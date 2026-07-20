import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseBookRow } from './useLibrary';
import { BookItem } from '@/lib/openLibrary';

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
  books: any;
}

export type FeedItemType = 'review' | 'session';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  created_at: string;
  profiles: Profile;
  books: any;
  // review
  rating?: number | null;
  content?: string | null;
  contains_spoilers?: boolean;
  likes_count?: number;
  is_liked_by_me?: boolean;
  // session
  duration_seconds?: number;
  start_page?: number;
  end_page?: number;
  pages_read?: number;
}

// -----------------------------------------------------