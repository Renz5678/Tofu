/**
 * useProfile — fetches the authenticated user's profile, streak, and active goal
 * Uses React Query for caching + background refresh
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
}

export interface ProfileWithStreak extends Profile {
  streak: Streak | null;
}

async function fetchProfile(): Promise<ProfileWithStreak | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile exists, auto-create one since the trigger might have been missed
  if (profileError && profileError.code === 'PGRST116') {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      username: user.email?.split('@')[0] || `user_${Date.now()}`,
      display_name: 'Reader',
    });
    
    if (insertError) throw insertError;
    
    // Auto-create streaks row too, just in case
    await supabase.from('streaks').insert({ user_id: user.id }).select().single();

    // Re-fetch the profile
    const retry = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (retry.error) throw retry.error;
    profile = retry.data;
    profileError = null;
  } else if (profileError) {
    throw profileError;
  }

  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_read_date')
    .eq('user_id', user.id)
    .single();

  return { ...profile, streak: streak ?? null };
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
