/**
 * Zustand store — active reading session state
 * Persisted to AsyncStorage so timer survives app relaunches
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_STORAGE_KEY = '@tofu/active_session';

export interface ActiveSession {
  userBookId: string;
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

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isLoading: false,

  startSession: async (session) => {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    set({ activeSession: session });
  },

  pauseSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    const updated = { ...activeSession, pausedAt: new Date().toISOString() };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    set({ activeSession: updated });
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
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    set({ activeSession: updated });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    set({ activeSession: null });
  },

  hydrateFromStorage: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) set({ activeSession: JSON.parse(raw) });
    } catch {
      // Corrupted data — clear it
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      set({ isLoading: false });
    }
  },
}));
