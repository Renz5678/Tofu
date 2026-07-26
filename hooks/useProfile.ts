/**
 * useProfile — fetches the authenticated user's profile, streak, and active goal
 * Uses React Query for caching + background refresh
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { validateUsernameFormat } from '@/hooks/useUsernameCheck';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile exists the DB trigger may have been missed.
  // Do NOT auto-generate a username from the email — throw so the caller
  // can redirect to a proper profile-completion screen.
  if (profileError && profileError.code === 'PGRST116') {
    throw new Error('PROFILE_NOT_FOUND');
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
    mutationFn: async (
      updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url'>>,
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentProfile = qc.getQueryData<ProfileWithStreak>(['profile']);
      const finalUpdates: any = {};

      // Only include display_name if it changed
      if (updates.display_name !== undefined && updates.display_name !== currentProfile?.display_name) {
        finalUpdates.display_name = updates.display_name;
      }

      // Only include avatar_url if it changed
      if (updates.avatar_url !== undefined && updates.avatar_url !== currentProfile?.avatar_url) {
        finalUpdates.avatar_url = updates.avatar_url;
      }

      // If changing username: validate format + check availability before saving
      if (updates.username !== undefined && updates.username !== currentProfile?.username) {
        const newUsername = updates.username.trim().toLowerCase();
        if (!validateUsernameFormat(newUsername)) {
          throw new Error('Invalid username format. Use letters, numbers and _ only (3–30 chars).');
        }
        const { data: available, error: rpcError } = await supabase.rpc(
          'check_username_available',
          { p_username: newUsername },
        );
        if (rpcError) throw rpcError;
        if (!available) throw new Error('Username is already taken. Please choose another.');
        finalUpdates.username = newUsername;
      }

      if (Object.keys(finalUpdates).length === 0) {
        return; // Nothing actually changed, do not run an empty update
      }

      const { error } = await supabase.from('profiles').update(finalUpdates).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
