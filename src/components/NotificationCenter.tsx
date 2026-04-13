import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return [];
      const { data } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('clinica_id', profile.clinica_id)
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!profile?.clinica_id,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n: any) => n.status !== 'lida').length;

  const getIcon = (type: string) => {
    if (type === 'email') return <Mail className="h-4 w-4" />;
    if (type === 'whatsapp') return <MessageSquare className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold">Notificações</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map((notif: any) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg text-sm border-l-4 cursor-pointer transition ${
                      notif.status === 'lida' ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1">{getIcon(notif.tipo)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{notif.assunto}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.destinatario}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
