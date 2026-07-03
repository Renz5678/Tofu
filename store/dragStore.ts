/**
 * Zustand store — drag-and-drop in-flight state for tier lists & playlists
 * Updated optimistically on drop, batch-written to Supabase
 */
import { create } from 'zustand';

interface DragState {
  isDragging: boolean;
  dragItemId: string | null;
  pendingUpdates: Record<string, { tier?: string; position?: number }>;
  // Actions
  beginDrag: (itemId: string) => void;
  endDrag: () => void;
  stageTierUpdate: (itemId: string, tier: string, position: number) => void;
  stagePositionUpdate: (itemId: string, position: number) => void;
  clearPending: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  isDragging: false,
  dragItemId: null,
  pendingUpdates: {},

  beginDrag: (itemId) => set({ isDragging: true, dragItemId: itemId }),

  endDrag: () => set({ isDragging: false, dragItemId: null }),

  stageTierUpdate: (itemId, tier, position) =>
    set((state) => ({
      pendingUpdates: {
        ...state.pendingUpdates,
        [itemId]: { ...state.pendingUpdates[itemId], tier, position },
      },
    })),

  stagePositionUpdate: (itemId, position) =>
    set((state) => ({
      pendingUpdates: {
        ...state.pendingUpdates,
        [itemId]: { ...state.pendingUpdates[itemId], position },
      },
    })),

  clearPending: () => set({ pendingUpdates: {} }),
}));
