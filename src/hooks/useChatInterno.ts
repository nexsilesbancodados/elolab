import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useChatInterno() {
  const { user, profile } = useSupabaseAuth();
  const [usuarios, setUsuarios] = useState<ChatUsuario[]>([]);
  const [conversas, setConversas] = useState<ChatConversa[]>([]);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<ChatConversa | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Buscar outros usuários da clínica via profiles
  const fetchUsuarios = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, nome, email, roles')
      .neq('user_id', user.id);
    if (!error && data) {
      setUsuarios(data.map(p => ({
        id: p.id,
        user_id: p.user_id ?? p.id,
        nome: p.nome ?? 'Usuário',
        email: p.email ?? '',
        roles: p.roles ?? [],
        online: false,
      })));
    }
  }, [user]);

  // Buscar conversas do usuário
  const fetchConversas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`participante_1_id.eq.${user.id},participante_2_id.eq.${user.id}`)
      .order('ultima_mensagem_em', { ascending: false });

    if (!data) return;

    // Para cada conversa, buscar o outro usuário
    const conversasComUsuario = await Promise.all(
      data.map(async (c: any) => {
        const outroId = c.participante_1_id === user.id ? c.participante_2_id : c.participante_1_id;
        const { data: outroProfile } = await supabase
          .from('profiles')
          .select('id, user_id, nome, email')
          .eq('user_id', outroId)
          .maybeSingle();

        // Contar não lidas
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversa_id', c.id)
          .eq('destinatario_id', user.id)
          .is('lida_em', null);

        return {
          id: c.id,
          participante_1_id: c.participante_1_id,
          participante_2_id: c.participante_2_id,
          ultima_mensagem_em: c.ultima_mensagem_em ?? null,
          preview: c.preview ?? null,
          outro_usuario: outroProfile ? {
            id: outroProfile.id,
            user_id: outroProfile.user_id ?? outroProfile.id,
            nome: outroProfile.nome ?? 'Usuário',
            email: outroProfile.email ?? '',
          } : undefined,
          nao_lidas: count ?? 0,
          urgente_nao_lida: false,
        } as ChatConversa;
      })
    );

    setConversas(conversasComUsuario);
    setTotalNaoLidas(conversasComUsuario.reduce((acc, c) => acc + c.nao_lidas, 0));
  }, [user]);

  // Buscar mensagens de uma conversa
  const fetchMensagens = useCallback(async (conversaId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMensagens((data as ChatMensagem[]) ?? []);

    // Marcar como lidas
    if (user) {
      await supabase
        .from('chat_messages')
        .update({ lida_em: new Date().toISOString() })
        .eq('conversa_id', conversaId)
        .eq('destinatario_id', user.id)
        .is('lida_em', null);
    }
    setLoading(false);
  }, [user]);

  // Iniciar ou recuperar conversa com um usuário
  const iniciarConversa = useCallback(async (outroUserId: string) => {
    if (!user) return null;

    // Verificar se já existe
    const existente = conversas.find(c =>
      (c.participante_1_id === user.id && c.participante_2_id === outroUserId) ||
      (c.participante_2_id === user.id && c.participante_1_id === outroUserId)
    );
    if (existente) {
      setConversaAtiva(existente);
      await fetchMensagens(existente.id);
      return existente;
    }

    // Criar nova conversa
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ participante_1_id: user.id, participante_2_id: outroUserId })
      .select()
      .single();

    if (error || !data) return null;
    await fetchConversas();
    return data;
  }, [user, conversas, fetchConversas, fetchMensagens]);

  // Enviar mensagem
  const enviarMensagem = useCallback(async (texto: string, urgente = false) => {
    if (!user || !conversaAtiva) return;
    const destinatarioId = conversaAtiva.participante_1_id === user.id
      ? conversaAtiva.participante_2_id
      : conversaAtiva.participante_1_id;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversa_id: conversaAtiva.id,
        remetente_id: user.id,
        destinatario_id: destinatarioId,
        texto,
        urgente,
        created_at: new Date().toISOString(),
      });

    if (error) return;

    // Atualizar preview da conversa
    await supabase
      .from('chat_conversations')
      .update({ ultima_mensagem_em: new Date().toISOString(), preview: texto.slice(0, 60) })
      .eq('id', conversaAtiva.id);

    await fetchMensagens(conversaAtiva.id);
    await fetchConversas();
  }, [user, conversaAtiva, fetchMensagens, fetchConversas]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    fetchUsuarios();
    fetchConversas();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`chat-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `destinatario_id=eq.${user.id}`,
      }, () => {
        fetchConversas();
        if (conversaAtiva) fetchMensagens(conversaAtiva.id);
      })
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [user?.id]);

  // Atualizar mensagens quando muda conversa ativa
  useEffect(() => {
    if (conversaAtiva) fetchMensagens(conversaAtiva.id);
  }, [conversaAtiva?.id]);

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
