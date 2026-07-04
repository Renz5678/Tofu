/**
 * Tests for store/sessionStore.ts — Zustand active session store
 * Mocks AsyncStorage to keep tests synchronous and isolated
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/store/sessionStore';
import type { ActiveSession } from '@/store/sessionStore';

// ─────────────────────────────────────────────
// Mock AsyncStorage
// ─────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockGetItem    = AsyncStorage.getItem    as jest.Mock;
const mockSetItem    = AsyncStorage.setItem    as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

// Reset store state between tests by rebuilding via actions
beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
  mockRemoveItem.mockReset();
  // Clear the store state back to defaults
  useSessionStore.setState({ activeSession: null, isLoading: false });
});

const MOCK_SESSION: ActiveSession = {
  userBookId: 'book-uuid-1',
  startPage: 100,
  startTime: '2024-06-15T10:00:00Z',
  totalPausedSeconds: 0,
};

describe('sessionStore — startSession', () => {
  it('sets activeSession in store and persists to AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await useSessionStore.getState().startSession(MOCK_SESSION);

    expect(useSessionStore.getState().activeSession).toEqual(MOCK_SESSION);
    expect(mockSetItem).toHaveBeenCalledWith(
      '@tofu/active_session',
      JSON.stringify(MOCK_SESSION)
    );
  });
});

describe('sessionStore — pauseSession', () => {
  it('does nothing when no active session', async () => {
    await useSessionStore.getState().pauseSession();
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('sets pausedAt on the active session', async () => {
    useSessionStore.setState({ activeSession: MOCK_SESSION });
    mockSetItem.mockResolvedValueOnce(undefined);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T10:15:00Z'));

    await useSessionStore.getState().pauseSession();

    const session = useSessionStore.getState().activeSession;
    expect(session?.pausedAt).toBe('2024-06-15T10:15:00.000Z');
    jest.useRealTimers();
  });
});

describe('sessionStore — resumeSession', () => {
  it('accumulates paused time and clears pausedAt', async () => {
    useSessionStore.setState({
      activeSession: {
        ...MOCK_SESSION,
        pausedAt: '2024-06-15T10:15:00Z',
        totalPausedSeconds: 0,
      },
    });
    mockSetItem.mockResolvedValueOnce(undefined);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T10:20:00Z')); // 5 min later

    await useSessionStore.getState().resumeSession();

    const session = useSessionStore.getState().activeSession!;
    expect(session.pausedAt).toBeUndefined();
    expect(session.totalPausedSeconds).toBe(300); // 5 min = 300s
    jest.useRealTimers();
  });
});

describe('sessionStore — clearSession', () => {
  it('nulls activeSession and removes from AsyncStorage', async () => {
    useSessionStore.setState({ activeSession: MOCK_SESSION });
    mockRemoveItem.mockResolvedValueOnce(undefined);

    await useSessionStore.getState().clearSession();

    expect(useSessionStore.getState().activeSession).toBeNull();
    expect(mockRemoveItem).toHaveBeenCalledWith('@tofu/active_session');
  });
});

describe('sessionStore — hydrateFromStorage', () => {
  it('restores session from AsyncStorage on app launch', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify(MOCK_SESSION));

    await useSessionStore.getState().hydrateFromStorage();

    expect(useSessionStore.getState().activeSession).toEqual(MOCK_SESSION);
    expect(useSessionStore.getState().isLoading).toBe(false);
  });

  it('returns null session when storage is empty', async () => {
    mockGetItem.mockResolvedValueOnce(null);

    await useSessionStore.getState().hydrateFromStorage();

    expect(useSessionStore.getState().activeSession).toBeNull();
  });

  it('clears corrupted JSON gracefully', async () => {
    mockGetItem.mockResolvedValueOnce('not-valid-json{{{{');
    mockRemoveItem.mockResolvedValueOnce(undefined);

    await useSessionStore.getState().hydrateFromStorage();

    expect(useSessionStore.getState().activeSession).toBeNull();
    expect(mockRemoveItem).toHaveBeenCalled();
  });
});
