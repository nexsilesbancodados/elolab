import { useEffect, useRef, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const DEFAULT_TIMEOUT_MIN = 30;
const WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout

let cachedTimeoutMin: number | null = null;

// Load from Supabase on init (called once)
async function loadTimeoutFromSupabase(userId: string) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('configuracoes_clinica')
      .select('valor')
      .eq('chave', 'session_timeout_min')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.valor) {
      const mins = typeof data.valor === 'number' ? data.valor : parseInt(String(data.valor), 10);
      if (mins >= 5 && mins <= 480) cachedTimeoutMin = mins;
    }
  } catch { /* ignore */ }
}

function getTimeoutMs(): number {
  if (cachedTimeoutMin && cachedTimeoutMin >= 5 && cachedTimeoutMin <= 480) {
    return cachedTimeoutMin * 60 * 1000;
  }
  return DEFAULT_TIMEOUT_MIN * 60 * 1000;
}

export function useSessionTimeout() {
  const { user, signOut } = useSupabaseAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    if (!user) return;

    const timeoutMs = getTimeoutMs();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (timeoutMs > WARNING_MS) {
      warningRef.current = setTimeout(() => {
        toast.warning('Sua sessão expira em 5 minutos por inatividade.', {
          duration: 10000,
          action: {
            label: 'Continuar',
            onClick: () => resetTimer(),
          },
        });
      }, timeoutMs - WARNING_MS);
    }

    timeoutRef.current = setTimeout(() => {
      toast.error('Sessão encerrada por inatividade.');
      signOut();
    }, timeoutMs);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);
}
