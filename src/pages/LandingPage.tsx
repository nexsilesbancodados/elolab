import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2, Phone, Mail, MapPin, Menu, X, ChevronDown,
  Activity, Layers, Lock, TrendingUp, Award,
} from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.webp';
import doctorTablet from '@/assets/doctor-tablet.webp';
import clinicReception from '@/assets/clinic-reception.webp';
import whatsappAi from '@/assets/whatsapp-ai.webp';
import doctorHero from '@/assets/doctor-hero.webp';
import logoInovalab from '@/assets/logo-inovalab.jpeg';

/* ─── Animated counter hook ─── */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tabular-nums">
        {count.toLocaleString('pt-BR')}{suffix}
      </div>
      <div className="text-white/70 text-sm mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── data ─── */
const stats = [
  { value: 12, suffix: 'M+', label: 'Marcações agendadas' },
  { value: 3, suffix: 'M+', label: 'Pacientes atendidos' },
  { value: 10, suffix: 'K+', label: 'Médicos cadastrados' },
  { value: 500, suffix: '+', label: 'Clientes ativos' },
];

const featureCards = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática.', color: 'hsl(200,80%,50%)' },
  { icon: FileText, title: 'Prescrição digital', desc: 'Prescrições eletrônicas com assinatura digital e envio automático ao paciente.', color: 'hsl(160,84%,39%)' },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios.', color: 'hsl(38,92%,50%)' },
  { icon: ClipboardList, title: 'Laudos online', desc: 'Libere resultados de exames via web com total segurança e rastreabilidade.', color: 'hsl(280,65%,55%)' },
  { icon: BarChart3, title: 'Analytics avançado', desc: 'Dashboards com KPIs em tempo real para decisões baseadas em dados.', color: 'hsl(0,72%,51%)' },
  { icon: Package, title: 'Estoque integrado', desc: 'Controle a movimentação, validade e lotes de medicamentos e insumos.', color: 'hsl(174,60%,45%)' },
];

