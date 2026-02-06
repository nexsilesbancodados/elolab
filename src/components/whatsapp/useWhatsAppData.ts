import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhatsAppAgent, WhatsAppSession, WhatsAppConversation, WhatsAppStats, NewAgentForm, defaultAgentForm } from './types';

export function useWhatsAppAgents() {
  return useQuery({
    queryKey: ['whatsapp-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_agents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAgent[];
    },
  });
}

export function useWhatsAppSessions() {
  return useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*, whatsapp_agents(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppSession[];
    },
  });
}

export function useWhatsAppConversations() {
  return useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*, pacientes(nome)')
        .order('ultima_mensagem_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WhatsAppConversation[];
    },
  });
}

export function useWhatsAppStats() {
  return useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async (): Promise<WhatsAppStats> => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count: messagesCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: conversationsCount } = await supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: actionsCount } = await supabase
        .from('whatsapp_agent_actions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      return {
        messages: messagesCount || 0,
        conversations: conversationsCount || 0,
        actions: actionsCount || 0,
      };
    },
  });
}

export function useWhatsAppMutations() {
  const queryClient = useQueryClient();

  const createAgent = useMutation({
    mutationFn: async (agent: NewAgentForm) => {
      const { data, error } = await supabase
        .from('whatsapp_agents')
        .insert([agent])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      toast.success('Agente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agente: ' + error.message);
    },
  });

  const updateAgent = useMutation({
    mutationFn: async (agent: Partial<WhatsAppAgent> & { id: string }) => {
      const { id, ...updates } = agent;
      const { error } = await supabase
        .from('whatsapp_agents')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      toast.success('Agente atualizado!');
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agents'] });
      toast.success('Agente excluído!');
    },
  });

  const createSession = useMutation({
    mutationFn: async (instanceName: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'create_instance', instance_name: instanceName },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Sessão criada! Escaneie o QR Code.');
    },
    onError: (error) => {
      toast.error('Erro ao criar sessão: ' + error.message);
    },
  });

  const refreshQR = useMutation({
    mutationFn: async ({ sessionId, instanceName }: { sessionId: string; instanceName: string }) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'get_qr_code', instance_name: instanceName },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('QR Code atualizado!');
    },
  });

  const checkStatus = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'check_status', session_id: sessionId },
      });
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'delete_instance', session_id: sessionId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Sessão removida!');
    },
  });

  const linkAgentToSession = useMutation({
    mutationFn: async ({ sessionId, agentId }: { sessionId: string; agentId: string | null }) => {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ agent_id: agentId })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      toast.success('Agente vinculado!');
    },
  });

  return {
    createAgent,
    updateAgent,
    deleteAgent,
    createSession,
    refreshQR,
    checkStatus,
    deleteSession,
    linkAgentToSession,
  };
}
