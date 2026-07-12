/**
 * Zustand store — active reading session state
 * Persisted to AsyncStorage so the timer survives app relaunches.
 *
 * Write-safety: All AsyncStorage writes are serialised through a single
 * promise chain (writeChain) so rapid pause/resume events cannot interleave
 * and produce stale data on disk. The in-memory Zustand state is updated
 * synchronously (instant UI), while the disk write is queued behind the chain.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_STORAGE_KEY = '@tofu/active_session';

export interface ActiveSession {
  userBookId: string;
  bookTitle?: string;
  startPage: number;
  startTime: string; // ISO string
  pausedAt?: string; // ISO string — set when paused
  totalPausedSeconds: number;
}

interface SessionState {
  activeSession: ActiveSession | null;
  isLoading: boolean;
  // Actions
  startSession: (session: ActiveSession) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

/** Serialise all disk writes so rapid pause/resume can't race each other. */
let writeChain: Promise<void> = Promise.resolve();
function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  writeChain = writeChain.then(fn).catch(() => {
    // Individual write failure should not break the chain for future writes.
  });
  return writeChain;
}

function persist(session: ActiveSession | null): Promise<void> {
  return enqueueWrite(() =>
    session
      ? AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      : AsyncStorage.removeItem(SESSION_STORAGE_KEY)
  );
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isLoading: false,

  startSession: async (session) => {
    set({ activeSession: session }); // instant UI update
    await persist(session);
  },

  pauseSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    const updated: ActiveSession = { ...activeSession, pausedAt: new Date().toISOString() };
    set({ activeSession: updated }); // instant UI update
    await persist(updated);
  },

  resumeSession: async () => {
    const { activeSession } = get();
    if (!activeSession?.pausedAt) return;
    const pausedSeconds = Math.floor(
      (Date.now() - new Date(activeSession.pausedAt).getTime()) / 1000
    );
    const updated: ActiveSession = {
      ...activeSession,
      pausedAt: undefined,
      totalPausedSeconds: (activeSession.totalPausedSeconds ?? 0) + pausedSeconds,
    };
    set({ activeSession: updated }); // instant UI update
    await persist(updated);
  },

  clearSession: async () => {
    set({ activeSession: null }); // instant UI update
    await persist(null);
  },

  hydrateFromStorage: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) set({ activeSession: JSON.parse(raw) });
    } catch {
      // Corrupted data — clear it silently
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      set({ isLoading: false });
    }
  },
}));

