import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, Clock, Gift } from 'lucide-react';
import { useUserPlan, usePlanos, useStartTrial } from '@/hooks/useSubscriptionPlan';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const planIcons: Record<string, React.ReactNode> = {
  'elolab-max': <Crown className="h-8 w-8" />,
  'elolab-ultra': <Sparkles className="h-8 w-8" />,
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

export default function Planos() {
  const { data: planos, isLoading } = usePlanos();
  const { planSlug, hasActivePlan, isTrial, trialEnd, trialDaysLeft } = useUserPlan();
  const startTrial = useStartTrial();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Escolha seu Plano</h1>
        <p className="text-xl text-muted-foreground">
          Potencialize sua clínica com as melhores ferramentas
        </p>
        {!hasActivePlan && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
            <Gift className="h-4 w-4" />
            Teste grátis por 3 dias — sem cartão de crédito!
          </div>
        )}
      </div>

      {/* Trial Banner */}
      {isTrial && trialEnd && (
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Período de teste ativo</p>
                  <p className="text-sm text-muted-foreground">
                    {trialDaysLeft > 0
                      ? `Restam ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} — expira em ${format(trialEnd, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                      : 'Seu período de teste expirou'}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/pagamentos?plano=${planSlug}`)}>
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {planos?.map((plano) => {
          const isCurrentPlan = planSlug === plano.slug;
          const isHighlighted = plano.destaque;

          return (
            <Card
              key={plano.id}
              className={`relative flex flex-col ${
                isHighlighted
                  ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'border-border'
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto mb-2 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`}>
                  {planIcons[plano.slug]}
                </div>
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valor)}
                  </span>
                  <span className="text-muted-foreground">/{plano.frequencia === 'mensal' ? 'mês' : plano.frequencia}</span>
                </div>

                {!hasActivePlan && (
                  <p className="text-xs text-muted-foreground mb-4">
                    🎁 {plano.trial_dias || 3} dias grátis para testar
                  </p>
                )}

                <ul className="space-y-2 text-left">
                  {(plano.features as string[]).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{featureLabels[feature] || feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto flex flex-col gap-2">
                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    {isTrial ? 'Em Teste' : 'Plano Atual'}
                  </Button>
                ) : (
                  <>
                    {!hasActivePlan && (
                      <Button
                        className="w-full"
                        variant={isHighlighted ? 'default' : 'outline'}
                        onClick={() => startTrial.mutate(plano.slug)}
                        disabled={startTrial.isPending}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        {startTrial.isPending ? 'Ativando...' : `Testar Grátis ${plano.trial_dias || 3} Dias`}
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      variant={hasActivePlan && isHighlighted ? 'default' : 'outline'}
                      onClick={() => navigate(`/pagamentos?plano=${plano.slug}`)}
                    >
                      {hasActivePlan ? 'Fazer Upgrade' : 'Assinar Direto'}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
