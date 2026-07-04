import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseBookRow } from './useLibrary';

export interface TierList {
  id: string;
  user_id: string;
  title: string;
  tiers: string[];
  created_at: string;
}

export interface TierListItem {
  id: string;
  tier_list_id: string;
  book_id: string;
  tier: string;
  position: number;
  book: DatabaseBookRow;
}

export function useTierLists() {
  return useQuery({
    queryKey: ['tierLists'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('tier_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TierList[];
    },
  });
}

export function useTierListItems(tierListId: string) {
  return useQuery({
    queryKey: ['tierListItems', tierListId],
    queryFn: async () => {
      if (!tierListId) return [];
      const { data, error } = await supabase
        .from('tier_list_items')
        .select(`
          *,
          book:books (*)
        `)
        .eq('tier_list_id', tierListId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as TierListItem[];
    },
    enabled: !!tierListId,
  });
}

export function useCreateTierList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tier_lists')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      return data as TierList;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tierLists'] }),
  });
}

export function useAddTierListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, bookId, tier }: { listId: string; bookId: string; tier: string }) => {
      const { error } = await supabase
        .from('tier_list_items')
        .insert({ tier_list_id: listId, book_id: bookId, tier });
      if (error) throw error;
    },
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: ['tierListItems', listId] }),
  });
}

export function useUpdateTierListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, tier, position }: { itemId: string; tier: string; position: number }) => {
      const { error } = await supabase
        .from('tier_list_items')
        .update({ tier, position })
        .eq('id', itemId);
      if (error) throw error;
    },
    // We could optimize this by manually updating the cache, but let's just invalidate
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tierListItems'] }),
  });
}
