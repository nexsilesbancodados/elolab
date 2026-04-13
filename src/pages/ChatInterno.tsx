import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Plus, Search } from 'lucide-react';

export default function ChatInterno() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return [];
      const { data } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('clinica_id', profile.clinica_id)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.clinica_id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConvId],
    queryFn: async () => {
      if (!selectedConvId) return [];
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', selectedConvId)
        .order('created_at');
      return data || [];
    },
    enabled: !!selectedConvId,
    refetchInterval: 2000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConvId || !profile?.id) return;
      const { error } = await supabase.from('chat_messages').insert([{
        conversation_id: selectedConvId,
        usuario_id: profile.id,
        mensagem: messageText,
        lido: false,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([{ clinica_id: profile.clinica_id, titulo: 'Conversa Nova', urgente: false }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedConvId(data.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversa criada');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const filtered = conversations.filter((c: any) =>
    c.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    messagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <Button onClick={() => createMutation.mutate()} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" /> Nova
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {filtered.map((conv: any) => (
            <div key={conv.id} onClick={() => setSelectedConvId(conv.id)} className={`p-3 rounded-lg cursor-pointer ${selectedConvId === conv.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
              <div className="flex items-start justify-between">
                <p className="font-medium text-sm">{conv.titulo}</p>
                {conv.urgente && <Badge className="bg-red-500">Urgente</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConvId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.usuario_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.usuario_id === profile?.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    <p className="text-sm">{msg.mensagem}</p>
                    <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMutation.mutate()} placeholder="Digite..." className="flex-1" />
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="gap-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}
