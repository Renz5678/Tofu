import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type GoalType = 'pages_per_day' | 'minutes_per_day' | 'pages_per_week';

export interface ReadingGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  active: boolean;
  created_at: string;
}

async function fetchGoals(): Promise<ReadingGoal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reading_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true);

  if (error) throw error;
  return data ?? [];
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goal_type,
      target_value,
    }: {
      goal_type: GoalType;
      target_value: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First try to find existing active goal of this type
      const { data: existing } = await supabase
        .from('reading_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_type', goal_type)
        .eq('active', true)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('reading_goals')
          .update({ target_value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('reading_goals').insert({
          user_id: user.id,
          goal_type,
          target_value,
          active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
