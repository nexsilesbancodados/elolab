import { useState, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface ChatUsuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  avatar_url?: string | null;
  online?: boolean;
  roles?: string[];
}

export interface ChatConversa {
  id: string;
  participante_1_id: string;
  participante_2_id: string;
  ultima_mensagem_em: string | null;
  preview: string | null;
  outro_usuario?: ChatUsuario;
  nao_lidas: number;
  urgente_nao_lida: boolean;
}

export interface ChatMensagem {
  id: string;
  conversa_id: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  urgente: boolean;
  lida_em: string | null;
  created_at: string;
}

// Chat interno desabilitado - tabelas chat_conversations e chat_messages não existem no banco
export function useChatInterno() {
  const { user } = useSupabaseAuth();
  const [usuarios] = useState<ChatUsuario[]>([]);
  const [conversas] = useState<ChatConversa[]>([]);
  const [mensagens] = useState<ChatMensagem[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<ChatConversa | null>(null);
  const [loading] = useState(false);
  const [totalNaoLidas] = useState(0);

  const fetchMensagens = useCallback(async (_conversaId: string) => {
    // No-op: chat tables not available
  }, []);

  const iniciarConversa = useCallback(async (_outroUserId: string): Promise<ChatConversa | null> => {
    return null;
  }, []);

  const enviarMensagem = useCallback(async (_texto: string, _urgente = false) => {
    // No-op: chat tables not available
  }, []);

  return {
    usuarios,
    conversas,
    mensagens,
    conversaAtiva,
    setConversaAtiva,
    loading,
    totalNaoLidas,
    fetchMensagens,
    iniciarConversa,
    enviarMensagem,
  };
}
