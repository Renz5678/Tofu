import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseBookRow } from './useLibrary';

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_style: string | null;
  is_public: boolean;
  created_at: string;
  items?: { book?: { cover_url?: string | null } }[];
}

export interface PlaylistItem {
  id: string;
  reading_list_id: string;
  book_id: string;
  position: number;
  added_at: string;
  book: DatabaseBookRow;
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('reading_lists')
        .select(`
          *,
          items:reading_list_items (
            position,
            book:books ( cover_url )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Playlist[];
    },
  });
}

export function usePlaylistItems(playlistId: string) {
  return useQuery({
    queryKey: ['playlistItems', playlistId],
    queryFn: async () => {
      if (!playlistId) return [];
      const { data, error } = await supabase
        .from('reading_list_items')
        .select(`
          *,
          book:books (*)
        `)
        .eq('reading_list_id', playlistId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as PlaylistItem[];
    },
    enabled: !!playlistId,
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('reading_lists')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      return data as Playlist;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  });
}

export function useAddPlaylistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, bookId }: { listId: string; bookId: string }) => {
      const { error } = await supabase
        .from('reading_list_items')
        .insert({ reading_list_id: listId, book_id: bookId });
      if (error) throw error;
    },
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: ['playlistItems', listId] }),
  });
}

export function useUpdatePlaylistPositions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, items }: { listId: string; items: { id: string; book_id: string; position: number }[] }) => {
      const { error } = await supabase.from('reading_list_items').upsert(
        items.map(item => ({
          id: item.id,
          reading_list_id: listId,
          book_id: item.book_id,
          position: item.position
        }))
      );
      if (error) throw error;
    },
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: ['playlistItems', listId] }),
  });
}
