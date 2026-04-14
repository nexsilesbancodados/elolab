import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface Conversa {
  id: string;
  titulo: string;
  participantes: string[];
  ultima_mensagem: string;
  updated_at: string;
  nao_lidos_count?: number;
}

export default function ChatInterno() {
  const { profile } = useSupabaseAuth();
  const [selectedConversaId, setSelectedConversaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ['chat_conversas', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await (supabase as any)
        .from('chat_conversas')
        .select('id, titulo, participantes, ultima_mensagem, updated_at')
        .or(`participantes.cs.["${profile.id}"]`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Conversa[];
    },
    enabled: !!profile?.id,
    refetchInterval: 3000,
  });

  const filteredConversas = conversas.filter(c =>
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversa = selectedConversaId
    ? conversas.find(c => c.id === selectedConversaId)
    : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border/25 bg-background/75 backdrop-blur-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Chat Interno</h1>
              <p className="text-sm text-muted-foreground">Comunicação da equipe</p>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border/25 bg-muted/20 flex flex-col">
          <div className="p-4 border-b border-border/25">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </>
            ) : filteredConversas.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversas.map(conversa => (
                <button
                  key={conversa.id}
                  onClick={() => setSelectedConversaId(conversa.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversaId === conversa.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{conversa.titulo}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-1 line-clamp-1">
                        {conversa.ultima_mensagem || 'Nenhuma mensagem'}
                      </p>
                    </div>
                    {conversa.nao_lidos_count && conversa.nao_lidos_count > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {conversa.nao_lidos_count > 9 ? '9+' : conversa.nao_lidos_count}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(conversa.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-background">
          {selectedConversa ? (
            <ChatPanel />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground mb-2">Selecione uma conversa para começar</p>
                <p className="text-sm text-muted-foreground/60">ou crie uma nova</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
