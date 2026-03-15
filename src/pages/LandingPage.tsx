import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
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
  Calendar, Users, FileText, Stethoscope, BarChart3, Bot,
  ArrowRight, Star, Clock, Smartphone, LogIn,
  DollarSign, Mail, ClipboardList, Monitor, MessageSquare,
  CheckCircle2, Shield, Activity, Layers, Lock, Award,
  MousePointerClick, Rocket, Settings2, Sparkles, Zap,
  Heart, Package, FlaskConical, ChevronRight, Play,
  TrendingUp, Cpu, Globe, Users2,
} from 'lucide-react';
import dashboardPreview from '@/assets/dashboard-preview.webp';
import whatsappPhone from '@/assets/whatsapp-phone.webp';
import logoInovalab from '@/assets/logo-icon.png';
import { cn } from '@/lib/utils';

// ─── Animation variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Animated Counter ──────────────────────────────────────
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 2000, bounce: 0 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('pt-BR') + suffix;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0</span>;
}

// ─── Section wrapper with scroll animation ─────────────────
function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Data ──────────────────────────────────────────────────
const featureCards = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática via WhatsApp.', color: 'text-blue-500 bg-blue-500/10' },
  { icon: FileText, title: 'Prontuário eletrônico', desc: 'Centralize todo o histórico clínico com segurança LGPD. Acesse de qualquer dispositivo.', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios detalhados.', color: 'text-amber-500 bg-amber-500/10' },
  { icon: ClipboardList, title: 'Laudos e exames', desc: 'Liberação de resultados via web com total segurança, rastreabilidade e assinatura digital.', color: 'text-purple-500 bg-purple-500/10' },
  { icon: BarChart3, title: 'Analytics e KPIs', desc: 'Dashboards inteligentes com indicadores em tempo real para decisões baseadas em dados.', color: 'text-rose-500 bg-rose-500/10' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Agente inteligente que agenda, confirma e responde pacientes 24h por dia, 7 dias por semana.', color: 'text-teal-500 bg-teal-500/10' },
];

const howItWorks = [
  { step: '01', icon: MousePointerClick, title: 'Crie sua conta', desc: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem burocracia.' },
  { step: '02', icon: Settings2, title: 'Configure sua clínica', desc: 'Cadastre médicos, salas, convênios e personalize o sistema para seu fluxo.' },
  { step: '03', icon: Rocket, title: 'Comece a atender', desc: 'Agende pacientes, gerencie prontuários e controle suas finanças em um só lugar.' },
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
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o EloLab. O prontuário eletrônico é incrível!', avatar: '👩‍⚕️', stars: 5 },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço.', avatar: '👨‍⚕️', stars: 5 },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente o fluxo da clínica.', avatar: '👩‍⚕️', stars: 5 },
];

const faqs = [
  { q: 'Quanto tempo leva para configurar?', a: 'Menos de 10 minutos. Crie sua conta, cadastre médicos e salas, e comece a agendar.' },
  { q: 'Preciso instalar software?', a: 'Não! O EloLab é 100% web. Funciona no navegador do computador, celular ou tablet.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia de ponta, servidores seguros e total conformidade com a LGPD.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem fidelidade. Cancele quando quiser sem taxa adicional.' },
  { q: 'Como funciona o agente IA?', a: 'O agente IA responde pacientes automaticamente, agenda consultas e envia lembretes via WhatsApp 24h.' },
  { q: 'Vocês oferecem suporte?', a: 'Sim! Suporte humano dedicado por e-mail e WhatsApp para todos os planos.' },
];

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

// ─── Section Heading ───────────────────────────────────────
function SectionHeading({ badge, title, highlight, description }: {
  badge?: string; title: string; highlight: string; description: string;
}) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
      {badge && (
        <span className="inline-flex items-center gap-2 bg-brand/8 text-brand-hover rounded-full px-4 py-1.5 text-sm font-semibold mb-5 border border-brand/15">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
        {title}{' '}
        <span className="text-brand">{highlight}</span>
      </h2>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', clinica: '' });
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate feature cards
  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(p => (p + 1) % featureCards.length), 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      toast.success('🎉 Pagamento confirmado! Verifique seu e-mail para o código de ativação.', { duration: 10000 });
      window.history.replaceState({}, '', '/');
    } else if (status === 'error' || status === 'failure') {
      toast.error('Pagamento não aprovado. Tente novamente ou escolha outro método.', { duration: 8000 });
      window.history.replaceState({}, '', '/');
    } else if (status === 'pending') {
      toast.info('Pagamento em processamento. Você receberá o código por e-mail após a aprovação.', { duration: 8000 });
      window.history.replaceState({}, '', '/');
    }
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
        toast.success('Redirecionando para o pagamento...', { duration: 6000 });
        window.location.href = data.checkout_url;
      } else if (data?.invite_code) {
        toast.success(`✅ Código de ativação: ${data.invite_code}. Também enviamos por e-mail!`, { duration: 12000 });
        navigate(`/auth?codigo=${data.invite_code}&email=${encodeURIComponent(form.email)}&plano=${selectedPlan?.slug || ''}`);
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

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      <EloLabNavbar scrolled={scrolled} onScrollTo={scrollTo} />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[94vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand-hover rounded-full px-5 py-2 text-sm font-medium mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                  </span>
                  Teste grátis por 3 dias — sem cartão
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight font-display text-foreground mb-6">
                Gestão clínica{' '}
                <span className="relative text-brand">
                  inteligente
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-0 w-full h-[3px] bg-brand/40 rounded-full origin-left"
                  />
                </span>{' '}
                e completa
              </motion.h1>

              <motion.p variants={fadeUp} custom={2}
                className="text-lg text-muted-foreground leading-relaxed max-w-[540px] mb-10">
                Agenda, prontuário eletrônico, financeiro e IA em uma plataforma segura, moderna e em conformidade com a LGPD.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-brand hover:bg-brand-hover text-brand-foreground text-base px-8 h-13 rounded-xl font-semibold shadow-md shadow-brand/20 group relative overflow-hidden"
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
                  className="border-brand/25 text-brand-hover hover:bg-brand/5 rounded-xl h-13 font-medium gap-2"
                  onClick={() => scrollTo('features')}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Ver funcionalidades
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={4}
                className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-10 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> Sem fidelidade</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> Suporte humano</span>
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-brand" /> LGPD Compliant</span>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind image */}
                <div className="absolute inset-4 bg-brand/20 blur-2xl rounded-3xl" />
                <div className="relative bg-card border border-border/60 rounded-2xl p-3 shadow-2xl shadow-brand/10">
                  <div className="flex gap-1.5 mb-2.5 px-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  </div>
                  <img src={dashboardPreview} alt="Dashboard EloLab" className="w-full rounded-xl" loading="eager" width={600} height={400} />
                </div>
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Receita</p>
                    <p className="text-xs font-bold text-success">+24%</p>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [4, -4, 4] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Pacientes</p>
                    <p className="text-xs font-bold">+12 hoje</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <Section className="py-20 px-4 bg-brand/5 border-y border-brand/10">
        <div className="max-w-6xl mx-auto">
          <motion.p variants={fadeUp} className="text-center text-xs font-bold text-brand uppercase tracking-widest mb-12">
            Números que comprovam resultados
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 12, suffix: 'M+', label: 'Marcações agendadas', icon: Calendar },
              { value: 3, suffix: 'M+', label: 'Pacientes atendidos', icon: Users },
              { value: 10, suffix: 'K+', label: 'Médicos cadastrados', icon: Stethoscope },
              { value: 500, suffix: '+', label: 'Clientes ativos', icon: Heart },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-brand" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold font-display tabular-nums text-foreground">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-muted-foreground text-sm mt-1.5 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FEATURES ═══ */}
      <Section id="features" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="✨ Funcionalidades"
            title="Tudo que sua clínica precisa,"
            highlight="em um só lugar"
            description="Ferramentas profissionais para otimizar cada etapa da gestão clínica."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={cn(
                  'group bg-card border rounded-xl p-6 transition-all duration-300 cursor-pointer',
                  activeFeature === i ? 'border-brand/50 shadow-lg shadow-brand/10' : 'border-border/60 hover:border-brand/30 hover:shadow-md',
                )}
                onClick={() => setActiveFeature(i)}
              >
                <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center mb-4 transition-all duration-300', f.color)}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5 font-display text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                {activeFeature === i && (
                  <motion.div
                    layoutId="feature-indicator"
                    className="mt-3 h-0.5 bg-brand rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ CTA RIBBON ═══ */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-brand overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Teste grátis por 3 dias!</h3>
              <p className="text-white/70 text-sm">Sem cartão · Sem compromisso · Cancele quando quiser</p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-brand-hover hover:bg-white/90 rounded-xl h-12 px-7 font-semibold shadow-md shrink-0 group"
            onClick={() => scrollTo('pricing')}
          >
            Começar agora <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.section>

      {/* ═══ HOW IT WORKS ═══ */}
      <Section id="how-it-works" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="🚀 Como funciona"
            title="Comece em"
            highlight="3 passos simples"
            description="Sem burocracia, sem instalação. Configure sua clínica em minutos."
          />
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-7 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            {howItWorks.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center relative">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mx-auto h-14 w-14 rounded-xl bg-brand flex items-center justify-center text-brand-foreground font-bold text-lg shadow-md shadow-brand/20 mb-6 relative"
                >
                  {s.step}
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-brand flex items-center justify-center">
                    <s.icon className="h-2.5 w-2.5 text-brand" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-bold font-display mb-2.5 text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ DIFFERENTIALS ═══ */}
      <Section id="differentials" className="py-24 px-4 bg-brand/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="🏥 Diferenciais" title="Por que clínicas escolhem o" highlight="EloLab" description="Tecnologia médica de ponta com segurança, praticidade e suporte humano dedicado." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {differentials.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="group bg-card border border-border/60 rounded-xl p-6 hover:shadow-md hover:border-brand/30 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-brand/8 flex items-center justify-center mb-4 group-hover:bg-brand transition-colors duration-300">
                  <f.icon className="h-5 w-5 text-brand group-hover:text-brand-foreground transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1 font-display text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ WHATSAPP AI ═══ */}
      <Section id="whatsapp-ai" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 bg-brand/8 text-brand-hover rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-brand/15 mb-5">
              🤖 Inteligência Artificial
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-5 text-foreground">
              Agente IA no WhatsApp{' '}
              <span className="text-brand">que atende 24h</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
              Agendamentos, confirmações e respostas inteligentes — tudo automatizado, sem intervenção humana.
            </p>
            <div className="space-y-3.5">
              {[
                { icon: Bot, text: 'Chatbot inteligente com IA avançada' },
                { icon: Calendar, text: 'Agendamento automático pelo WhatsApp' },
                { icon: MessageSquare, text: 'Respostas personalizadas para cada paciente' },
                { icon: Clock, text: 'Disponível 24h, 7 dias por semana' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-brand/8 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-brand" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 p-3.5 bg-brand/5 rounded-lg border border-brand/12">
              <p className="text-sm text-brand-hover font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                Exclusivo do plano <strong>EloLab Ultra</strong>
              </p>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-3xl" />
              <img src={whatsappPhone} alt="WhatsApp com agente IA" className="relative w-full max-w-[280px] rounded-3xl shadow-2xl" loading="lazy" width={320} height={640} />
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ TESTIMONIALS ═══ */}
      <Section id="testimonials" className="py-24 px-4 bg-brand/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="⭐ Depoimentos" title="Quem usa," highlight="recomenda" description="Veja o que profissionais de saúde dizem sobre o EloLab." />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ y: -4 }}>
                <Card className="border-border/60 bg-card rounded-xl hover:shadow-lg hover:border-brand/20 transition-all duration-300 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(t.stars)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic flex-1">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                      <div className="h-10 w-10 rounded-full bg-brand/8 flex items-center justify-center text-base">{t.avatar}</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-brand font-medium">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing">
        <ModernPricingSection
          title={<>Escolha o plano ideal para <span className="text-brand">sua clínica</span></>}
          subtitle="Comece com 3 dias grátis. Sem cartão de crédito. Cancele quando quiser."
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

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="py-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <SectionHeading badge="❓ Perguntas frequentes" title="Tire suas" highlight="dúvidas" description="Tudo que você precisa saber antes de começar." />
          <motion.div variants={stagger}>
            <Accordion type="single" collapsible className="space-y-2.5">
              {faqs.map((faq, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}>
                  <AccordionItem value={`faq-${i}`} className="bg-card border border-border/60 rounded-xl px-5 hover:border-brand/30 transition-colors">
                    <AccordionTrigger className="text-left text-sm font-semibold py-4 hover:no-underline text-foreground">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-hover via-brand to-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/12 rounded-full px-5 py-2 text-sm text-white font-medium mb-8 border border-white/15">
            <Award className="h-4 w-4" /> +500 clínicas já confiam no EloLab
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white leading-tight mb-6">
            Comece a transformar sua clínica hoje
          </h2>
          <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Junte-se a milhares de profissionais de saúde que já simplificaram a gestão do consultório.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-brand-hover hover:bg-white/90 rounded-xl text-base px-8 h-13 shadow-md font-semibold group"
              onClick={() => scrollTo('pricing')}
            >
              Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl text-base px-8 h-13 font-medium"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-2 h-5 w-5" /> Já tenho conta
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-secondary/50 border-t border-border text-foreground py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={logoInovalab} alt="EloLab" className="h-8 w-8 rounded-lg object-contain" width={32} height={32} />
                <span className="text-lg font-bold font-display tracking-tight">
                  ELO<span className="text-brand">LAB</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-5">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <a href="mailto:contato@elolab.com.br" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors">
                <Mail className="h-4 w-4" /> contato@elolab.com.br
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-brand uppercase tracking-wider">Produto</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <button onClick={() => scrollTo('features')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Funcionalidades</button>
                <button onClick={() => scrollTo('how-it-works')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Como funciona</button>
                <button onClick={() => scrollTo('pricing')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Planos e preços</button>
                <button onClick={() => scrollTo('faq')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />FAQ</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-brand uppercase tracking-wider">Acesso</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Login</button>
                <button onClick={() => scrollTo('pricing')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Criar conta grátis</button>
                <button onClick={() => navigate('/portal-paciente')} className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Portal do Paciente</button>
                <a href="mailto:contato@elolab.com.br" className="flex items-center gap-1.5 hover:text-brand transition-colors"><ChevronRight className="h-3.5 w-3.5" />Suporte</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-brand" /> Em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ CHECKOUT DIALOG ═══ */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display">Assine o {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>Preencha seus dados e escolha como deseja começar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Dr. João Silva" /></div>
              <div><Label className="text-xs font-semibold">E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
              <div><Label className="text-xs font-semibold">Nome da Clínica</Label><Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} placeholder="Clínica São Lucas" /></div>
            </div>
            <div className="bg-brand/5 rounded-lg p-4 border border-brand/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{selectedPlan?.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês</p>
                </div>
                <Badge className="bg-brand text-brand-foreground text-xs font-semibold">{selectedPlan?.trial_dias || 3} dias grátis</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button onClick={() => handleCheckout('trial')} disabled={checkoutMutation.isPending} variant="outline" className="h-13 flex flex-col items-center justify-center gap-0.5 border-brand text-brand hover:bg-brand/5">
                <span className="text-sm font-semibold">{checkoutMutation.isPending ? 'Processando...' : 'Testar grátis'}</span>
                <span className="text-[10px] font-normal opacity-70">Sem cartão de crédito</span>
              </Button>
              <Button onClick={() => handleCheckout('buy')} disabled={checkoutMutation.isPending} className="h-13 flex flex-col items-center justify-center gap-0.5 bg-brand hover:bg-brand-hover text-brand-foreground font-semibold">
                <span className="text-sm font-semibold">{checkoutMutation.isPending ? 'Processando...' : 'Comprar agora'}</span>
                <span className="text-[10px] font-normal opacity-80">Via Mercado Pago</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
