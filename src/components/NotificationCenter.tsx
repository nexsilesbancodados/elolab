import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Loader2, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  tipo: 'email' | 'whatsapp' | 'sistema';
  assunto?: string;
  conteudo: string;
  destinatario_nome?: string;
  status: 'enviado' | 'pendente' | 'erro';
  lida: boolean;
  criada_em: string;
  destinatario_id?: string;
  dados_extras?: Record<string, any>;
}

export function NotificationCenter() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notification_queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .order('criada_em', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as Notificacao[];
    },
    refetchInterval: 5000,
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_queue')
        .update({ lida: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_queue'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notification_queue')
        .update({ lida: true })
        .eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Todas as notificações marcadas como lidas');
      queryClient.invalidateQueries({ queryKey: ['notification_queue'] });
    },
  });

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getColor = (tipo: string) => {
    switch (tipo) {
      case 'email': return 'text-blue-500';
      case 'whatsapp': return 'text-green-500';
      default: return 'text-amber-500';
    }
  };

  const getLabel = (tipo: string) => {
    switch (tipo) {
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      default: return 'Sistema';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return format(date, 'dd/MM', { locale: ptBR });
  };

  if (!user) return null;

  return (
    <>
      {/* Bell Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell className="h-5 w-5" />
            {naoLidas > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center"
              >
                {naoLidas > 9 ? '9+' : naoLidas}
              </motion.span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Notificações {naoLidas > 0 && `(${naoLidas})`}
        </TooltipContent>
      </Tooltip>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-16px)] bg-card border rounded-lg shadow-lg z-50 flex flex-col max-h-[500px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                  {naoLidas > 0 && (
                    <Badge variant="default" className="text-[10px]">
                      {naoLidas}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Carregando...</p>
                  </div>
                ) : notificacoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Sem notificações
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Você está em dia
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notificacoes.map(n => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer group ${!n.lida ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsReadMutation.mutate(n.id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 mt-1 ${getColor(n.tipo)}`}>
                            {getIcon(n.tipo)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {n.assunto || getLabel(n.tipo)}
                                </p>
                                {!n.lida && (
                                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                {formatTime(n.criada_em)}
                              </span>
                            </div>
                            <p className="text-[12px] text-muted-foreground line-clamp-2">
                              {n.conteudo.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[9px] py-0">
                                {getLabel(n.tipo)}
                              </Badge>
                              {n.status === 'enviado' && (
                                <Badge variant="secondary" className="text-[9px] py-0 bg-green-50 text-green-700">
                                  <Check className="h-2.5 w-2.5 mr-1" /> Enviado
                                </Badge>
                              )}
                              {n.status === 'erro' && (
                                <Badge variant="secondary" className="text-[9px] py-0 bg-red-50 text-red-700">
                                  Erro
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notificacoes.length > 0 && naoLidas > 0 && (
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[12px] h-8"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    {markAllAsReadMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Marcando...
                      </>
                    ) : (
                      'Marcar tudo como lido'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
