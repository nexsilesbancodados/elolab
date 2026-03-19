
-- Tabela de conversas do chat interno
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participante_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
  preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participante_1_id, participante_2_id)
);

-- Tabela de mensagens do chat interno
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  urgente BOOLEAN DEFAULT false,
  lida_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_chat_conversations_p1 ON public.chat_conversations(participante_1_id);
CREATE INDEX idx_chat_conversations_p2 ON public.chat_conversations(participante_2_id);
CREATE INDEX idx_chat_messages_conversa ON public.chat_messages(conversa_id);
CREATE INDEX idx_chat_messages_destinatario ON public.chat_messages(destinatario_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- RLS para chat_conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_conv_select" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (participante_1_id = auth.uid() OR participante_2_id = auth.uid());

CREATE POLICY "chat_conv_insert" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (participante_1_id = auth.uid() OR participante_2_id = auth.uid());

CREATE POLICY "chat_conv_update" ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (participante_1_id = auth.uid() OR participante_2_id = auth.uid());

-- RLS para chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_msg_select" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (remetente_id = auth.uid() OR destinatario_id = auth.uid());

CREATE POLICY "chat_msg_insert" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (remetente_id = auth.uid());

CREATE POLICY "chat_msg_update" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (destinatario_id = auth.uid());

-- Trigger updated_at para conversations
CREATE TRIGGER set_updated_at_chat_conversations
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime nas tabelas de chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
