import { ActiveSession } from '@/store/sessionStore';

/**
 * Calculates the elapsed time in seconds for a given reading session.
 */
export function calculateElapsedSeconds(session: ActiveSession | null): number {
  if (!session) return 0;
  
  const end = session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
  const start = new Date(session.startTime).getTime();
  
  const elapsed = Math.floor((end - start) / 1000) - (session.totalPausedSeconds || 0);
  return Math.max(0, elapsed);
}

/**
 * Formats a duration in seconds to HH:MM:SS or MM:SS format.
 */
export function formatSessionTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h === '00' ? '' : h + ':'}${m}:${s}`;
}
