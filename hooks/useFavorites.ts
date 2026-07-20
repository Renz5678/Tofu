import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseBookRow } from './useLibrary';

export interface FavoriteBook {
  id: string;
  user_id: string;
  book_id: string;
  rank: number;
  created_at: string;
  book: DatabaseBookRow;
}

async function fetchFavorites(): Promise<FavoriteBook[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorite_books')
    .select(
      `
      *,
      book:books (*)
    `,
    )
    .eq('user_id', user.id)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as FavoriteBook[];
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });
}

export function useSetFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ book_id, rank }: { book_id: string; rank: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if rank already exists
      const { data: existing } = await supabase
        .from('favorite_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('rank', rank)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('favorite_books')
          .update({ book_id })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_books')
          .insert({ user_id: user.id, book_id, rank });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('favorite_books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { data: favorites } = useFavorites();

  return useMutation({
    mutationFn: async (book_id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isFav = favorites?.find((f) => f.book_id === book_id);

      if (isFav) {
        // Remove it
        const { error } = await supabase.from('favorite_books').delete().eq('id', isFav.id);
        if (error) throw error;
      } else {
        // Find first available rank
        const usedRanks = new Set(favorites?.map((f) => f.rank) || []);
        let nextRank = 1;
        while (usedRanks.has(nextRank) && nextRank <= 10) {
          nextRank++;
        }
        if (nextRank > 10) {
          throw new Error('You can only add 10 books.');
        }
        const { error } = await supabase.from('favorite_books').insert({
          user_id: user.id,
          book_id,
          rank: nextRank,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useToggleFavoriteLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      favoriteBookId,
      isLiked,
      ownerId,
    }: {
      favoriteBookId: string;
      isLiked: boolean;
      ownerId: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('favorite_book_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('favorite_book_id', favoriteBookId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_book_likes')
          .insert({ user_id: user.id, favorite_book_id: favoriteBookId });
        if (error) throw error;

        if (ownerId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: ownerId,
            actor_id: user.id,
            type: 'like_favorite',
            target_id: favoriteBookId,
          });
        }
      }
    },
    onSuccess: (_, { ownerId }) => qc.invalidateQueries({ queryKey: ['favorites', ownerId] }),
  });
}