const managementFeatures = [
  { icon: Stethoscope, title: 'Prontuário eletrônico', desc: 'Centralize dados clínicos com segurança LGPD.' },
  { icon: Activity, title: 'Triagem Manchester', desc: 'Classifique riscos com protocolo internacional.' },
  { icon: Monitor, title: 'Painel TV', desc: 'Fila de atendimento em tempo real na recepção.' },
  { icon: Users, title: 'Gestão de equipe', desc: 'Médicos, funcionários e convites por e-mail.' },
  { icon: Layers, title: 'Templates', desc: 'Documentos reutilizáveis para agilizar consultas.' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Chatbot 24h com agendamento automático.' },
];

const testimonials = [
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o InovaLab. O prontuário eletrônico é incrível e a equipe de suporte é sensacional!', avatar: '👩‍⚕️' },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço, meus pacientes adoram.', avatar: '👨‍⚕️' },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente o fluxo da clínica. Recomendo muito!', avatar: '👩‍⚕️' },
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

/* ─── Scroll-reveal wrapper ─── */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', clinica: '' });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[hsl(215,28%,17%)] font-['Inter',system-ui,sans-serif] overflow-x-hidden">

      {/* ═══════════════ TOP BAR ═══════════════ */}
      <div className="bg-[hsl(168,76%,32%)] text-white text-[13px] py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:flex items-center gap-2 font-medium">
            <Shield className="h-3.5 w-3.5" /> Em conformidade com a LGPD
          </span>
          <div className="flex items-center gap-5 ml-auto">
            <a href="mailto:contato@inovalab.com.br" className="hidden md:flex items-center gap-1.5 hover:text-white/100 text-white/80 transition-colors">
              <Mail className="h-3.5 w-3.5" /> contato@inovalab.com.br
            </a>
            <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 font-semibold hover:text-white/100 text-white/90 transition-colors">
              <LogIn className="h-4 w-4" /> Acessar sistema
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/98 backdrop-blur-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.08)]' : 'bg-white/90 backdrop-blur'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-2.5">
            <img src={logoInovalab} alt="InovaLab" className="h-10 w-10 rounded-xl object-contain shadow-sm" />
            <span className="text-[22px] font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight">
              <span className="text-[hsl(215,28%,17%)]">INOVA</span>
              <span className="text-[hsl(168,76%,36%)]">LAB</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Funcionalidades', id: 'features' },
              { label: 'Prontuário', id: 'prontuario' },
              { label: 'WhatsApp IA', id: 'whatsapp-ai' },
              { label: 'Depoimentos', id: 'testimonials' },
              { label: 'Planos', id: 'pricing' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-4 py-2 text-sm font-medium text-[hsl(215,15%,45%)] hover:text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)] rounded-lg transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)] font-semibold"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-md shadow-[hsl(168,76%,36%)]/20 font-semibold px-5"
              onClick={() => scrollTo('pricing')}
            >
              Começar grátis
            </Button>
            <button className="lg:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t bg-white px-4 pb-4 pt-2 space-y-1 animate-fade-in">
            {['features', 'prontuario', 'whatsapp-ai', 'testimonials', 'pricing'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left px-4 py-3 text-sm font-medium text-[hsl(215,15%,40%)] hover:bg-[hsl(168,76%,96%)] rounded-lg capitalize">
                {id.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(168,60%,97%)] via-white to-[hsl(200,60%,97%)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(168,76%,36%)]/[0.04] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(40,90%,55%)]/[0.06] rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/[0.08] border border-[hsl(168,76%,36%)]/20 text-[hsl(168,76%,30%)] rounded-full px-4 py-2 text-sm font-semibold">
                  <span className="flex h-2 w-2 rounded-full bg-[hsl(168,76%,36%)] animate-pulse" />
                  Teste grátis por 3 dias — sem cartão
                </div>

                <h1 className="text-[2.5rem] sm:text-[3.2rem] lg:text-[3.8rem] font-extrabold leading-[1.08] tracking-tight font-['Plus_Jakarta_Sans']">
                  Gestão clínica e{' '}
                  <span className="relative">
                    <span className="relative z-10 text-[hsl(168,76%,36%)]">prontuário eletrônico</span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 bg-[hsl(168,76%,36%)]/10 -z-0 rounded" />
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-[hsl(215,15%,42%)] leading-relaxed max-w-[520px]">
                  Conquiste uma gestão clínica de excelência com um software médico feito para você. Agenda, financeiro, IA e muito mais.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Button
                    size="lg"
                    className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-xl shadow-[hsl(168,76%,36%)]/25 text-base px-8 h-14 rounded-xl font-semibold group"
                    onClick={() => scrollTo('pricing')}
                  >
                    Quero testar gratuitamente
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[hsl(215,15%,80%)] text-[hsl(215,15%,40%)] hover:bg-[hsl(210,40%,97%)] rounded-xl h-14 font-medium"
                    onClick={() => scrollTo('features')}
                  >
                    <PlayCircle className="mr-2 h-5 w-5 text-[hsl(168,76%,36%)]" /> Conheça as funcionalidades
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-[hsl(215,15%,45%)]">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Sem fidelidade</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Suporte humano</span>
                  <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-[hsl(168,76%,36%)]" /> LGPD</span>
                </div>
              </div>
            </Reveal>

            <Reveal className="delay-200">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-[hsl(168,76%,36%)]/8 to-[hsl(200,80%,50%)]/8 rounded-[2rem] blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 p-2 ring-1 ring-black/[0.04]">
                  <img
                    src={dashboardMockup}
                    alt="Dashboard do InovaLab em laptop e tablet mostrando agenda e analytics"
                    className="w-full rounded-xl"
                    loading="eager"
                  />
                </div>
                {/* Floating badges */}
                <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg shadow-black/10 px-4 py-3 flex items-center gap-3 animate-bounce-subtle">
                  <div className="h-10 w-10 rounded-full bg-[hsl(160,84%,39%)]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[hsl(160,84%,39%)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(215,15%,50%)]">Receita mensal</p>
                    <p className="text-sm font-bold text-[hsl(160,84%,39%)]">+27%</p>
                  </div>
                </div>
                <div className="absolute -right-3 bottom-1/4 bg-white rounded-xl shadow-lg shadow-black/10 px-4 py-3 flex items-center gap-3 animate-bounce-subtle" style={{ animationDelay: '1s' }}>
                  <div className="h-10 w-10 rounded-full bg-[hsl(200,80%,50%)]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[hsl(200,80%,50%)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(215,15%,50%)]">Pacientes hoje</p>
                    <p className="text-sm font-bold">48</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUSTED BY / STATS ═══════════════ */}
      <section className="relative bg-[hsl(215,28%,14%)] py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(168,76%,36%)]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(200,80%,50%)]/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative">
          <p className="text-center text-white/50 text-sm font-medium tracking-wider uppercase mb-10">
            Números que comprovam nosso impacto
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <AnimatedStat key={i} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <Badge className="bg-[hsl(168,76%,36%)]/10 text-[hsl(168,76%,30%)] border-[hsl(168,76%,36%)]/20 mb-4 text-sm font-semibold px-4 py-1.5">
                Funcionalidades
              </Badge>
              <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-4">
                Tudo que sua clínica precisa,{' '}
                <span className="text-[hsl(168,76%,36%)]">em um só lugar</span>
              </h2>
              <p className="text-[hsl(215,15%,45%)] text-lg leading-relaxed">
                Ferramentas profissionais para otimizar cada etapa da gestão, do agendamento ao faturamento.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((f, i) => (
              <Reveal key={i} className={`delay-[${i * 100}ms]`}>
                <div className="group relative bg-white border border-[hsl(220,13%,91%)] rounded-2xl p-6 hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300 h-full">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.color}10` }}
                  >
                    <f.icon className="h-6 w-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-[17px] mb-2">{f.title}</h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: f.color }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRONTUÁRIO SECTION ═══════════════ */}
      <section id="prontuario" className="py-24 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <Badge className="bg-[hsl(168,76%,36%)]/10 text-[hsl(168,76%,30%)] border-[hsl(168,76%,36%)]/20 mb-5 text-xs font-semibold px-3 py-1">
                PRONTUÁRIO ELETRÔNICO
              </Badge>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-5">
                Prontuário completo,{' '}
                <span className="text-[hsl(168,76%,36%)]">seguro e acessível</span>
              </h2>
              <p className="text-[hsl(215,15%,42%)] text-base leading-relaxed mb-8 max-w-lg">
                Centralize todas as informações clínicas com segurança. Acesse anamnese, prescrições, atestados e exames de qualquer dispositivo.
              </p>
              <div className="space-y-5">
                {[
                  { icon: FileText, title: 'Histórico completo', desc: 'Anamnese, documentos, laudos, atestados e prescrições em um só lugar.' },
                  { icon: Lock, title: 'Segurança LGPD', desc: 'Consentimento digital, rastreabilidade e criptografia de dados.' },
                  { icon: Smartphone, title: 'Acesso remoto', desc: 'Consulte prontuários de qualquer lugar pelo celular ou tablet.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(168,76%,36%)]/10 flex items-center justify-center shrink-0 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] mb-0.5">{item.title}</h4>
                      <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="mt-8 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-xl h-12 px-6 shadow-lg shadow-[hsl(168,76%,36%)]/20 font-semibold"
                onClick={() => scrollTo('pricing')}
              >
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Reveal>
          <Reveal className="delay-200">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(168,76%,36%)]/8 to-transparent rounded-[2rem] blur-2xl" />
              <img
                src={doctorTablet}
                alt="Médica utilizando prontuário eletrônico InovaLab no tablet"
                className="relative z-10 w-full rounded-2xl shadow-2xl shadow-black/15 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ CLINIC RECEPTION / PAINEL TV ═══════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(40,90%,55%)]/6 to-[hsl(168,76%,36%)]/4 rounded-[2rem] blur-2xl" />
              <img
                src={clinicReception}
                alt="Recepção moderna com painel TV do InovaLab"
                className="relative z-10 w-full rounded-2xl shadow-2xl shadow-black/15 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2 delay-200">
            <div className="space-y-6">
              <Badge className="bg-[hsl(40,90%,92%)] text-[hsl(40,80%,30%)] border-[hsl(40,90%,60%)]/30 text-xs font-semibold tracking-wide uppercase px-3 py-1">
                Experiência do Paciente
              </Badge>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight">
                Modernize a{' '}
                <span className="text-[hsl(40,85%,48%)]">recepção</span>{' '}
                da sua clínica
              </h2>
              <p className="text-[hsl(215,15%,42%)] leading-relaxed max-w-md">
                Painel TV em tempo real, fila de atendimento digital e check-in automatizado para uma experiência premium.
              </p>
              <div className="space-y-4 pt-2">
                {[
                  { icon: Monitor, text: 'Painel TV com fila em tempo real', color: 'hsl(200,80%,50%)' },
                  { icon: Clock, text: 'Redução de 60% no tempo de espera', color: 'hsl(38,92%,50%)' },
                  { icon: Smartphone, text: 'Check-in digital via smartphone', color: 'hsl(160,84%,39%)' },
                  { icon: Activity, text: 'Triagem Manchester automatizada', color: 'hsl(0,72%,51%)' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}12` }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-[15px] font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                className="mt-2 bg-[hsl(40,90%,52%)] hover:bg-[hsl(40,90%,45%)] text-white rounded-xl shadow-lg shadow-[hsl(40,90%,55%)]/20 px-7 h-12 font-semibold"
                onClick={() => scrollTo('pricing')}
              >
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ WHATSAPP AI ═══════════════ */}
      <section id="whatsapp-ai" className="py-24 px-4 bg-gradient-to-br from-[hsl(142,60%,97%)] to-[hsl(168,50%,97%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <Badge className="bg-[hsl(142,70%,90%)] text-[hsl(142,70%,28%)] border-[hsl(142,70%,60%)]/30 mb-5 text-xs font-semibold">
                🤖 INTELIGÊNCIA ARTIFICIAL
              </Badge>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-5">
                Agente IA no WhatsApp{' '}
                <span className="text-[hsl(142,70%,35%)]">que atende 24h</span>
              </h2>
              <p className="text-[hsl(215,15%,42%)] text-base leading-relaxed mb-8 max-w-lg">
                Agendamentos, confirmações e respostas inteligentes — tudo automatizado, sem intervenção humana. Seus pacientes vão adorar.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Bot, text: 'Chatbot inteligente com IA avançada' },
                  { icon: Calendar, text: 'Agendamento automático pelo WhatsApp' },
                  { icon: MessageSquare, text: 'Respostas personalizadas para cada paciente' },
                  { icon: Clock, text: 'Disponível 24h, 7 dias por semana' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(142,70%,90%)] flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(142,70%,35%)]" />
                    </div>
                    <span className="text-[15px] font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 p-4 bg-white rounded-xl border border-[hsl(142,70%,75%)]/40 shadow-sm">
                <p className="text-sm text-[hsl(142,70%,25%)] font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(40,90%,50%)]" />
                  Exclusivo do plano <strong>InovaLab Ultra</strong>
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal className="delay-200">
            <div className="relative flex justify-center">
              <div className="absolute -inset-6 bg-[hsl(142,70%,50%)]/5 rounded-[2.5rem] blur-2xl" />
              <img
                src={whatsappAi}
                alt="WhatsApp com agente IA do InovaLab"
                className="relative z-10 w-full max-w-[360px] rounded-[2rem] shadow-2xl shadow-black/15 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ MANAGEMENT GRID ═══════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-4">
                Simplifique a gestão do seu{' '}
                <span className="text-[hsl(168,76%,36%)]">consultório</span>
              </h2>
              <p className="text-[hsl(215,15%,45%)] text-lg">
                Módulos completos para cada área da sua clínica.
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {managementFeatures.map((f, i) => (
              <Reveal key={i}>
                <div className="group bg-[hsl(210,40%,98%)] hover:bg-white rounded-2xl border border-transparent hover:border-[hsl(220,13%,91%)] p-6 hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-[hsl(168,76%,36%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                    <f.icon className="h-6 w-6 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-[16px] mb-1.5">{f.title}</h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="py-24 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <Badge className="bg-[hsl(40,90%,92%)] text-[hsl(40,80%,30%)] border-[hsl(40,90%,60%)]/30 mb-4 text-sm font-semibold px-4 py-1.5">
                <Star className="h-3.5 w-3.5 mr-1.5 fill-current" /> Depoimentos
              </Badge>
              <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-4">
                Quem usa, <span className="text-[hsl(168,76%,36%)]">recomenda</span>
              </h2>
              <p className="text-[hsl(215,15%,45%)] text-lg">
                Veja o que profissionais de saúde dizem sobre o InovaLab.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={i}>
                <Card className="border-transparent bg-white shadow-sm hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-7">
                    <div className="flex gap-0.5 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[hsl(40,90%,55%)] text-[hsl(40,90%,55%)]" />
                      ))}
                    </div>
                    <p className="text-[15px] text-[hsl(215,15%,35%)] mb-6 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-[hsl(220,13%,93%)]">
                      <div className="h-11 w-11 rounded-full bg-[hsl(168,76%,36%)]/10 flex items-center justify-center text-lg">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-[hsl(168,76%,36%)] font-medium">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="bg-[hsl(168,76%,36%)]/10 text-[hsl(168,76%,30%)] border-[hsl(168,76%,36%)]/20 mb-4 text-sm font-semibold px-4 py-1.5">
                Planos e preços
              </Badge>
              <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-['Plus_Jakarta_Sans'] leading-tight mb-4">
                Escolha o plano ideal para{' '}
                <span className="text-[hsl(168,76%,36%)]">sua clínica</span>
              </h2>
              <p className="text-[hsl(215,15%,45%)] text-lg max-w-lg mx-auto">
                Comece com 3 dias grátis. Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {planos?.map((plano: any) => {
              const isHighlighted = plano.destaque;
              return (
                <Reveal key={plano.id}>
                  <Card
                    className={`relative flex flex-col rounded-2xl overflow-hidden h-full ${
                      isHighlighted
                        ? 'border-2 border-[hsl(168,76%,36%)] shadow-2xl shadow-[hsl(168,76%,36%)]/12 scale-[1.02]'
                        : 'border border-[hsl(220,13%,91%)] shadow-lg hover:shadow-xl transition-shadow'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,30%)] text-white text-center py-2.5 text-sm font-bold tracking-wide">
                        <Zap className="h-3.5 w-3.5 inline mr-1.5" /> MAIS POPULAR
                      </div>
                    )}
                    <CardHeader className="text-center pb-2 pt-8">
                      <div className={`mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ${
                        isHighlighted ? 'bg-[hsl(168,76%,36%)]/10 text-[hsl(168,76%,36%)]' : 'bg-[hsl(215,20%,95%)] text-[hsl(215,15%,45%)]'
                      }`}>
                        {planIcons[plano.slug]}
                      </div>
                      <CardTitle className="text-2xl font-extrabold">{plano.nome}</CardTitle>
                      <p className="text-sm text-[hsl(215,15%,50%)] mt-1">{plano.descricao}</p>
                    </CardHeader>
                    <CardContent className="text-center pb-4">
                      <div className="mb-3 pt-2">
                        <span className="text-sm text-[hsl(215,15%,50%)] align-top">R$ </span>
                        <span className="text-[3.5rem] font-extrabold leading-none tracking-tight">{Math.floor(plano.valor)}</span>
                        <span className="text-[hsl(215,15%,50%)] text-base">/mês</span>
                      </div>
                      <p className="text-xs text-[hsl(168,76%,36%)] font-bold mb-7">
                        🎁 {plano.trial_dias || 3} dias grátis para testar
                      </p>
                      <ul className="space-y-3 text-left">
                        {(plano.features as string[]).slice(0, 12).map((feature: string) => (
                          <li key={feature} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)] shrink-0" />
                            <span className="font-medium">{featureLabels[feature] || feature}</span>
                          </li>
                        ))}
                        {(plano.features as string[]).length > 12 && (
                          <li className="text-xs text-[hsl(168,76%,36%)] font-bold pl-[26px]">
                            + {(plano.features as string[]).length - 12} recursos adicionais
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter className="mt-auto flex flex-col gap-2 px-6 pb-7">
                      <Button
                        className={`w-full h-13 text-base rounded-xl font-bold ${
                          isHighlighted
                            ? 'bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-lg shadow-[hsl(168,76%,36%)]/20'
                            : 'bg-[hsl(215,28%,17%)] hover:bg-[hsl(215,28%,12%)] text-white'
                        }`}
                        onClick={() => handleSelectPlan(plano)}
                      >
                        Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-xs text-center text-[hsl(215,15%,55%)] mt-1">Sem compromisso · Cancele quando quiser</p>
                    </CardFooter>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(168,76%,32%)] via-[hsl(168,76%,28%)] to-[hsl(215,28%,17%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-[hsl(40,90%,55%)]/[0.06] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10 py-24 px-4">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm text-white/80 font-medium mb-6">
              <Award className="h-4 w-4" /> +500 clínicas já confiam no InovaLab
            </div>
            <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-['Plus_Jakarta_Sans'] text-white leading-tight mb-5">
              Comece a transformar sua clínica hoje
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Junte-se a milhares de médicos que já simplificaram a gestão do consultório com o InovaLab.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[hsl(168,76%,32%)] hover:bg-white/95 rounded-xl text-base px-8 h-14 shadow-xl font-bold"
                onClick={() => scrollTo('pricing')}
              >
                Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl text-base px-8 h-14 font-medium"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="mr-2 h-5 w-5" /> Já tenho conta
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[hsl(215,28%,12%)] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <img src={logoInovalab} alt="InovaLab" className="h-10 w-10 rounded-xl object-contain" />
                <span className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight">
                  INOVA<span className="text-[hsl(168,76%,36%)]">LAB</span>
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/40">
                <a href="mailto:contato@inovalab.com.br" className="flex items-center gap-2 hover:text-white/80 transition-colors">
                  <Mail className="h-4 w-4" /> contato@inovalab.com.br
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white/80 uppercase tracking-wider">Produto</h4>
              <div className="space-y-3 text-sm text-white/50">
                <button onClick={() => scrollTo('features')} className="block hover:text-white/90 transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white/90 transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('testimonials')} className="block hover:text-white/90 transition-colors">Depoimentos</button>
                <button onClick={() => scrollTo('whatsapp-ai')} className="block hover:text-white/90 transition-colors">IA WhatsApp</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white/80 uppercase tracking-wider">Acesso</h4>
              <div className="space-y-3 text-sm text-white/50">
                <button onClick={() => navigate('/auth')} className="block hover:text-white/90 transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white/90 transition-colors">Criar conta grátis</button>
                <a href="mailto:contato@inovalab.com.br" className="block hover:text-white/90 transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <span>© {new Date().getFullYear()} InovaLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Software em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ CHECKOUT DIALOG ═══════════════ */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Assine o {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>
              Preencha seus dados e escolha como deseja começar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Nome completo *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Nome da Clínica</Label>
                <Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} placeholder="Clínica São Lucas" className="rounded-xl" />
              </div>
            </div>

            <div className="bg-[hsl(168,76%,95%)] rounded-xl p-4 border border-[hsl(168,76%,36%)]/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedPlan?.nome}</p>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    {selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês
                  </p>
                </div>
                <Badge className="bg-[hsl(168,76%,36%)] text-white text-xs font-bold">
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
                  {checkoutMutation.isPending ? 'Processando...' : 'Testar grátis'}
                </span>
                <span className="text-[10px] font-normal opacity-70">Sem cartão de crédito</span>
              </Button>
              <Button
                onClick={() => handleCheckout('buy')}
                disabled={checkoutMutation.isPending}
                className="h-14 flex flex-col items-center justify-center gap-0.5 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-xl font-bold"
              >
                <span className="text-sm font-bold">
                  {checkoutMutation.isPending ? 'Processando...' : 'Comprar agora'}
                </span>
                <span className="text-[10px] font-normal opacity-80">Via Mercado Pago</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
