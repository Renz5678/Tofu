/**
 * useReadingSessions — logs new sessions & fetches session history
 * Session logging uses an atomic Postgres RPC so the insert, page update,
 * and streak update all commit or roll back together.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateSessionMetrics } from '@/lib/metrics';

export interface ReadingSession {
  id: string;
  user_book_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  start_page: number;
  end_page: number;
  pages_read: number;
  pages_per_hour: number | null;
  minutes_per_page: number | null;
  notes: string | null;
  created_at: string;
}

export interface LogSessionInput {
  userBookId: string;
  startTime: Date;
  endTime: Date;
  startPage: number;
  endPage: number;
  pausedSeconds?: number;
  notes?: string;
}

async function fetchSessions(userBookId?: string): Promise<ReadingSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (userBookId) query = query.eq('user_book_id', userBookId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function useReadingSessions(userBookId?: string) {
  return useQuery({
    queryKey: ['sessions', userBookId ?? 'all'],
    queryFn: () => fetchSessions(userBookId),
    staleTime: 1000 * 60 * 1,
  });
}

export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    // Optimistically invalidate before the round-trip completes so the
    // library and dashboard feel instant even on a slow connection.
    onMutate: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['library'] });
    },

    mutationFn: async (input: LogSessionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const metrics = calculateSessionMetrics(
        input.startTime,
        input.endTime,
        input.startPage,
        input.endPage,
        input.pausedSeconds ?? 0,
      );

      // Single atomic RPC — inserts the session, updates current_page, and
      // recalculates the streak inside one Postgres transaction.
      const { error } = await supabase.rpc('log_reading_session', {
        p_user_id: user.id,
        p_user_book_id: input.userBookId,
        p_start_time: input.startTime.toISOString(),
        p_end_time: input.endTime.toISOString(),
        p_duration_seconds: metrics.duration_seconds,
        p_start_page: input.startPage,
        p_end_page: input.endPage,
        p_pages_per_hour: metrics.pages_per_hour,
        p_minutes_per_page: metrics.minutes_per_page,
        p_notes: input.notes ?? null,
      });

      if (error) throw error;
    },

    onSuccess: () => {
      // Confirm invalidation after the server confirms the write.
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },

    onError: () => {
      // Revert optimistic invalidation — refetch to restore correct state.
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
