import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppConversation } from './types';

interface ConversationsTabProps {
  conversations: WhatsAppConversation[];
}

export function ConversationsTab({ conversations }: ConversationsTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'aguardando':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'encerrado':
        return <Badge variant="outline">Encerrada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Conversas Recentes</h2>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma conversa ainda</h3>
            <p className="text-muted-foreground">
              As conversas aparecerão aqui quando os pacientes entrarem em contato
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {conversations.length} conversa(s) recente(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <Card key={conv.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {conv.pacientes?.nome || conv.remote_jid.replace('@s.whatsapp.net', '')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {conv.remote_jid.replace('@s.whatsapp.net', '')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(conv.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.ultima_mensagem_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
