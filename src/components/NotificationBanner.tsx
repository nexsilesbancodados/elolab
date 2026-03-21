import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function NotificationBanner() {
  const { permission, supported, requestPermission } = useNotifications();
  const { user, profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [localDismissed, setLocalDismissed] = useState(false);

  const { data: dismissed = false } = useQuery({
    queryKey: ['notification-banner-dismissed', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('configuracoes_clinica')
        .select('valor')
        .eq('chave', 'notification_banner_dismissed')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.valor === true;
    },
    enabled: !!user?.id,
  });

  const handleDismiss = async () => {
    setLocalDismissed(true);
    if (user?.id) {
      await supabase.from('configuracoes_clinica').upsert({
        chave: 'notification_banner_dismissed',
        user_id: user.id,
        valor: true as any,
      }, { onConflict: 'user_id,chave' });
      queryClient.invalidateQueries({ queryKey: ['notification-banner-dismissed', user.id] });
    }
  };

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleDismiss();
    }
  };

  // Only show for logged-in users, and only once
  if (!user || !supported || permission === 'granted' || permission === 'denied' || dismissed || localDismissed) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <p className="text-sm">
            Ative as notificações para receber lembretes de consultas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleEnable}>
            Ativar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
