import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Subscribes to real-time changes on critical tables and invalidates
 * React Query caches automatically, keeping the UI fresh.
 */
export function useRealtimeSubscription() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fila_atendimento' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pacientes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pacientes'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estoque' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['estoque'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
