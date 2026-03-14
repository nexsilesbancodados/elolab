import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EloLabNavbar } from '@/components/blocks/EloLabNavbar';
import { ModernPricingSection } from '@/components/ui/animated-glassy-pricing';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Crown, Sparkles, Zap, Shield, Calendar, Users, FileText,
  Stethoscope, BarChart3, Bot, ArrowRight, Star,
  Heart, Clock, Smartphone, LogIn, PlayCircle, DollarSign, Mail,
  ClipboardList, Monitor, MessageSquare,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Activity, Layers, Lock, Award,
  MousePointerClick, Rocket, Settings2, Phone, Globe, TrendingUp
} from 'lucide-react';
import heroInstitutional from '@/assets/hero-institutional.png';
import doctorTablet from '@/assets/doctor-tablet.png';
import clinicReception from '@/assets/clinic-reception.png';
import whatsappAi from '@/assets/whatsapp-ai.png';
import logoInovalab from '@/assets/logo-icon.png';
import dashboardPreview from '@/assets/dashboard-preview.png';
import doctorUsingTablet from '@/assets/doctor-using-tablet.png';
import clinicWaitingRoom from '@/assets/clinic-waiting-room.png';
import medicalTeam from '@/assets/medical-team.png';
import whatsappPhone from '@/assets/whatsapp-phone.png';
import bannerWideClinic from '@/assets/banner-wide-clinic.png';
import carouselClinic1 from '@/assets/carousel-clinic-1.png';
import carouselDoctor2 from '@/assets/carousel-doctor-2.png';
import carouselTeam3 from '@/assets/carousel-team-3.png';

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

function AnimatedStat({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center group">
      <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-[hsl(168,76%,36%)]/10 flex items-center justify-center group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
        <Icon className="h-6 w-6 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
      </div>
      <div className="text-4xl sm:text-5xl font-extrabold font-display tabular-nums text-[hsl(215,28%,17%)]">
        {count.toLocaleString('pt-BR')}<span className="text-[hsl(168,76%,36%)]">{suffix}</span>
      </div>
      <div className="text-[hsl(215,15%,50%)] text-sm mt-2 font-medium">{label}</div>
    </div>
  );
}

