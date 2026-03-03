import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { useUserPlan, usePlanos } from '@/hooks/useSubscriptionPlan';

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
  const { planSlug, hasActivePlan } = useUserPlan();
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
      </div>

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

                <ul className="space-y-2 text-left">
                  {(plano.features as string[]).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{featureLabels[feature] || feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isHighlighted ? 'default' : 'outline'}
                    onClick={() => navigate(`/pagamentos?plano=${plano.slug}`)}
                  >
                    {hasActivePlan ? 'Fazer Upgrade' : 'Assinar Agora'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
