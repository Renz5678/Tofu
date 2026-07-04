/**
 * Tests for lib/metrics.ts — pure calculation functions, zero dependencies
 */
import {
  calculateSessionMetrics,
  calculateStreakUpdate,
  formatDuration,
  formatMinutes,
  readingProgress,
} from '@/lib/metrics';

// ─────────────────────────────────────────────
// calculateSessionMetrics
// ─────────────────────────────────────────────
describe('calculateSessionMetrics', () => {
  const startTime = new Date('2024-01-01T10:00:00Z');
  const endTime   = new Date('2024-01-01T10:30:00Z'); // 1800s = 30 min

  it('calculates duration correctly', () => {
    const result = calculateSessionMetrics(startTime, endTime, 0, 30);
    expect(result.duration_seconds).toBe(1800);
  });

  it('subtracts pausedSeconds from duration', () => {
    const result = calculateSessionMetrics(startTime, endTime, 0, 30, 300); // 5 min pause
    expect(result.duration_seconds).toBe(1500);
  });

  it('calculates pages_read correctly', () => {
    const result = calculateSessionMetrics(startTime, endTime, 100, 130);
    expect(result.pages_read).toBe(30);
  });

  it('calculates pages_per_hour correctly', () => {
    // 30 pages in 30 min = 60 pages/hr
    const result = calculateSessionMetrics(startTime, endTime, 100, 130);
    expect(Math.round(result.pages_per_hour)).toBe(60);
  });

  it('calculates minutes_per_page correctly', () => {
    // 30 min / 30 pages = 1 min/page
    const result = calculateSessionMetrics(startTime, endTime, 100, 130);
    expect(result.minutes_per_page).toBe(1);
  });

  it('returns 0 for pages_per_hour when no pages read', () => {
    const result = calculateSessionMetrics(startTime, endTime, 100, 100);
    expect(result.pages_per_hour).toBe(0);
    expect(result.minutes_per_page).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calculateStreakUpdate
// ─────────────────────────────────────────────
describe('calculateStreakUpdate', () => {
  // Freeze "today" to a known value
  const realDate = Date;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not change streak when already read today', () => {
    const result = calculateStreakUpdate(5, 10, '2024-06-15');
    expect(result.current_streak).toBe(5);
    expect(result.longest_streak).toBe(10);
  });

  it('increments streak when last read was yesterday', () => {
    const result = calculateStreakUpdate(5, 10, '2024-06-14');
    expect(result.current_streak).toBe(6);
    expect(result.longest_streak).toBe(10);
  });

  it('updates longest streak when current exceeds it', () => {
    const result = calculateStreakUpdate(10, 10, '2024-06-14');
    expect(result.current_streak).toBe(11);
    expect(result.longest_streak).toBe(11);
  });

  it('resets to 1 when streak is broken', () => {
    const result = calculateStreakUpdate(5, 10, '2024-06-01'); // far in the past
    expect(result.current_streak).toBe(1);
    expect(result.longest_streak).toBe(10); // longest remains
  });

  it('handles null last_read_date (first ever session)', () => {
    const result = calculateStreakUpdate(0, 0, null);
    expect(result.current_streak).toBe(1);
    expect(result.last_read_date).toBe('2024-06-15');
  });
});

// ─────────────────────────────────────────────
// formatDuration
// ─────────────────────────────────────────────
describe('formatDuration', () => {
  it('formats seconds under 1 hour as MM:SS', () => {
    expect(formatDuration(90)).toBe('01:30');
  });

  it('formats exactly 1 hour as HH:MM:SS', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
  });

  it('formats zero as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats mixed hours, minutes, seconds', () => {
    expect(formatDuration(3723)).toBe('01:02:03');
  });
});

// ─────────────────────────────────────────────
// formatMinutes
// ─────────────────────────────────────────────
describe('formatMinutes', () => {
  it('formats minutes under 1 hour as Xm', () => {
    expect(formatMinutes(45)).toBe('45m');
  });

  it('formats exactly 1 hour as 1h', () => {
    expect(formatMinutes(60)).toBe('1h');
  });

  it('formats hours and leftover minutes', () => {
    expect(formatMinutes(90)).toBe('1h 30m');
  });

  it('formats 0 minutes', () => {
    expect(formatMinutes(0)).toBe('0m');
  });
});

// ─────────────────────────────────────────────
// readingProgress
// ─────────────────────────────────────────────
describe('readingProgress', () => {
  it('returns correct fraction', () => {
    expect(readingProgress(100, 400)).toBe(0.25);
  });

  it('clamps to 1 when current > total', () => {
    expect(readingProgress(500, 400)).toBe(1);
  });

  it('clamps to 0 when current is 0', () => {
    expect(readingProgress(0, 400)).toBe(0);
  });

  it('returns 0 when totalPages is 0 (avoids divide-by-zero)', () => {
    expect(readingProgress(100, 0)).toBe(0);
  });
});
