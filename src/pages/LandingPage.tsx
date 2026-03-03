import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Check, Crown, Sparkles, Zap, Shield, Calendar, Users, FileText,
  Stethoscope, BarChart3, Bot, ArrowRight, Star, Gift, ChevronDown,
  Heart, Clock, Smartphone,
} from 'lucide-react';

const featureHighlights = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Agendamentos online com lembretes automáticos por WhatsApp e e-mail' },
  { icon: FileText, title: 'Prontuário Eletrônico', desc: 'Prontuário completo com anexos, prescrições e histórico do paciente' },
  { icon: Users, title: 'Gestão de Pacientes', desc: 'Cadastro completo, convênios, LGPD e portal do paciente' },
  { icon: Stethoscope, title: 'Triagem Manchester', desc: 'Classificação de risco, fila de atendimento e painel TV' },
  { icon: BarChart3, title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa e Mercado Pago integrado' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Chatbot atendente 24h com agendamento automático via IA' },
];

const testimonials = [
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o EloLab. O prontuário eletrônico é incrível!' },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço.' },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente nosso fluxo.' },
];

const planIcons: Record<string, React.ReactNode> = {
  'elolab-max': <Crown className="h-8 w-8" />,
  'elolab-ultra': <Sparkles className="h-8 w-8" />,
};

const featureLabels: Record<string, string> = {
  dashboard: 'Dashboard Analítico', agenda: 'Agenda & Agendamentos', pacientes: 'Gestão de Pacientes',
  prontuarios: 'Prontuário Eletrônico', prescricoes: 'Prescrições Médicas', atestados: 'Atestados',
  exames: 'Módulo de Exames', triagem: 'Triagem Manchester', fila: 'Fila de Atendimento',
  salas: 'Gestão de Salas', estoque: 'Controle de Estoque', financeiro: 'Módulo Financeiro',
  relatorios: 'Relatórios', convenios: 'Gestão de Convênios', funcionarios: 'Gestão de Funcionários',
  automacoes: 'Automações', analytics: 'Analytics Avançado', templates: 'Templates Reutilizáveis',
  encaminhamentos: 'Encaminhamentos', lista_espera: 'Lista de Espera', painel_tv: 'Painel TV',
  pagamentos: 'Pagamentos Mercado Pago', agente_ia: 'Agente IA WhatsApp', chatbot_whatsapp: 'Chatbot Atendente 24h',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', clinica: '' });

  const { data: planos } = useQuery({
    queryKey: ['planos_public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos' as any)
        .select('*')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return data as any[];
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('public-checkout', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      setCheckoutDialog(false);
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.success('Checkout criado! Verifique seu e-mail para instruções.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar. Tente novamente.'),
  });

  const handleSelectPlan = (plano: any) => {
    setSelectedPlan(plano);
    setCheckoutDialog(true);
  };

  const handleCheckout = () => {
    if (!form.nome || !form.email) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    checkoutMutation.mutate({
      plano_id: selectedPlan.id,
      plano_slug: selectedPlan.slug,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      clinica: form.clinica,
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans']">EloLab</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollToSection('features')} className="hover:text-foreground transition-colors">Recursos</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-foreground transition-colors">Planos</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-foreground transition-colors">Depoimentos</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button size="sm" onClick={() => scrollToSection('pricing')}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(200_80%_50%_/_0.08)_0%,transparent_60%)]" />
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">
            <Gift className="h-3.5 w-3.5 mr-1.5" /> 3 dias grátis — sem cartão de crédito
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] leading-[1.1] mb-6">
            A clínica do futuro
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-hero)' }}>
              começa aqui
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestão completa para clínicas e consultórios: agenda, prontuário, financeiro, WhatsApp com IA e muito mais — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12 shadow-lg" onClick={() => scrollToSection('pricing')}>
              Teste Grátis 3 Dias <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" onClick={() => scrollToSection('features')}>
              Ver Recursos <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> LGPD Compliant</div>
            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Setup em 2 min</div>
            <div className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> PWA Mobile</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Tudo que sua clínica precisa</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Mais de 20 módulos integrados para automatizar e escalar sua operação médica
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map((f, i) => (
              <Card key={i} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Planos simples e transparentes</h2>
            <p className="text-muted-foreground text-lg">
              Comece com 3 dias grátis. Cancele quando quiser.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {planos?.map((plano: any) => {
              const isHighlighted = plano.destaque;
              return (
                <Card
                  key={plano.id}
                  className={`relative flex flex-col ${isHighlighted ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' : 'border-border'}`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <Zap className="h-3 w-3 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-2 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`}>
                      {planIcons[plano.slug]}
                    </div>
                    <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plano.descricao}</p>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valor)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-xs text-primary font-medium mb-6">🎁 {plano.trial_dias || 3} dias grátis</p>
                    <ul className="space-y-2 text-left">
                      {(plano.features as string[]).slice(0, 10).map((feature: string) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{featureLabels[feature] || feature}</span>
                        </li>
                      ))}
                      {(plano.features as string[]).length > 10 && (
                        <li className="text-xs text-muted-foreground pl-6">
                          + {(plano.features as string[]).length - 10} recursos adicionais
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button
                      className="w-full h-12 text-base"
                      variant={isHighlighted ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plano)}
                    >
                      Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] mb-4">Quem usa, recomenda</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] mb-4">
            Pronto para transformar sua clínica?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a centenas de profissionais que já automatizaram sua rotina com o EloLab.
          </p>
          <Button size="lg" className="text-base px-10 h-12 shadow-lg" onClick={() => scrollToSection('pricing')}>
            Começar Agora — É Grátis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">EloLab</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Login</button>
            <a href="mailto:contato@elolab.com.br" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assine o {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>
              Comece com {selectedPlan?.trial_dias || 3} dias grátis. Preencha seus dados para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Nome da Clínica</Label>
              <Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} placeholder="Clínica São Lucas" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">{selectedPlan?.nome}</p>
              <p className="text-muted-foreground">
                {selectedPlan?.trial_dias || 3} dias grátis, depois{' '}
                {selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCheckout} disabled={checkoutMutation.isPending} className="w-full">
              {checkoutMutation.isPending ? 'Processando...' : 'Começar Teste Grátis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
