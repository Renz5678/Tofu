/**
 * Reading metrics calculations — pure functions, unit-testable
 * Per spec: computed client-side at session-finish, written directly to DB row
 */
import { differenceInSeconds } from 'date-fns';

export interface SessionMetrics {
  duration_seconds: number;
  pages_read: number;
  pages_per_hour: number;
  minutes_per_page: number;
}

export function calculateSessionMetrics(
  startTime: Date,
  endTime: Date,
  startPage: number,
  endPage: number,
  pausedSeconds = 0
): SessionMetrics {
  const duration_seconds = differenceInSeconds(endTime, startTime) - pausedSeconds;
  const pages_read = endPage - startPage;
  const pages_per_hour = pages_read > 0 && duration_seconds > 0
    ? pages_read / (duration_seconds / 3600)
    : 0;
  const minutes_per_page = pages_read > 0 && duration_seconds > 0
    ? (duration_seconds / 60) / pages_read
    : 0;

  return { duration_seconds, pages_read, pages_per_hour, minutes_per_page };
}

export interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  last_read_date: string; // ISO date YYYY-MM-DD
}

export function calculateStreakUpdate(
  current_streak: number,
  longest_streak: number,
  last_read_date: string | null
): StreakUpdate {
  const today = new Date().toISOString().split('T')[0];

  if (last_read_date === today) {
    // Already logged today — no change
    return { current_streak, longest_streak, last_read_date: today };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const new_streak = last_read_date === yesterday ? current_streak + 1 : 1;
  const new_longest = Math.max(longest_streak, new_streak);

  return {
    current_streak: new_streak,
    longest_streak: new_longest,
    last_read_date: today,
  };
}

/** Format seconds as "HH:MM:SS" or "MM:SS" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Format minutes to "Xh Ym" or "Xm" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

/** Book reading progress 0–1 */
export function readingProgress(currentPage: number, totalPages: number): number {
  if (!totalPages || totalPages === 0) return 0;
  return Math.min(1, Math.max(0, currentPage / totalPages));
}