/* ─── Scroll-reveal with different effects ─── */
function Reveal({ children, className = '', delay = 0, effect = 'up' }: {
  children: React.ReactNode; className?: string; delay?: number;
  effect?: 'up' | 'left' | 'right' | 'zoom' | 'fade';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const hiddenClass = {
    up: 'opacity-0 translate-y-10',
    left: 'opacity-0 -translate-x-10',
    right: 'opacity-0 translate-x-10',
    zoom: 'opacity-0 scale-90',
    fade: 'opacity-0',
  }[effect];

  const visibleClass = 'opacity-100 translate-y-0 translate-x-0 scale-100';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? visibleClass : hiddenClass} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Image Carousel ─── */
function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const slides = [
    { image: carouselClinic1, title: 'Recepção Digital', desc: 'Check-in automatizado e gestão inteligente de filas' },
    { image: carouselDoctor2, title: 'Dashboard Completo', desc: 'Todas as métricas da sua clínica em tempo real' },
    { image: carouselTeam3, title: 'Equipe Integrada', desc: 'Multiusuário com permissões e auditoria completa' },
    { image: dashboardPreview, title: 'Prontuário Eletrônico', desc: 'Acesse históricos clínicos de qualquer dispositivo' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-[hsl(168,76%,36%)]/10">
      <div className="relative h-[400px] md:h-[500px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(168,76%,20%)]/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <h3 className="text-white text-2xl md:text-3xl font-extrabold font-display mb-2">{slide.title}</h3>
              <p className="text-white/80 text-base md:text-lg">{slide.desc}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Controls */}
      <button
        aria-label="Slide anterior"
        onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button
        aria-label="Próximo slide"
        onClick={() => setCurrent((c) => (c + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── data ─── */
const stats = [
  { value: 12, suffix: 'M+', label: 'Marcações agendadas', icon: Calendar },
  { value: 3, suffix: 'M+', label: 'Pacientes atendidos', icon: Users },
  { value: 10, suffix: 'K+', label: 'Médicos cadastrados', icon: Stethoscope },
  { value: 500, suffix: '+', label: 'Clientes ativos', icon: Heart },
];

const featureCards = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática via WhatsApp.', color: 'hsl(168,76%,36%)', image: dashboardPreview },
  { icon: FileText, title: 'Prontuário eletrônico', desc: 'Centralize todo o histórico clínico com segurança LGPD. Acesse de qualquer dispositivo.', color: 'hsl(168,76%,42%)', image: doctorUsingTablet },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios detalhados.', color: 'hsl(168,76%,30%)', image: clinicReception },
  { icon: ClipboardList, title: 'Laudos e exames', desc: 'Liberação de resultados via web com total segurança, rastreabilidade e assinatura digital.', color: 'hsl(168,76%,36%)', image: medicalTeam },
  { icon: BarChart3, title: 'Analytics e KPIs', desc: 'Dashboards inteligentes com indicadores em tempo real para decisões baseadas em dados.', color: 'hsl(168,76%,45%)', image: dashboardPreview },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Agente inteligente que agenda, confirma e responde pacientes 24h por dia, 7 dias por semana.', color: 'hsl(168,76%,32%)', image: whatsappPhone },
];

const howItWorks = [
  { step: '01', icon: MousePointerClick, title: 'Crie sua conta', desc: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem burocracia.', image: carouselClinic1 },
  { step: '02', icon: Settings2, title: 'Configure sua clínica', desc: 'Cadastre médicos, salas, convênios e personalize o sistema para seu fluxo.', image: carouselDoctor2 },
  { step: '03', icon: Rocket, title: 'Comece a atender', desc: 'Agende pacientes, gerencie prontuários e controle suas finanças em um só lugar.', image: carouselTeam3 },
];

const differentials = [
  { icon: Shield, title: 'LGPD Compliant', desc: 'Consentimento digital, criptografia e rastreabilidade total dos dados.' },
  { icon: Smartphone, title: 'Acesso remoto', desc: 'Use no celular, tablet ou desktop. Seus dados sempre acessíveis.' },
  { icon: Monitor, title: 'Painel TV', desc: 'Fila de atendimento em tempo real na recepção da clínica.' },
  { icon: Activity, title: 'Triagem Manchester', desc: 'Classificação de risco com protocolo internacional integrado.' },
  { icon: Layers, title: 'Templates médicos', desc: 'Documentos reutilizáveis para agilizar prescrições e laudos.' },
  { icon: Users, title: 'Multiusuário', desc: 'Gestão de equipe com convites, permissões e auditoria.' },
];

const testimonials = [
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o EloLab. O prontuário eletrônico é incrível e a equipe de suporte é sensacional!', avatar: '👩‍⚕️' },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço, meus pacientes adoram.', avatar: '👨‍⚕️' },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente o fluxo da clínica. Recomendo muito!', avatar: '👩‍⚕️' },
];

const faqs = [
  { q: 'Quanto tempo leva para configurar o sistema?', a: 'Menos de 10 minutos. Basta criar sua conta, cadastrar médicos e salas, e já pode começar a agendar pacientes.' },
  { q: 'Preciso instalar algum software?', a: 'Não! O EloLab é 100% web. Funciona no navegador do computador, celular ou tablet, sem instalação.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos criptografia de ponta, servidores seguros e estamos em total conformidade com a LGPD.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem fidelidade. Você pode cancelar quando quiser sem nenhuma taxa adicional.' },
  { q: 'Como funciona o agente IA no WhatsApp?', a: 'O agente IA responde pacientes automaticamente, agenda consultas, envia lembretes e confirmações — tudo via WhatsApp, 24 horas por dia.' },
  { q: 'Vocês oferecem suporte?', a: 'Sim! Oferecemos suporte humano dedicado por e-mail e WhatsApp para todos os planos.' },
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

/* ─── Section Heading ─── */
function SectionHeading({ badge, title, highlight, description }: {
  badge?: string; title: string; highlight: string; description: string;
}) {
  return (
    <div className="text-center mb-16 max-w-2xl mx-auto">
      {badge && (
        <span className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 text-[hsl(168,76%,30%)] rounded-full px-4 py-1.5 text-sm font-semibold mb-5 border border-[hsl(168,76%,36%)]/15">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-display leading-tight mb-4">
        {title}{' '}
        <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">{highlight}</span>
      </h2>
      <p className="text-[hsl(215,15%,45%)] text-lg leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Marquee Logos Strip ─── */
function MarqueeStrip() {
  const logos = ['🏥 Clínica São Lucas', '🏨 Hospital Vila Nova', '💊 Centro Médico Saúde+', '🩺 Consultório Premium', '🏥 Clínica Bem Estar', '🏨 Hospital Central', '💊 MedCenter', '🩺 Ortho Clinic'];
  return (
    <div className="overflow-hidden py-4">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-12 whitespace-nowrap">
        {[...logos, ...logos].map((logo, i) => (
          <span key={i} className="text-[hsl(168,76%,36%)]/40 text-sm font-medium tracking-wide flex-shrink-0">{logo}</span>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', clinica: '' });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: planos } = useQuery({
    queryKey: ['planos_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('planos' as any).select('*').eq('ativo', true).order('ordem');
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
        toast.success('Redirecionando para o pagamento.', { duration: 6000 });
        window.location.href = data.checkout_url;
      } else {
        toast.success('✅ Verifique seu e-mail! Enviamos o código de ativação.', { duration: 8000 });
      }
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar. Tente novamente.'),
  });

  const handleSelectPlan = (plano: any) => { setSelectedPlan(plano); setCheckoutDialog(true); };
  const handleCheckout = (mode: 'trial' | 'buy') => {
    if (!form.nome || !form.email) { toast.error('Preencha nome e e-mail'); return; }
    checkoutMutation.mutate({
      plano_id: selectedPlan.id, plano_slug: selectedPlan.slug,
      nome: form.nome, email: form.email, telefone: form.telefone, clinica: form.clinica, mode,
    });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-[hsl(215,28%,17%)] font-sans overflow-x-hidden relative">
      {/* ═══════════════ FIXED BACKGROUND ═══════════════ */}
      <div className="fixed inset-0 z-0 bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[hsl(168,76%,90%)]/40 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(168,76%,85%)]/30 blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10">
      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes slide-in-up { 0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <EloLabNavbar scrolled={scrolled} onScrollTo={scrollTo} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section aria-label="Apresentação principal" className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-[hsl(168,76%,97%)]/80" />

        {/* Animated rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[hsl(168,76%,50%)]/5 animate-[pulse-ring_6s_ease-out_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[hsl(168,76%,50%)]/8 animate-[pulse-ring_6s_ease-out_infinite_1s]" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-[hsl(168,76%,50%)]/10 blur-sm animate-pulse"
              style={{ width: `${6 + i * 3}px`, height: `${6 + i * 3}px`, top: `${10 + i * 10}%`, left: `${5 + i * 12}%`, animationDuration: `${3 + i}s`, animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal effect="fade">
                <div className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 backdrop-blur-md border border-[hsl(168,76%,36%)]/15 text-[hsl(168,76%,30%)] rounded-full px-5 py-2.5 text-sm font-medium mb-8">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(168,76%,50%)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(168,76%,50%)]" />
                  </span>
                  Teste grátis por 3 dias — sem cartão
                </div>
              </Reveal>

              <Reveal delay={100} effect="left">
                <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-extrabold leading-[1.05] tracking-tight font-display text-[hsl(215,28%,17%)] mb-6">
                  Gestão clínica{' '}
                  <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] via-[hsl(168,76%,45%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">
                    inteligente
                  </span>{' '}
                  e completa
                </h1>
              </Reveal>

              <Reveal delay={200} effect="left">
                <p className="text-lg sm:text-xl text-[hsl(215,15%,42%)] leading-relaxed max-w-[540px] mb-10">
                  Agenda, prontuário eletrônico, financeiro e IA em uma plataforma segura, moderna e em conformidade com a LGPD.
                </p>
              </Reveal>

              <Reveal delay={300} effect="up">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-2xl shadow-[hsl(168,76%,36%)]/30 text-base px-8 h-14 rounded-xl font-bold group relative overflow-hidden"
                    onClick={() => scrollTo('pricing')}
                  >
                    <span className="relative z-10 flex items-center">
                      Começar gratuitamente
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[hsl(168,76%,36%)]/30 text-[hsl(168,76%,30%)] hover:bg-[hsl(168,76%,36%)]/8 rounded-xl h-14 font-medium"
                    onClick={() => scrollTo('features')}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" /> Ver funcionalidades
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={400} effect="fade">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-10 text-sm text-[hsl(215,15%,55%)]">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Sem fidelidade</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Suporte humano</span>
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(168,76%,36%)]" /> LGPD</span>
                </div>
              </Reveal>
            </div>

            {/* Right side - floating dashboard preview */}
            <Reveal delay={400} effect="right" className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-[hsl(168,76%,50%)]/10 to-[hsl(168,76%,80%)]/5 rounded-[2rem] blur-3xl" />
                <div className="relative bg-white/80 backdrop-blur-sm border border-[hsl(168,76%,36%)]/10 rounded-2xl p-4 shadow-2xl shadow-[hsl(168,76%,36%)]/10">
                  <div className="flex gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,60%)]" />
                    <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,75%)]" />
                    <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,85%)]" />
                  </div>
                  <img src={dashboardPreview} alt="Dashboard EloLab" className="w-full rounded-xl shadow-lg ring-1 ring-[hsl(168,76%,36%)]/10" loading="eager" />
                </div>
                {/* Floating mini cards */}
                <div className="absolute -bottom-6 -left-8 bg-white border border-[hsl(168,76%,36%)]/15 rounded-xl p-3 shadow-xl animate-[float_4s_ease-in-out_infinite]">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[hsl(168,76%,36%)] flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[hsl(215,28%,17%)] text-xs font-bold">+32%</p>
                      <p className="text-[hsl(215,15%,55%)] text-[10px]">Eficiência</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-6 bg-white border border-[hsl(168,76%,36%)]/15 rounded-xl p-3 shadow-xl animate-[float_5s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[hsl(168,76%,45%)] flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[hsl(215,28%,17%)] text-xs font-bold">1.2K</p>
                      <p className="text-[hsl(215,15%,55%)] text-[10px]">Pacientes/mês</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="h-6 w-6 text-[hsl(168,76%,36%)]/40" />
        </div>
      </section>

      {/* ═══════════════ MARQUEE + STATS WITH PARALLAX EFFECT ═══════════════ */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[hsl(168,76%,97%)]" />
        <div className="relative z-10 mb-8"><MarqueeStrip /></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="zoom">
            <p className="text-center text-sm font-semibold text-[hsl(168,76%,50%)] uppercase tracking-widest mb-12">
              📊 Números que comprovam resultados
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 100} effect="zoom">
                <AnimatedStat value={s.value} suffix={s.suffix} label={s.label} icon={s.icon} />
              </Reveal>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-8"><MarqueeStrip /></div>
      </section>

      {/* ═══════════════ FULL-WIDTH BANNER ═══════════════ */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img src={bannerWideClinic} alt="Clínica moderna" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(168,76%,30%)]/80 via-[hsl(168,76%,36%)]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Reveal effect="left">
              <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white leading-tight max-w-xl mb-4">
                Infraestrutura moderna para sua clínica
              </h2>
              <p className="text-white/80 text-lg max-w-md mb-6">
                Tecnologia de ponta para transformar a gestão da saúde com segurança e eficiência.
              </p>
              <Button
                size="lg"
                className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl h-13 px-8 font-bold shadow-xl"
                onClick={() => scrollTo('features')}
              >
                Conheça nosso sistema <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ IMAGE CAROUSEL SECTION ═══════════════ */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-white/95" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading
              badge="📸 Conheça o EloLab"
              title="Veja como funciona"
              highlight="na prática"
              description="Navegue pelas imagens e descubra como o EloLab transforma a rotina da sua clínica."
            />
          </Reveal>
          <Reveal delay={200} effect="zoom">
            <ImageCarousel />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID WITH PHOTO CARDS ═══════════════ */}
      <section id="features" aria-label="Funcionalidades" className="relative py-28 px-4">
        <div className="absolute inset-0 bg-[hsl(168,76%,97%)]/90" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading
              badge="✨ Funcionalidades"
              title="Tudo que sua clínica precisa,"
              highlight="em um só lugar"
              description="Ferramentas profissionais para otimizar cada etapa da gestão clínica."
            />
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((f, i) => (
              <Reveal key={i} delay={i * 80} effect={i % 3 === 0 ? 'left' : i % 3 === 1 ? 'up' : 'right'}>
                <div className="group relative bg-white border border-[hsl(168,76%,36%)]/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-[hsl(168,76%,36%)]/10 hover:-translate-y-2 transition-all duration-500 h-full">
                  {/* Photo header */}
                  <div className="relative h-44 overflow-hidden">
                    <img src={f.image} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
                    <div className="absolute top-3 left-3 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: f.color }}>
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="p-6 pt-2">
                    <h3 className="font-bold text-[17px] mb-2 font-display text-[hsl(215,28%,17%)]">{f.title}</h3>
                    <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ RIBBON / FAIXA CTA ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(168,76%,36%)] via-[hsl(168,76%,40%)] to-[hsl(168,76%,45%)]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white font-display">Teste grátis por 3 dias!</h3>
              <p className="text-white/70 text-sm">Sem cartão · Sem compromisso · Cancele quando quiser</p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl h-13 px-8 font-bold shadow-xl shrink-0"
            onClick={() => scrollTo('pricing')}
          >
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS - ALTERNATING LAYOUT ═══════════════ */}
      <section id="how-it-works" className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/95" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading
              badge="🚀 Como funciona"
              title="Comece em"
              highlight="3 passos simples"
              description="Sem burocracia, sem instalação. Configure sua clínica em minutos."
            />
          </Reveal>
          <div className="space-y-24">
            {howItWorks.map((s, i) => (
              <Reveal key={i} delay={i * 150} effect={i % 2 === 0 ? 'left' : 'right'}>
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? '' : ''}`}>
                  <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-[hsl(168,76%,36%)] flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-[hsl(168,76%,36%)]/20">
                        {s.step}
                      </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold font-display mb-3 text-[hsl(215,28%,17%)]">{s.title}</h3>
                    <p className="text-[hsl(215,15%,42%)] text-base leading-relaxed max-w-md">{s.desc}</p>
                  </div>
                  <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="relative group">
                      <div className="absolute -inset-3 bg-gradient-to-br from-[hsl(168,76%,36%)]/8 to-transparent rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <img src={s.image} alt={s.title} className="relative w-full rounded-2xl shadow-xl ring-1 ring-[hsl(168,76%,36%)]/10 group-hover:shadow-2xl transition-shadow duration-500" loading="lazy" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRONTUÁRIO - PHOTO SPLIT ═══════════════ */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[hsl(168,76%,97%)]/95" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <Reveal effect="left">
            <div>
              <span className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 text-[hsl(168,76%,30%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-5 border border-[hsl(168,76%,36%)]/15">
                <FileText className="h-3.5 w-3.5" /> Prontuário Eletrônico
              </span>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-display leading-tight mb-5 text-[hsl(215,28%,17%)]">
                Prontuário completo,{' '}
                <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">seguro e acessível</span>
              </h2>
              <p className="text-[hsl(215,15%,42%)] text-base leading-relaxed mb-8 max-w-lg">
                Centralize todas as informações clínicas em um ambiente seguro. Anamnese, prescrições, atestados e exames acessíveis de qualquer dispositivo.
              </p>
              <div className="space-y-5">
                {[
                  { icon: FileText, title: 'Histórico integrado', desc: 'Laudos, atestados, prescrições e encaminhamentos em um só lugar.' },
                  { icon: Lock, title: 'Segurança LGPD', desc: 'Consentimento digital, rastreabilidade e criptografia de dados sensíveis.' },
                  { icon: Smartphone, title: 'Acesso multi-dispositivo', desc: 'Consulte prontuários do celular, tablet ou computador.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="h-11 w-11 rounded-xl bg-[hsl(168,76%,36%)]/8 flex items-center justify-center shrink-0 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] mb-0.5 text-[hsl(215,28%,17%)]">{item.title}</h4>
                      <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={200} effect="right">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(168,76%,36%)]/6 to-transparent rounded-[2rem] blur-2xl" />
              <img src={clinicReception} alt="Recepção moderna" className="relative z-10 w-full rounded-2xl shadow-2xl ring-1 ring-[hsl(168,76%,36%)]/10" loading="lazy" />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-2xl p-4 border border-[hsl(168,76%,36%)]/10 z-20">
                <div className="flex items-center gap-3">
                  <img src={doctorUsingTablet} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-sm text-[hsl(215,28%,17%)]">Acesso rápido</p>
                    <p className="text-xs text-[hsl(215,15%,50%)]">De qualquer dispositivo</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ SECOND BANNER / FAIXA ESTENDIDA WITH PHOTO ═══════════════ */}
      <section className="relative h-[280px] overflow-hidden">
        <img src={carouselTeam3} alt="Equipe médica" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(168,76%,25%)]/85 to-[hsl(168,76%,36%)]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <Reveal effect="zoom">
              <h3 className="text-3xl sm:text-4xl font-extrabold font-display text-white mb-3">+500 clínicas já confiam no EloLab</h3>
              <p className="text-white/80 text-lg mb-6">Junte-se à maior rede de gestão clínica inteligente do Brasil</p>
              <Button
                size="lg"
                className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl h-13 px-8 font-bold shadow-xl"
                onClick={() => scrollTo('pricing')}
              >
                Comece agora gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ DIFFERENTIALS WITH PHOTO + CARDS ═══════════════ */}
      <section id="differentials" className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/95" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading badge="🏥 Diferenciais" title="Por que clínicas escolhem o" highlight="EloLab" description="Tecnologia médica de ponta com segurança, praticidade e suporte humano dedicado." />
          </Reveal>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <Reveal className="lg:col-span-2" effect="left">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-full min-h-[400px]">
                <img src={clinicWaitingRoom} alt="Sala de espera moderna" className="w-full h-full object-cover absolute inset-0" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(168,76%,25%)]/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 z-10">
                  <h3 className="text-white font-extrabold text-xl font-display mb-2">Ambiente moderno</h3>
                  <p className="text-white/70 text-sm">Painel TV integrado para a recepção</p>
                </div>
              </div>
            </Reveal>

            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {differentials.map((f, i) => (
                <Reveal key={i} delay={i * 80} effect={i % 2 === 0 ? 'right' : 'up'}>
                  <div className="group bg-[hsl(168,76%,98%)] hover:bg-white rounded-2xl border border-transparent hover:border-[hsl(168,76%,36%)]/15 p-6 hover:shadow-2xl hover:shadow-[hsl(168,76%,36%)]/5 hover:-translate-y-1 transition-all duration-400">
                    <div className="h-11 w-11 rounded-xl bg-[hsl(168,76%,36%)]/8 flex items-center justify-center mb-4 group-hover:bg-[hsl(168,76%,36%)] transition-all duration-300 group-hover:scale-110">
                      <f.icon className="h-5 w-5 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="font-bold text-[15px] mb-1 font-display text-[hsl(215,28%,17%)]">{f.title}</h3>
                    <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHATSAPP AI ═══════════════ */}
      <section id="whatsapp-ai" className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-[hsl(168,76%,97%)]/95" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <Reveal effect="left">
            <div>
              <span className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 text-[hsl(168,76%,30%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-[hsl(168,76%,36%)]/15 mb-5">
                🤖 Inteligência Artificial
              </span>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-display leading-tight mb-5 text-[hsl(215,28%,17%)]">
                Agente IA no WhatsApp{' '}
                <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">que atende 24h</span>
              </h2>
              <p className="text-[hsl(215,15%,42%)] text-base leading-relaxed mb-8 max-w-lg">
                Agendamentos, confirmações e respostas inteligentes — tudo automatizado, sem intervenção humana.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Bot, text: 'Chatbot inteligente com IA avançada' },
                  { icon: Calendar, text: 'Agendamento automático pelo WhatsApp' },
                  { icon: MessageSquare, text: 'Respostas personalizadas para cada paciente' },
                  { icon: Clock, text: 'Disponível 24h, 7 dias por semana' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(168,76%,36%)]/8 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(168,76%,36%)]" />
                    </div>
                    <span className="text-[15px] font-medium text-[hsl(215,28%,17%)]">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-[hsl(168,76%,95%)] rounded-xl border border-[hsl(168,76%,36%)]/15">
                <p className="text-sm text-[hsl(168,76%,25%)] font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(168,76%,36%)]" />
                  Exclusivo do plano <strong>EloLab Ultra</strong>
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200} effect="right">
            <div className="relative flex justify-center">
              <div className="absolute -inset-6 bg-[hsl(168,76%,50%)]/5 rounded-[2.5rem] blur-2xl" />
              <img src={whatsappPhone} alt="WhatsApp com agente IA" className="relative z-10 w-full max-w-[360px] rounded-[2rem] shadow-2xl ring-1 ring-[hsl(168,76%,36%)]/10" loading="lazy" />
              <div className="absolute top-8 -right-4 bg-white rounded-xl shadow-2xl p-3 border border-[hsl(168,76%,36%)]/10 z-20 animate-[float_4s_ease-in-out_infinite]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[hsl(168,76%,90%)] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[hsl(168,76%,36%)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(215,28%,17%)]">IA respondeu!</p>
                    <p className="text-[10px] text-[hsl(215,15%,50%)]">Consulta agendada ✅</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/95" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading badge="⭐ Depoimentos" title="Quem usa," highlight="recomenda" description="Veja o que profissionais de saúde dizem sobre o EloLab." />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 120} effect={i === 0 ? 'left' : i === 1 ? 'up' : 'right'}>
                <Card className="border-[hsl(168,76%,36%)]/10 bg-white/80 backdrop-blur shadow-sm hover:shadow-2xl hover:shadow-[hsl(168,76%,36%)]/5 hover:-translate-y-2 transition-all duration-400 rounded-2xl h-full">
                  <CardContent className="p-7">
                    <div className="flex gap-0.5 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[hsl(168,76%,45%)] text-[hsl(168,76%,45%)]" />
                      ))}
                    </div>
                    <p className="text-[15px] text-[hsl(215,15%,35%)] mb-6 leading-relaxed italic">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-4">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[hsl(168,76%,36%)]/15 to-[hsl(168,76%,50%)]/10 flex items-center justify-center text-lg">{t.avatar}</div>
                      <div>
                        <p className="font-bold text-sm text-[hsl(215,28%,17%)]">{t.name}</p>
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
      <section id="pricing">
        <ModernPricingSection
          title={<>Escolha o plano ideal para <span className="text-[hsl(168,76%,36%)]">sua clínica</span></>}
          subtitle="Comece com 3 dias grátis. Sem cartão de crédito. Cancele quando quiser."
          showAnimatedBackground={true}
          plans={
            planos?.map((plano: any) => ({
              planName: plano.nome,
              description: plano.descricao || '',
              price: Math.floor(plano.valor).toString(),
              features: (plano.features as string[]).slice(0, 10).map((f: string) => featureLabels[f] || f),
              buttonText: 'Começar grátis',
              isPopular: plano.destaque,
              buttonVariant: plano.destaque ? 'primary' as const : 'secondary' as const,
              onButtonClick: () => handleSelectPlan(plano),
            })) || []
          }
        />
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-white/95" />
        <div className="max-w-3xl mx-auto relative z-10">
          <Reveal effect="up">
            <SectionHeading badge="❓ Perguntas frequentes" title="Tire suas" highlight="dúvidas" description="Tudo que você precisa saber antes de começar." />
          </Reveal>
          <Reveal delay={100} effect="fade">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-[hsl(168,76%,98%)] border border-[hsl(168,76%,36%)]/10 rounded-xl px-6 data-[state=open]:shadow-lg data-[state=open]:shadow-[hsl(168,76%,36%)]/5 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left text-[15px] font-bold py-5 hover:no-underline hover:text-[hsl(168,76%,36%)] transition-colors text-[hsl(215,28%,17%)]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[hsl(215,15%,42%)] leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(168,76%,30%)] via-[hsl(168,60%,25%)] to-[hsl(215,28%,17%)] min-h-[500px] flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center py-24 px-4">
          <Reveal effect="zoom">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-5 py-2.5 text-sm text-white font-medium mb-8 border border-white/20">
              <Award className="h-4 w-4 text-white" /> +500 clínicas já confiam no EloLab
            </div>
            <h2 className="text-3xl sm:text-[3rem] font-extrabold font-display text-white leading-tight mb-5">
              Comece a transformar{' '}
              <span className="text-white/90 underline decoration-white/30 underline-offset-4">sua clínica</span>{' '}
              hoje
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Junte-se a milhares de profissionais de saúde que já simplificaram a gestão do consultório.
            </p>
            <div className="flex justify-center gap-3 mb-12">
              {[dashboardPreview, carouselClinic1, carouselDoctor2, carouselTeam3].map((img, i) => (
                <div key={i} className="h-16 w-16 rounded-xl overflow-hidden ring-2 ring-white/30 hover:ring-white/60 transition-all duration-300 hover:scale-110">
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl text-base px-8 h-14 shadow-2xl font-bold group"
                onClick={() => scrollTo('pricing')}
              >
                Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
      <footer className="bg-[hsl(168,76%,97%)] text-[hsl(215,28%,17%)] py-16 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={logoInovalab} alt="EloLab" className="h-9 w-9 rounded-lg object-contain" />
                <span className="text-xl font-extrabold font-display tracking-tight">
                  ELO<span className="text-[hsl(168,76%,36%)]">LAB</span>
                </span>
              </div>
              <p className="text-[hsl(215,15%,50%)] text-sm leading-relaxed max-w-sm mb-6">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <div className="flex flex-col gap-2 text-sm text-[hsl(215,15%,45%)]">
                <a href="mailto:contato@elolab.com.br" className="flex items-center gap-2 hover:text-[hsl(168,76%,36%)] transition-colors">
                  <Mail className="h-4 w-4" /> contato@elolab.com.br
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-[hsl(168,76%,36%)] uppercase tracking-wider">Produto</h4>
              <div className="space-y-3 text-sm text-[hsl(215,15%,45%)]">
                <button onClick={() => scrollTo('features')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('how-it-works')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Como funciona</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('faq')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">FAQ</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-[hsl(168,76%,36%)] uppercase tracking-wider">Acesso</h4>
              <div className="space-y-3 text-sm text-[hsl(215,15%,45%)]">
                <button onClick={() => navigate('/auth')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Criar conta grátis</button>
                <button onClick={() => navigate('/portal-paciente')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Portal do Paciente</button>
                <a href="mailto:contato@elolab.com.br" className="block hover:text-[hsl(168,76%,36%)] transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[hsl(215,15%,60%)]">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[hsl(168,76%,36%)]" /> Em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ CHECKOUT DIALOG ═══════════════ */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold font-display">Assine o {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>Preencha seus dados e escolha como deseja começar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" className="rounded-xl" /></div>
              <div><Label className="text-xs font-semibold">E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="rounded-xl" /></div>
              <div><Label className="text-xs font-semibold">Nome da Clínica</Label><Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} placeholder="Clínica São Lucas" className="rounded-xl" /></div>
            </div>
            <div className="bg-[hsl(168,76%,95%)] rounded-xl p-4 border border-[hsl(168,76%,36%)]/12">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedPlan?.nome}</p>
                  <p className="text-sm text-[hsl(215,15%,45%)]">{selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês</p>
                </div>
                <Badge className="bg-[hsl(168,76%,36%)] text-white text-xs font-bold">{selectedPlan?.trial_dias || 3} dias grátis</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button onClick={() => handleCheckout('trial')} disabled={checkoutMutation.isPending} variant="outline" className="h-14 flex flex-col items-center justify-center gap-0.5 border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/8 rounded-xl">
                <span className="text-sm font-bold">{checkoutMutation.isPending ? 'Processando...' : 'Testar grátis'}</span>
                <span className="text-[10px] font-normal opacity-70">Sem cartão de crédito</span>
              </Button>
              <Button onClick={() => handleCheckout('buy')} disabled={checkoutMutation.isPending} className="h-14 flex flex-col items-center justify-center gap-0.5 bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-xl font-bold">
                <span className="text-sm font-bold">{checkoutMutation.isPending ? 'Processando...' : 'Comprar agora'}</span>
                <span className="text-[10px] font-normal opacity-80">Via Mercado Pago</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>{/* end relative z-10 wrapper */}
    </div>
  );
}
