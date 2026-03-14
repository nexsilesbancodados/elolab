import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, Clock, Gift, ArrowRight, Shield, Headphones } from 'lucide-react';
import { useUserPlan, usePlanos, useStartTrial } from '@/hooks/useSubscriptionPlan';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const planConfig: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  borderAccent: string;
  btnClass: string;
}> = {
  'elolab-max': {
    icon: <Crown className="h-7 w-7" />,
    gradient: 'from-primary/5 via-transparent to-transparent',
    iconBg: 'bg-primary/10 text-primary',
    borderAccent: 'border-primary/20 hover:border-primary/50',
    btnClass: '',
  },
  'elolab-ultra': {
    icon: <Sparkles className="h-7 w-7" />,
    gradient: 'from-amber-500/8 via-transparent to-transparent',
    iconBg: 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
    borderAccent: 'border-amber-400/30 hover:border-amber-400/60',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 border-0',
  },
};

const featureLabels: Record<string, string> = {
  dashboard: 'Dashboard Analítico',
  agenda: 'Agenda & Agendamentos',
  pacientes: 'Gestão de Pacientes',
  prontuarios: 'Prontuário Eletrônico',
  prescricoes: 'Prescrições Médicas',
  atestados: 'Atestados',
  exames: 'Módulo de Exames',
  triagem: 'Triagem Manchester',
  fila: 'Fila de Atendimento',
  salas: 'Gestão de Salas',
  estoque: 'Controle de Estoque',
  financeiro: 'Módulo Financeiro',
  relatorios: 'Relatórios',
  convenios: 'Gestão de Convênios',
  funcionarios: 'Gestão de Funcionários',
  automacoes: 'Automações',
  analytics: 'Analytics Avançado',
  templates: 'Templates Reutilizáveis',
  encaminhamentos: 'Encaminhamentos',
  lista_espera: 'Lista de Espera',
  painel_tv: 'Painel TV',
  pagamentos: 'Pagamentos Mercado Pago',
  agente_ia: 'Agente IA WhatsApp',
  chatbot_whatsapp: 'Chatbot Atendente 24h',
};

const premiumFeatures = ['agente_ia', 'chatbot_whatsapp'];

export default function Planos() {
  const { data: planos, isLoading } = usePlanos();
  const { planSlug, hasActivePlan, isTrial, trialEnd, trialDaysLeft } = useUserPlan();
  const startTrial = useStartTrial();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async (plano: any) => {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: {
          action: 'create_subscription',
          nome_plano: plano.nome,
          descricao: plano.descricao || `Plano ${plano.nome} EloLab`,
          valor: plano.valor,
          frequencia: 'mensal',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.checkout_url) {
        toast.success('Redirecionando para o Mercado Pago...', { duration: 4000 });
        window.open(data.checkout_url, '_blank');
      }
      queryClient.invalidateQueries({ queryKey: ['user_plan'] });
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar upgrade'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
          <Zap className="h-3.5 w-3.5" />
          Planos & Preços
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Escolha o plano ideal
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Potencialize sua clínica com as melhores ferramentas de gestão médica
        </p>
        {!hasActivePlan && (
          <div className="inline-flex items-center gap-2 bg-success/10 text-success rounded-full px-5 py-2.5 text-sm font-medium border border-success/20">
            <Gift className="h-4 w-4" />
            Teste grátis por 3 dias — sem cartão de crédito!
          </div>
        )}
      </div>

      {/* Trial Banner */}
      {isTrial && trialEnd && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Período de teste ativo</p>
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft > 0
                  ? `Restam ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} — expira em ${format(trialEnd, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                  : 'Seu período de teste expirou'}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(`/pagamentos?plano=${planSlug}`)} className="gap-2 shrink-0">
            Assinar Agora
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {planos?.map((plano) => {
          const isCurrentPlan = planSlug === plano.slug;
          const isHighlighted = plano.destaque;
          const config = planConfig[plano.slug] || planConfig['elolab-max'];
          const features = plano.features as string[];

          return (
            <div
              key={plano.id}
              className={`
                relative flex flex-col rounded-2xl border-2 bg-card overflow-hidden transition-all duration-500
                ${config.borderAccent}
                ${isHighlighted ? 'shadow-xl shadow-amber-500/10 md:scale-[1.03]' : 'shadow-md hover:shadow-lg'}
              `}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} pointer-events-none`} />

              {/* Popular badge */}
              {isHighlighted && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">
                    ⚡ MAIS POPULAR
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="relative p-8 pb-4">
                <div className={`inline-flex p-3 rounded-xl ${config.iconBg} mb-4`}>
                  {config.icon}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{plano.nome}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
              </div>

              {/* Price */}
              <div className="relative px-8 pb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valor)}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    /{plano.frequencia === 'mensal' ? 'mês' : plano.frequencia}
                  </span>
                </div>
                {!hasActivePlan && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-success" />
                    {plano.trial_dias || 3} dias grátis para experimentar
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="mx-8 border-t border-border/60" />

              {/* Features */}
              <div className="relative flex-1 p-8 pt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  O que está incluído
                </p>
                <ul className="space-y-3">
                  {features.map((feature) => {
                    const isPremium = premiumFeatures.includes(feature);
                    return (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 shrink-0 rounded-full p-0.5 ${isPremium ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-success/15 text-success'}`}>
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                        <span className="text-foreground/90">
                          {featureLabels[feature] || feature}
                          {isPremium && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-amber-400/40 text-amber-600 dark:text-amber-400">
                              Exclusivo
                            </Badge>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Footer */}
              <div className="relative p-8 pt-2 flex flex-col gap-3">
                {isCurrentPlan ? (
                  <Button className="w-full h-12 text-base" variant="outline" disabled>
                    <Shield className="h-4 w-4 mr-2" />
                    {isTrial ? 'Em Período de Teste' : 'Seu Plano Atual'}
                  </Button>
                ) : (
                  <>
                    {!hasActivePlan && (
                      <Button
                        className={`w-full h-12 text-base font-semibold ${isHighlighted ? config.btnClass : ''}`}
                        variant={isHighlighted ? 'default' : 'outline'}
                        onClick={() => startTrial.mutate(plano.slug)}
                        disabled={startTrial.isPending}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        {startTrial.isPending ? 'Ativando...' : `Testar Grátis ${plano.trial_dias || 3} Dias`}
                      </Button>
                    )}
                    <Button
                      className="w-full h-12 text-base"
                      variant={hasActivePlan && isHighlighted ? 'default' : 'ghost'}
                      onClick={() => navigate(`/pagamentos?plano=${plano.slug}`)}
                    >
                      {hasActivePlan ? 'Fazer Upgrade' : 'Assinar Direto'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-success" />
          <span>Dados criptografados</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Cancele quando quiser</span>
        </div>
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-primary" />
          <span>Suporte prioritário</span>
        </div>
      </div>
    </div>
  );
}
