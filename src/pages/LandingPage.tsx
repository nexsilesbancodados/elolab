import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Check, Crown, Sparkles, Zap, Shield, Calendar, Users, FileText,
  Stethoscope, BarChart3, Bot, ArrowRight, Star, ChevronRight,
  Heart, Clock, Smartphone, LogIn, PlayCircle, DollarSign, Package,
  ClipboardList, Monitor, Brain, MessageSquare, HeadphonesIcon,
  CheckCircle2, Phone, Mail, MapPin,
} from 'lucide-react';
import doctorHero from '@/assets/doctor-hero.webp';
import dashboardMockup from '@/assets/dashboard-mockup.webp';
import doctorTablet from '@/assets/doctor-tablet.webp';
import clinicReception from '@/assets/clinic-reception.webp';
import whatsappAi from '@/assets/whatsapp-ai.webp';
import logoInovalab from '@/assets/logo-inovalab.jpeg';

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

const testimonials = [
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o InovaLab. O prontuário eletrônico é incrível e a equipe de suporte é sensacional!' },
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
          <span className="hidden sm:inline flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Software de acordo com as normas da LGPD
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <a href="mailto:contato@inovalab.com.br" className="hidden sm:flex items-center gap-1.5 hover:underline text-white/90">
              <Mail className="h-3.5 w-3.5" /> contato@inovalab.com.br
            </a>
            <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 hover:underline font-medium">
              <LogIn className="h-4 w-4" /> Entrar no InovaLab
            </button>
          </div>
        </div>
      </div>

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={logoInovalab} alt="InovaLab" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)]">
              INOVA<span className="text-[hsl(168,76%,36%)]">LAB</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[hsl(215,15%,50%)]">
            <button onClick={() => scrollTo('features')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Funcionalidades</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Planos</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-[hsl(168,76%,36%)] transition-colors">Depoimentos</button>
            <button onClick={() => scrollTo('whatsapp-ai')} className="hover:text-[hsl(168,76%,36%)] transition-colors">IA WhatsApp</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10" onClick={() => scrollTo('pricing')}>
              Ver planos
            </Button>
            <Button size="sm" className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 shadow-md" onClick={() => scrollTo('pricing')}>
              Testar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[hsl(168,60%,97%)] to-white">
        <div className="absolute top-20 right-[30%] w-64 h-64 bg-[hsl(40,90%,55%)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[10%] w-80 h-80 bg-[hsl(168,76%,36%)]/8 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-[hsl(168,76%,90%)] text-[hsl(168,76%,30%)] hover:bg-[hsl(168,76%,85%)] px-4 py-1.5 text-sm font-medium">
                🎉 Teste grátis por 3 dias — sem cartão de crédito
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] text-[hsl(215,28%,17%)] font-['Plus_Jakarta_Sans']">
                Software completo para <span className="text-[hsl(168,76%,36%)]">clínicas</span> e <span className="text-[hsl(168,76%,36%)]">consultórios</span>
              </h1>
              <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed max-w-lg">
                Agenda, prontuário eletrônico, financeiro, WhatsApp com IA e muito mais. Tudo em um só lugar para transformar a gestão da sua clínica.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 shadow-lg text-base px-8 h-13 rounded-full"
                  onClick={() => scrollTo('pricing')}
                >
                  Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10 rounded-full"
                  onClick={() => scrollTo('features')}
                >
                  <PlayCircle className="mr-2 h-5 w-5" /> Ver funcionalidades
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2 text-sm text-[hsl(215,15%,50%)]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Sem fidelidade</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Suporte dedicado</span>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(168,76%,36%)]/10 to-[hsl(40,90%,55%)]/10 rounded-3xl blur-2xl" />
              <img
                src={dashboardMockup}
                alt="Dashboard do InovaLab em laptop e tablet mostrando agenda e analytics"
                className="relative z-10 w-full max-w-xl rounded-2xl shadow-2xl border border-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative bg-[hsl(168,76%,36%)] py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] mb-1">{s.value}</div>
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
              <Button variant="outline" className="border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/10 rounded-full" onClick={() => scrollTo('pricing')}>
                Conheça nossos planos <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureCards.map((f, i) => (
                <div key={i} className="group bg-white border border-border/60 rounded-xl p-5 hover:shadow-lg hover:border-[hsl(168,76%,36%)]/30 transition-all duration-300">
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

      {/* ─── Prontuário Section with Image ─── */}
      <section className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[hsl(168,76%,90%)] text-[hsl(168,76%,30%)] mb-4 text-xs">PRONTUÁRIO ELETRÔNICO</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-6">
              Prontuário eletrônico completo e seguro
            </h2>
            <p className="text-[hsl(215,15%,50%)] mb-8 leading-relaxed">
              Centralize os dados clínicos dos seus pacientes com segurança e agilidade. Acesse de qualquer lugar.
            </p>
            <div className="space-y-5">
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
            <Button className="mt-8 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-full" onClick={() => scrollTo('pricing')}>
              Conheça o Prontuário <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 bg-[hsl(168,76%,36%)]/5 rounded-3xl blur-xl" />
            <img
              src={doctorTablet}
              alt="Médica utilizando prontuário eletrônico InovaLab no tablet"
              className="relative z-10 w-full rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* ─── Clinic Reception / Painel TV Section ─── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(40,90%,55%)]/8 to-[hsl(168,76%,36%)]/5 rounded-[2rem] blur-2xl" />
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <img
                src={clinicReception}
                alt="Recepção de clínica moderna com painel TV do InovaLab"
                className="w-full object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <Badge className="bg-[hsl(40,90%,92%)] text-[hsl(40,80%,32%)] hover:bg-[hsl(40,90%,88%)] px-4 py-1.5 text-xs font-semibold tracking-wide uppercase border-0">
              Experiência do Paciente
            </Badge>
            <h2 className="text-3xl sm:text-[2.6rem] font-extrabold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] leading-[1.12]">
              Modernize a recepção da sua clínica
            </h2>
            <p className="text-[hsl(215,15%,45%)] text-base leading-relaxed max-w-md">
              Painel TV em tempo real, fila de atendimento digital e check-in automatizado para uma experiência premium ao paciente.
            </p>
            <div className="space-y-5 pt-2">
              {[
                { icon: Monitor, text: 'Painel TV com fila de atendimento em tempo real' },
                { icon: Clock, text: 'Redução de até 60% no tempo de espera' },
                { icon: Smartphone, text: 'Check-in digital via smartphone' },
                { icon: Users, text: 'Triagem Manchester automatizada' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[hsl(40,90%,93%)] flex items-center justify-center shrink-0 shadow-sm">
                    <item.icon className="h-5 w-5 text-[hsl(40,80%,40%)]" />
                  </div>
                  <span className="text-[15px] font-medium text-[hsl(215,28%,17%)]">{item.text}</span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-4 bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 rounded-full shadow-lg shadow-[hsl(40,90%,55%)]/25 px-8 h-12 text-base font-semibold"
              onClick={() => scrollTo('pricing')}
            >
              Começar agora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── WhatsApp AI Section ─── */}
      <section id="whatsapp-ai" className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[hsl(142,70%,90%)] text-[hsl(142,70%,30%)] mb-4 text-xs">🤖 INTELIGÊNCIA ARTIFICIAL</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-6">
              Agente IA no WhatsApp que atende 24h
            </h2>
            <p className="text-[hsl(215,15%,50%)] mb-8 leading-relaxed">
              Seu consultório com atendimento automático via WhatsApp. Agendamentos, confirmações e respostas inteligentes — sem intervenção humana.
            </p>
            <div className="space-y-4">
              {[
                { icon: Bot, text: 'Chatbot inteligente com IA avançada' },
                { icon: Calendar, text: 'Agendamento automático pelo WhatsApp' },
                { icon: MessageSquare, text: 'Respostas personalizadas para cada paciente' },
                { icon: Clock, text: 'Disponível 24h, 7 dias por semana' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[hsl(142,70%,90%)] flex items-center justify-center shrink-0">
                    <item.icon className="h-4.5 w-4.5 text-[hsl(142,70%,35%)]" />
                  </div>
                  <span className="text-sm font-medium text-[hsl(215,28%,17%)]">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-[hsl(142,70%,95%)] rounded-xl border border-[hsl(142,70%,80%)]">
              <p className="text-sm text-[hsl(142,70%,25%)] font-medium">
                💡 Exclusivo do plano <strong>InovaLab Ultra</strong> — potencialize seu atendimento com IA.
              </p>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute -inset-3 bg-[hsl(142,70%,50%)]/5 rounded-3xl blur-xl" />
            <img
              src={whatsappAi}
              alt="WhatsApp com agente IA do InovaLab fazendo agendamento automático"
              className="relative z-10 w-full max-w-sm rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* ─── Management Features Grid ─── */}
      <section id="management" className="py-20 px-4 bg-white">
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

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-3">
              O que os nossos clientes dizem
            </h2>
            <p className="text-[hsl(215,15%,50%)] text-lg max-w-xl mx-auto">
              Valorizamos o feedback dos nossos clientes. Veja o que eles dizem sobre o InovaLab.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[hsl(40,90%,55%)] text-[hsl(40,90%,55%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-[hsl(215,15%,40%)] mb-5 leading-relaxed italic">"{t.text}"</p>
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

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-[hsl(40,90%,90%)] text-[hsl(40,90%,35%)] mb-4 text-sm px-4 py-1">
              💰 Planos transparentes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-[hsl(215,28%,17%)] mb-3">
              Escolha o plano ideal para sua clínica
            </h2>
            <p className="text-[hsl(215,15%,50%)] text-lg">
              Comece com 3 dias grátis. Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {planos?.map((plano: any) => {
              const isHighlighted = plano.destaque;
              return (
                <Card
                  key={plano.id}
                  className={`relative flex flex-col rounded-2xl overflow-hidden ${
                    isHighlighted
                      ? 'border-[hsl(168,76%,36%)] border-2 shadow-2xl shadow-[hsl(168,76%,36%)]/15 scale-[1.02]'
                      : 'border-border shadow-lg'
                  }`}
                >
                  {isHighlighted && (
                    <div className="bg-[hsl(168,76%,36%)] text-white text-center py-2 text-sm font-semibold">
                      <Zap className="h-3.5 w-3.5 inline mr-1" /> MAIS POPULAR
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <div className={`mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center ${
                      isHighlighted ? 'bg-[hsl(168,76%,90%)] text-[hsl(168,76%,36%)]' : 'bg-[hsl(215,20%,95%)] text-[hsl(215,15%,50%)]'
                    }`}>
                      {planIcons[plano.slug]}
                    </div>
                    <CardTitle className="text-2xl text-[hsl(215,28%,17%)]">{plano.nome}</CardTitle>
                    <p className="text-sm text-[hsl(215,15%,50%)]">{plano.descricao}</p>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="mb-2">
                      <span className="text-sm text-[hsl(215,15%,50%)]">R$ </span>
                      <span className="text-5xl font-extrabold text-[hsl(215,28%,17%)]">{Math.floor(plano.valor)}</span>
                      <span className="text-[hsl(215,15%,50%)]">/mês</span>
                    </div>
                    <p className="text-xs text-[hsl(168,76%,36%)] font-semibold mb-6">🎁 {plano.trial_dias || 3} dias grátis para testar</p>
                    <ul className="space-y-2.5 text-left">
                      {(plano.features as string[]).slice(0, 12).map((feature: string) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)] shrink-0" />
                          <span className="text-[hsl(215,28%,17%)]">{featureLabels[feature] || feature}</span>
                        </li>
                      ))}
                      {(plano.features as string[]).length > 12 && (
                        <li className="text-xs text-[hsl(168,76%,36%)] font-medium pl-6">
                          + {(plano.features as string[]).length - 12} recursos adicionais
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto flex flex-col gap-2 px-6 pb-6">
                    <Button
                      className={`w-full h-12 text-base rounded-full ${
                        isHighlighted
                          ? 'bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 shadow-lg'
                          : 'bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white border-0'
                      }`}
                      onClick={() => handleSelectPlan(plano)}
                    >
                      Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-center text-[hsl(215,15%,60%)]">Sem compromisso · Cancele quando quiser</p>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Section with Hero Image ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={doctorHero} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(168,76%,30%)] to-[hsl(168,76%,25%)]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10 py-20 px-4">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans'] text-white mb-4">
            Comece a transformar sua clínica hoje
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Junte-se a milhares de médicos que já simplificaram a gestão do consultório com o InovaLab.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[hsl(40,90%,55%)] hover:bg-[hsl(40,90%,48%)] text-white border-0 rounded-full text-base px-8 h-12 shadow-lg"
              onClick={() => scrollTo('pricing')}
            >
              Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-full text-base px-8 h-12"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-2 h-5 w-5" /> Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[hsl(215,28%,17%)] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoInovalab} alt="InovaLab" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                  INOVA<span className="text-[hsl(168,76%,36%)]">LAB</span>
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-4">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <a href="mailto:contato@inovalab.com.br" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail className="h-3.5 w-3.5" /> contato@inovalab.com.br
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Produto</h4>
              <div className="space-y-2 text-sm text-white/60">
                <button onClick={() => scrollTo('features')} className="block hover:text-white transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('testimonials')} className="block hover:text-white transition-colors">Depoimentos</button>
                <button onClick={() => scrollTo('whatsapp-ai')} className="block hover:text-white transition-colors">IA WhatsApp</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white/90">Acesso</h4>
              <div className="space-y-2 text-sm text-white/60">
                <button onClick={() => navigate('/auth')} className="block hover:text-white transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white transition-colors">Criar conta</button>
                <a href="mailto:contato@inovalab.com.br" className="block hover:text-white transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <span>© {new Date().getFullYear()} InovaLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Software em conformidade com a LGPD
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

            <div className="bg-[hsl(168,76%,95%)] rounded-xl p-4 border border-[hsl(168,76%,36%)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[hsl(215,28%,17%)]">{selectedPlan?.nome}</p>
                  <p className="text-sm text-[hsl(215,15%,50%)]">
                    {selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês
                  </p>
                </div>
                <Badge className="bg-[hsl(168,76%,36%)] text-white text-xs">
                  {selectedPlan?.trial_dias || 3} dias grátis
                </Badge>
              </div>
            </div>

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
