import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppAgent, WhatsAppSession, WhatsAppConversation, WhatsAppStats } from './types';

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
