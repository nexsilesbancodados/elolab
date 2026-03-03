import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface Plano {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  valor: number;
  frequencia: string;
  features: string[];
  ativo: boolean;
  destaque: boolean;
  ordem: number;
}

export interface AssinaturaPlano {
  plano_slug: string;
  plano_nome: string;
  status: string;
}

export function usePlanos() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos' as any)
        .select('*')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return data as unknown as Plano[];
    },
  });
}

export function useUserPlan() {
  const { user } = useSupabaseAuth();

  const { data: assinatura, isLoading } = useQuery({
    queryKey: ['user_plan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc('get_user_plan', {
        _user_id: user.id,
      });
      if (error) {
        console.error('Erro ao buscar plano:', error);
        return null;
      }
      return (data as unknown as AssinaturaPlano[])?.[0] || null;
    },
    enabled: !!user,
  });

  const hasFeature = (feature: string): boolean => {
    if (!assinatura) return false;
    // Ultra includes everything
    if (assinatura.plano_slug === 'elolab-ultra') return true;
    // Max includes everything except chatbot/agente_ia
    if (assinatura.plano_slug === 'elolab-max') {
      return feature !== 'agente_ia' && feature !== 'chatbot_whatsapp';
    }
    return false;
  };

  const isUltra = assinatura?.plano_slug === 'elolab-ultra';
  const isMax = assinatura?.plano_slug === 'elolab-max';
  const hasActivePlan = !!assinatura && assinatura.status === 'ativa';

  return {
    plan: assinatura,
    isLoading,
    hasFeature,
    isUltra,
    isMax,
    hasActivePlan,
    planName: assinatura?.plano_nome || null,
    planSlug: assinatura?.plano_slug || null,
  };
}
