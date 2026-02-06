-- Tabela para configuração dos agentes de IA
CREATE TABLE public.whatsapp_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'geral', -- geral, agendamento, triagem
  humor TEXT NOT NULL DEFAULT 'profissional', -- profissional, amigavel, objetivo
  instrucoes_personalizadas TEXT,
  ativo BOOLEAN DEFAULT true,
  temperatura NUMERIC(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  mensagem_boas_vindas TEXT DEFAULT 'Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo?',
  mensagem_encerramento TEXT DEFAULT 'Obrigado pelo contato! Tenha um ótimo dia.',
  horario_atendimento_inicio TIME DEFAULT '08:00',
  horario_atendimento_fim TIME DEFAULT '18:00',
  atende_fora_horario BOOLEAN DEFAULT false,
  mensagem_fora_horario TEXT DEFAULT 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para sessões de WhatsApp conectadas
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_name TEXT NOT NULL UNIQUE,
  instance_id TEXT,
  status TEXT DEFAULT 'disconnected', -- connected, disconnected, connecting, qr_code
  qr_code TEXT,
  qr_code_expires_at TIMESTAMP WITH TIME ZONE,
  phone_number TEXT,
  agent_id UUID REFERENCES public.whatsapp_agents(id) ON DELETE SET NULL,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL, -- número do contato
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ativo', -- ativo, encerrado, aguardando_humano
  ultima_mensagem_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contexto JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para mensagens individuais
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id TEXT, -- ID da mensagem na Evolution API
  direcao TEXT NOT NULL, -- entrada, saida
  tipo TEXT DEFAULT 'texto', -- texto, imagem, audio, documento
  conteudo TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'enviado', -- enviado, entregue, lido, erro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para logs de ações do agente
CREATE TABLE public.whatsapp_agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  tipo_acao TEXT NOT NULL, -- consulta_agenda, criar_agendamento, consultar_prontuario, triagem
  dados_entrada JSONB,
  dados_saida JSONB,
  sucesso BOOLEAN DEFAULT true,
  erro_mensagem TEXT,
  duracao_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_agent_actions ENABLE ROW LEVEL SECURITY;

-- Policies para usuários autenticados com qualquer role
CREATE POLICY "Usuários autenticados podem gerenciar agentes"
ON public.whatsapp_agents FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Usuários autenticados podem gerenciar sessões"
ON public.whatsapp_sessions FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Usuários autenticados podem ver conversas"
ON public.whatsapp_conversations FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Usuários autenticados podem ver mensagens"
ON public.whatsapp_messages FOR ALL
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Usuários autenticados podem ver ações"
ON public.whatsapp_agent_actions FOR ALL
USING (public.has_any_role(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_agents_updated_at
BEFORE UPDATE ON public.whatsapp_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_whatsapp_conversations_session ON public.whatsapp_conversations(session_id);
CREATE INDEX idx_whatsapp_conversations_remote ON public.whatsapp_conversations(remote_jid);
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);