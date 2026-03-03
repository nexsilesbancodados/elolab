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
  Stethoscope, BarChart3, Bot, ArrowRight, Star, ChevronDown,
  Heart, Clock, Smartphone, LogIn, PlayCircle, DollarSign, Package,
  ClipboardList, Monitor, Brain, MessageSquare, HeadphonesIcon,
  CheckCircle2, ChevronRight,
} from 'lucide-react';
import doctorHero from '@/assets/doctor-hero.webp';

/* ─── data ─── */
const stats = [
  { value: '12M+', label: 'Marcações agendadas' },
  { value: '3M+', label: 'Pacientes atendidos' },
  { value: '10K+', label: 'Médicos cadastrados' },
  { value: '500+', label: 'Clientes ativos' },
];

const featureCards = [
  { icon: Calendar, title: 'Agenda online', desc: 'Disponibilize a agenda de consultas e tratamentos seriados.' },
  { icon: FileText, title: 'Prescrição digital', desc: 'Realize prescrições eletrônicas com envio direto aos pacientes.' },
  { icon: DollarSign, title: 'Faturamento', desc: 'Gerencie o faturamento particular e dos seus convênios.' },
  { icon: ClipboardList, title: 'Laudo online', desc: 'Libere os resultados dos exames via web para os pacientes.' },
  { icon: BarChart3, title: 'Gestão financeira', desc: 'Controle o fluxo de caixa da clínica de forma integrada.' },
  { icon: Package, title: 'Controle de estoque', desc: 'Gerencie a movimentação e validade de medicamentos.' },
];

const managementFeatures = [
  { icon: DollarSign, title: 'Financeiro inteligente', desc: 'Tenha uma ampla visão das finanças do seu negócio, evitando gastos desnecessários.' },
  { icon: Stethoscope, title: 'Prontuário eletrônico', desc: 'Centralize os dados clínicos dos seus pacientes com total segurança.' },
  { icon: BarChart3, title: 'Relatórios gerenciais', desc: 'Gerencie os indicadores de desempenho da sua clínica em tempo real.' },
  { icon: Calendar, title: 'Agendamento 360', desc: 'Agendas para tratamentos seriados, fila de espera, agendamento online e mais.' },
  { icon: Users, title: 'Atendimento eficiente', desc: 'Centralizamos todos os dados dos pacientes para atendimento ágil e humanizado.' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Chatbot atendente 24h com agendamento automático via inteligência artificial.' },
];

const extraFeatures = [
  { icon: Monitor, title: 'Painel TV', desc: 'Exiba a fila de atendimento em tempo real na recepção.' },
  { icon: MessageSquare, title: 'Chat WhatsApp', desc: 'Comunicação direta com pacientes via WhatsApp integrado.' },
  { icon: HeadphonesIcon, title: 'Suporte dedicado', desc: 'Equipe de sucesso do cliente para apoiar seu crescimento.' },
  { icon: Brain, title: 'Agente IA', desc: 'Assistente inteligente para atendimento e triagem automatizada.' },
  { icon: Shield, title: 'LGPD Compliant', desc: 'Software em conformidade com as normas da LGPD.' },
];

const testimonials = [
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o EloLab. O prontuário eletrônico é incrível e a equipe de suporte é sensacional!' },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço, meus pacientes adoram.' },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente o fluxo da clínica. Recomendo muito!' },
];

const planIcons: Record<string, React.ReactNode> = {
  'elolab-max': <Crown className="h-7 w-7" />,
  'elolab-ultra': <Sparkles className="h-7 w-7" />,
};

