/**
 * useReadingSessions — logs new sessions & fetches session history
 * Also handles streak + current_page update after session finish
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateSessionMetrics, calculateStreakUpdate } from '@/lib/metrics';

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
  const { data: { user } } = await supabase.auth.getUser();
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
    mutationFn: async (input: LogSessionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const metrics = calculateSessionMetrics(
        input.startTime,
        input.endTime,
        input.startPage,
        input.endPage,
        input.pausedSeconds ?? 0
      );

      // 1. Insert reading session
      const { data: sessionData, error: sessionError } = await supabase.from('reading_sessions').insert({
        user_id: user.id,
        user_book_id: input.userBookId,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        duration_seconds: metrics.duration_seconds,
        start_page: input.startPage,
        end_page: input.endPage,
        pages_per_hour: metrics.pages_per_hour,
        minutes_per_page: metrics.minutes_per_page,
        notes: input.notes ?? null,
      }).select('id').single();
      if (sessionError) throw sessionError;

      // 2. Update current_page on user_books
      const { error: bookError } = await supabase
        .from('user_books')
        .update({ current_page: input.endPage })
        .eq('id', input.userBookId);

      if (bookError) {
        // Rollback reading session
        await supabase.from('reading_sessions').delete().eq('id', sessionData.id);
        throw bookError;
      }

      // 3. Update streak
      const { data: streakRow, error: streakFetchError } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_read_date')
        .eq('user_id', user.id)
        .single();

      if (streakFetchError && streakFetchError.code !== 'PGRST116') {
        console.warn('Failed to fetch streak', streakFetchError);
      } else if (streakRow) {
        const updated = calculateStreakUpdate(
          streakRow.current_streak,
          streakRow.longest_streak,
          streakRow.last_read_date
        );
        const { error: streakUpdateError } = await supabase.from('streaks').update(updated).eq('user_id', user.id);
        if (streakUpdateError) {
          console.warn('Failed to update streak', streakUpdateError);
        }
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