const featureLabels: Record<string, string> = {
  dashboard: 'Dashboard Analítico', agenda: 'Agenda & Agendamentos', pacientes: 'Gestão de Pacientes',
  prontuarios: 'Prontuário Eletrônico', prescricoes: 'Prescrições Médicas', atestados: 'Atestados',
  exames: 'Módulo de Exames', triagem: 'Triagem Manchester', fila: 'Fila de Atendimento',
  salas: 'Gestão de Salas', estoque: 'Controle de Estoque', financeiro: 'Módulo Financeiro',
  relatorios: 'Relatórios', convenios: 'Gestão de Convênios', funcionarios: 'Gestão de Funcionários',
  automacoes: 'Automações', analytics: 'Analytics Avançado', templates: 'Templates Reutilizáveis',
  encaminhamentos: 'Encaminhamentos', lista_espera: 'Lista de Espera', painel_tv: 'Painel TV',
  pagamentos: 'Pagamentos Mercado Pago', agente_ia: 'Agente IA WhatsApp', chatbot_whatsapp: 'Chatbot 24h',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [checkoutMode, setCheckoutMode] = useState<'trial' | 'buy'>('trial');
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
      const { data, error } = await supabase.functions.invoke('public-checkout', { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      setCheckoutDialog(false);
      if (data?.checkout_url) {
        toast.success('Redirecionando para o pagamento...');
        window.location.href = data.checkout_url;
      } else {
        toast.success('✅ Verifique seu e-mail! Enviamos o código de ativação para criar sua conta.', { duration: 8000 });
      }
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar. Tente novamente.'),
  });

  const handleSelectPlan = (plano: any) => { setSelectedPlan(plano); setCheckoutDialog(true); };

  const handleCheckout = (mode: 'trial' | 'buy') => {
    if (!form.nome || !form.email) { toast.error('Preencha nome e e-mail'); return; }
    checkoutMutation.mutate({
      plano_id: selectedPlan.id, plano_slug: selectedPlan.slug,
      nome: form.nome, email: form.email, telefone: form.telefone, clinica: form.clinica,
      mode,
    });
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white text-foreground font-sans">
      {/* ─── Top Bar ─── */}
      <div className="bg-[hsl(168,76%,36%)] text-white text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline">Software de acordo com as normas da LGPD</span>
          <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 hover:underline ml-auto">
            <LogIn className="h-4 w-4" /> Entrar no EloLab
          </button>
        </div>
      </div>

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-[hsl(168,76%,36%)]" />
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)]">
              elo<span className="text-[hsl(168,76%,36%)]">lab</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[hsl(215,15%,50%)]">
            <button onClick={() => scrollTo('features')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Funcionalidades</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Planos</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Depoimentos</button>
            <button onClick={() => scrollTo('management')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Recursos</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10" onClick={() => scrollTo('pricing')}>
              Demonstração
            </Button>
            <Button size="sm" className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 shadow-md" onClick={() => scrollTo('pricing')}>
              Testar agora
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[hsl(168,60%,97%)] to-white">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-[30%] w-64 h-64 bg-[hsl(40,90%,55%)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[10%] w-80 h-80 bg-[hsl(168,76%,36%)]/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left: Copy */}
            <div className="lg:col-span-5 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.1] text-[hsl(215,28%,17%)] font-['Plus_Jakarta_Sans']">
                Software de gestão para clínicas e consultórios
              </h1>
              <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed">
                Tenha à disposição as melhores ferramentas de{' '}
                <span className="text-[hsl(168,76%,36%)] font-semibold">Gestão Médica</span>{' '}
                e garanta a melhor experiência de atendimento ao seu paciente.
              </p>
              <Button
                size="lg"
                className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 shadow-lg text-base px-8 h-13 rounded-full"
                onClick={() => scrollTo('pricing')}
              >
                Testar grátis
              </Button>
            </div>

            {/* Center: Doctor Image */}
            <div className="lg:col-span-4 flex justify-center">
              <img
                src={doctorHero}
                alt="Médico usando o software EloLab em um tablet"
                className="max-h-[480px] w-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Right: Plan Card */}
            <div className="lg:col-span-3">
              {planos && planos.length > 0 && (
                <div className="relative bg-white rounded-2xl border border-[hsl(168,76%,36%)]/20 shadow-xl p-6">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[hsl(168,76%,36%)] text-white px-4 py-1 text-xs rounded-full">
                      Mais vendido
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-center mt-2 mb-4 text-[hsl(215,28%,17%)]">
                    {planos[0].nome || 'Plano Premium'}
                  </h3>
                  <div className="text-center mb-4">
                    <span className="text-sm text-[hsl(215,15%,50%)]">R$</span>
                    <span className="text-5xl font-extrabold text-[hsl(215,28%,17%)]">
                      {Math.floor(planos[0].valor)}
                    </span>
                    <span className="text-sm text-[hsl(215,15%,50%)]"> /mês</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {['Agenda Online, Prontuário e Faturamento', 'Controle Financeiro e Estoque', '+ Funcionalidades'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[hsl(168,76%,36%)] shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-[hsl(215,28%,17%)]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 rounded-full h-11"
                    onClick={() => handleSelectPlan(planos[0])}
                  >
                    Testar agora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative bg-[hsl(168,76%,36%)] py-12 overflow-hidden">
        {/* Mesh pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-1">
                {s.value}
              </div>
              <div className="text-white/80 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] leading-tight mb-4">
                Torne a sua clínica referência para os pacientes
              </h2>
              <p className="text-[hsl(215,15%,50%)] leading-relaxed mb-6">
                Garanta uma experiência inovadora para os pacientes utilizando tecnologia e as melhores práticas de gestão.
              </p>
              <Button
                variant="outline"
                className="border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10 rounded-full"
                onClick={() => scrollTo('pricing')}
              >
                Conheça nossos planos <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureCards.map((f, i) => (
                <div
                  key={i}
                  className="group bg-white border border-border/60 rounded-xl p-5 hover:shadow-lg hover:border-[hsl(168,76%,36%)]/30 transition-all duration-300"
                >
                  <div className="h-11 w-11 rounded-full bg-[hsl(168,76%,90%)] flex items-center justify-center mb-3 group-hover:bg-[hsl(168,76%,36%)] transition-colors">
                    <f.icon className="h-5 w-5 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-[hsl(215,28%,17%)] mb-1">{f.title}</h3>
                  <p className="text-sm text-[hsl(215,15%,50%)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Prontuário Section ─── */}
      <section className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-6">
              Prontuário eletrônico
            </h2>
            <p className="text-[hsl(215,15%,50%)] mb-8 leading-relaxed">
              Centralize os dados clínicos dos seus pacientes com segurança.
            </p>
            <div className="space-y-6">
              {[
                { title: 'Gestão do histórico do paciente', desc: 'Administre a anamnese, anexe documentos, gerencie laudos, atestados e prescrições de qualquer lugar.' },
                { title: 'Prescrição digital', desc: 'Ofereça economia e praticidade com prescrições eletrônicas enviadas diretamente ao paciente.' },
                { title: 'Conformidade LGPD', desc: 'Valide a autenticidade e integridade do Prontuário com consentimento e rastreabilidade.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[hsl(168,76%,36%)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-[hsl(168,76%,36%)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[hsl(215,28%,17%)] mb-1">{item.title}</h4>
                    <p className="text-sm text-[hsl(215,15%,50%)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-8 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-full"
              onClick={() => scrollTo('pricing')}
            >
              Conheça o Prontuário Eletrônico <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-border/40 p-8 flex items-center justify-center min-h-[340px]">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-[hsl(168,76%,90%)] flex items-center justify-center">
                <Stethoscope className="h-10 w-10 text-[hsl(168,76%,36%)]" />
              </div>
              <h3 className="text-xl font-bold text-[hsl(215,28%,17%)]">Prontuário Completo</h3>
              <p className="text-sm text-[hsl(215,15%,50%)] max-w-xs mx-auto">
                Histórico, prescrições, exames, anexos e muito mais — tudo integrado em um único lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-3">
              O que os nossos clientes dizem
            </h2>
            <p className="text-[hsl(215,15%,50%)] text-lg max-w-xl mx-auto">
              Valorizamos o feedback dos nossos clientes. Veja o que eles dizem sobre o EloLab.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[hsl(40,90%,55%)] text-[hsl(40,90%,55%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-[hsl(215,15%,40%)] mb-5 leading-relaxed italic">
                    "{t.text}"
                  </p>
                  <div className="border-t border-border/40 pt-4">
                    <p className="font-semibold text-sm text-[hsl(215,28%,17%)]">{t.name}</p>
                    <p className="text-xs text-[hsl(168,76%,36%)]">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Management Features Grid ─── */}
      <section id="management" className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-3">
              Simplifique a gestão do seu consultório
            </h2>
            <p className="text-[hsl(215,15%,50%)] text-lg">
              Tudo que você precisa para gerenciar sua clínica com eficiência.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementFeatures.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-border/50 p-6 hover:shadow-lg hover:border-[hsl(168,76%,36%)]/20 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-[hsl(168,76%,90%)] flex items-center justify-center mb-4 group-hover:bg-[hsl(168,76%,36%)] transition-colors">
                  <f.icon className="h-6 w-6 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[hsl(215,28%,17%)] mb-2">{f.title}</h3>
                <p className="text-sm text-[hsl(215,15%,50%)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Extra Features Marquee ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] text-center mb-10">
            Descubra como nosso software pode revolucionar sua clínica
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {extraFeatures.map((f, i) => (
              <div key={i} className="text-center p-5 rounded-xl border border-border/40 hover:border-[hsl(168,76%,36%)]/30 hover:shadow-md transition-all">
                <f.icon className="h-8 w-8 text-[hsl(168,76%,36%)] mx-auto mb-3" />
                <h4 className="font-semibold text-sm text-[hsl(215,28%,17%)] mb-1">{f.title}</h4>
                <p className="text-xs text-[hsl(215,15%,50%)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-3">
              Planos simples e transparentes
            </h2>
            <p className="text-[hsl(215,15%,50%)] text-lg">
              Comece com 3 dias grátis. Cancele quando quiser.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {planos?.map((plano: any) => {
              const isHighlighted = plano.destaque;
              return (
                <Card
                  key={plano.id}
                  className={`relative flex flex-col rounded-2xl ${
                    isHighlighted
                      ? 'border-[hsl(168,76%,36%)] border-2 shadow-xl shadow-[hsl(168,76%,36%)]/10 scale-[1.02]'
                      : 'border-border'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[hsl(168,76%,36%)] text-white px-4 py-1 rounded-full">
                        <Zap className="h-3 w-3 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-2 ${isHighlighted ? 'text-[hsl(168,76%,36%)]' : 'text-[hsl(215,15%,50%)]'}`}>
                      {planIcons[plano.slug]}
                    </div>
                    <CardTitle className="text-2xl text-[hsl(215,28%,17%)]">{plano.nome}</CardTitle>
                    <p className="text-sm text-[hsl(215,15%,50%)]">{plano.descricao}</p>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="mb-2">
                      <span className="text-sm text-[hsl(215,15%,50%)]">R$ </span>
                      <span className="text-4xl font-extrabold text-[hsl(215,28%,17%)]">{Math.floor(plano.valor)}</span>
                      <span className="text-[hsl(215,15%,50%)]">/mês</span>
                    </div>
                    <p className="text-xs text-[hsl(168,76%,36%)] font-semibold mb-6">🎁 {plano.trial_dias || 3} dias grátis</p>
                    <ul className="space-y-2 text-left">
                      {(plano.features as string[]).slice(0, 10).map((feature: string) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)] shrink-0" />
                          <span className="text-[hsl(215,28%,17%)]">{featureLabels[feature] || feature}</span>
                        </li>
                      ))}
                      {(plano.features as string[]).length > 10 && (
                        <li className="text-xs text-[hsl(215,15%,50%)] pl-6">
                          + {(plano.features as string[]).length - 10} recursos adicionais
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button
                      className={`w-full h-12 text-base rounded-full ${
                        isHighlighted
                          ? 'bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0'
                          : 'bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white border-0'
                      }`}
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

      {/* ─── CTA Section ─── */}
      <section className="py-20 px-4 bg-[hsl(168,76%,36%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-white mb-4">
            Assista uma demonstração grátis
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Ainda em dúvida? Veja como o EloLab pode melhorar a sua clínica!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 rounded-full text-base px-8 h-12 shadow-lg"
              onClick={() => scrollTo('pricing')}
            >
              Testar Grátis 3 Dias <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-full text-base px-8 h-12"
              onClick={() => navigate('/auth')}
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Ver demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[hsl(215,28%,17%)] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-[hsl(168,76%,36%)]" />
                <span className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                  elo<span className="text-[hsl(168,76%,36%)]">lab</span>
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Software de gestão completo para clínicas e consultórios médicos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Produto</h4>
              <div className="space-y-2 text-sm text-white/60">
                <button onClick={() => scrollTo('features')} className="block hover:text-white transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white transition-colors">Planos</button>
                <button onClick={() => scrollTo('testimonials')} className="block hover:text-white transition-colors">Depoimentos</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Acesso</h4>
              <div className="space-y-2 text-sm text-white/60">
                <button onClick={() => navigate('/auth')} className="block hover:text-white transition-colors">Login</button>
                <a href="mailto:contato@elolab.com.br" className="block hover:text-white transition-colors">Contato</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Software de acordo com as normas da LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Checkout Dialog ─── */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Assine o {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>
              Preencha seus dados e escolha como deseja começar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Nome da Clínica</Label>
                <Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} placeholder="Clínica São Lucas" />
              </div>
            </div>

            {/* Plan summary */}
            <div className="bg-[hsl(168,76%,95%)] rounded-xl p-4 border border-[hsl(168,76%,36%)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[hsl(215,28%,17%)]">{selectedPlan?.nome}</p>
                  <p className="text-sm text-[hsl(215,15%,50%)]">
                    {selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-[hsl(168,76%,36%)] text-white text-xs">
                    {selectedPlan?.trial_dias || 3} dias grátis
                  </Badge>
                </div>
              </div>
            </div>

            {/* Two action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handleCheckout('trial')}
                disabled={checkoutMutation.isPending}
                variant="outline"
                className="h-14 flex flex-col items-center justify-center gap-0.5 border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10 rounded-xl"
              >
                <span className="text-sm font-bold">
                  {checkoutMutation.isPending ? 'Processando...' : 'Testar 3 dias grátis'}
                </span>
                <span className="text-[10px] font-normal opacity-70">Sem cartão de crédito</span>
              </Button>
              <Button
                onClick={() => handleCheckout('buy')}
                disabled={checkoutMutation.isPending}
                className="h-14 flex flex-col items-center justify-center gap-0.5 bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 rounded-xl"
              >
                <span className="text-sm font-bold">
                  {checkoutMutation.isPending ? 'Processando...' : 'Comprar agora'}
                </span>
                <span className="text-[10px] font-normal opacity-80">Pagamento via Mercado Pago</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
