import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, Users, FileText, Shield, BarChart3, Stethoscope,
  MessageSquare, ChevronRight, Star, ArrowRight, Check,
  Smartphone, Zap, Lock, HeadphonesIcon, FlaskConical, Receipt,
  Menu, X, ChevronDown, Clock, Activity, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import elolabLogo from '@/assets/elolab-logo.png';
import phoneMockup1 from '@/assets/phone-mockup-1.webp';
import phoneMockup2 from '@/assets/phone-mockup-2.webp';
import phoneMockup3 from '@/assets/phone-mockup-3.webp';
import heroDashboard from '@/assets/hero-dashboard.webp';
import teamMedical from '@/assets/team-medical.webp';

/* ─── Animated Section ─── */
const FadeIn = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Counter ─── */
const Counter = ({ end, suffix = '' }: { end: number; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, end]);
  return <span ref={ref}>{count.toLocaleString('pt-BR')}{suffix}</span>;
};

/* ─── Data ─── */
const features = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Agendamento online com confirmação automática via WhatsApp, controle de bloqueios e retornos programados.' },
  { icon: FileText, title: 'Prontuário Eletrônico', desc: 'Prontuários completos com assinatura digital, anexos, timeline do paciente e protocolos clínicos.' },
  { icon: Receipt, title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, faturamento TISS, caixa diário e relatórios detalhados.' },
  { icon: FlaskConical, title: 'Laboratório', desc: 'Gestão de coletas, laudos digitais, mapa de coleta e rastreabilidade completa de amostras.' },
  { icon: Users, title: 'Gestão de Pacientes', desc: 'Cadastro completo, lista de espera, convênios, portal do paciente e histórico integrado.' },
  { icon: MessageSquare, title: 'WhatsApp IA', desc: 'Agente inteligente no WhatsApp para agendamentos automáticos, lembretes e atendimento 24h.' },
  { icon: Stethoscope, title: 'Módulo Clínico', desc: 'Prescrições, atestados, encaminhamentos, busca CID-10 e interações medicamentosas.' },
  { icon: Shield, title: 'LGPD & Segurança', desc: 'Consentimentos digitais, audit trail, backup automático semanal e conformidade total.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Dashboards em tempo real, métricas de desempenho, exportação Excel/PDF e painel TV.' },
];

const testimonials = [
  { name: 'Dra. Mariana Silva', role: 'Cardiologista', avatar: '👩‍⚕️', text: 'O EloLab transformou minha clínica. Reduzimos 70% das faltas com os lembretes automáticos via WhatsApp. O prontuário é intuitivo e seguro.' },
  { name: 'Dr. Carlos Mendes', role: 'Clínico Geral', avatar: '👨‍⚕️', text: 'A assinatura digital me economiza horas por semana. O sistema é rápido e o suporte é excepcional. Recomendo para qualquer clínica.' },
  { name: 'Ana Paula Costa', role: 'Administradora', avatar: '👩‍💼', text: 'O financeiro integrado com faturamento TISS é incrível. Temos controle total do fluxo de caixa e relatórios automáticos.' },
  { name: 'Dr. Roberto Alves', role: 'Ortopedista', avatar: '👨‍⚕️', text: 'Migrei de outro sistema e a transição foi suave. O módulo de laboratório e coletas é muito completo.' },
];

const faqs = [
  { q: 'Posso testar o EloLab gratuitamente?', a: 'Sim! Oferecemos 3 dias de teste grátis com acesso completo a todos os recursos do plano escolhido, sem necessidade de cartão de crédito. Basta criar sua conta e começar a usar.' },
  { q: 'Como funciona o pagamento da assinatura?', a: 'Os pagamentos são processados de forma segura via Mercado Pago com cobrança mensal automática. Você pode cancelar, pausar ou reativar sua assinatura a qualquer momento sem multas ou taxas adicionais.' },
  { q: 'O sistema é seguro e está em conformidade com a LGPD?', a: 'Sim. Utilizamos criptografia de ponta a ponta, certificação LGPD completa com termos de consentimento digital, backup automático semanal, audit trail em todas as operações e RLS (Row Level Security) em todas as tabelas.' },
  { q: 'Posso usar o EloLab no celular?', a: 'Sim! O EloLab é um PWA (Progressive Web App) que funciona perfeitamente em qualquer dispositivo — smartphone, tablet ou desktop — sem precisar baixar nada na loja de apps.' },
  { q: 'Quantos usuários posso cadastrar?', a: 'Os planos incluem usuários ilimitados. Médicos, recepcionistas, enfermeiros, financeiro e administradores podem acessar simultaneamente com permissões individuais por cargo.' },
  { q: 'O que acontece se eu atrasar o pagamento?', a: 'Enviamos lembretes automáticos de cobrança. Após 2 dias de atraso, o acesso é temporariamente suspenso até a regularização. Nenhum dado é perdido durante a suspensão.' },
];

const plans = [
  {
    name: 'EloLab Max',
    price: '299',
    desc: 'Ideal para clínicas em crescimento',
    popular: false,
    features: ['Agenda ilimitada', 'Prontuário eletrônico', 'Financeiro completo', 'Gestão de estoque', 'Relatórios e analytics', 'Suporte por chat', 'Backup automático', 'Conformidade LGPD'],
  },
  {
    name: 'EloLab Ultra',
    price: '399',
    desc: 'Para clínicas que querem o máximo',
    popular: true,
    features: ['Tudo do plano Max', 'Agente IA WhatsApp', 'Laboratório completo', 'Portal do Paciente', 'Automações avançadas', 'Suporte prioritário', 'Painel TV', 'API & integrações'],
  },
];

const howItWorks = [
  { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente em menos de 2 minutos. Sem cartão de crédito.', icon: Smartphone },
  { step: '02', title: 'Configure sua clínica', desc: 'Adicione médicos, salas, horários e personalize o sistema para sua realidade.', icon: Activity },
  { step: '03', title: 'Comece a atender', desc: 'Agende pacientes, abra prontuários e controle o financeiro — tudo integrado.', icon: Stethoscope },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[hsl(224,30%,10%)]/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
          <img src={elolabLogo} alt="EloLab" className="h-7 md:h-8 w-auto brightness-0 invert" loading="eager" />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            {['features', 'como-funciona', 'planos', 'depoimentos', 'faq'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors capitalize">
                {id === 'como-funciona' ? 'Como Funciona' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white/80 hover:text-white hover:bg-white/10">
              Entrar
            </Button>
            <Button onClick={() => scrollTo('planos')} className="bg-primary text-primary-foreground rounded-full px-6">
              Começar Grátis
            </Button>
          </div>
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[hsl(224,30%,10%)] border-t border-white/10 px-6 pb-6 space-y-1"
          >
            {['features', 'como-funciona', 'planos', 'depoimentos', 'faq'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-3 text-white/80 hover:text-white text-sm capitalize">
                {id === 'como-funciona' ? 'Como Funciona' : id}
              </button>
            ))}
            <div className="pt-3 space-y-2">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="w-full text-white/80">Entrar</Button>
              <Button onClick={() => scrollTo('planos')} className="w-full bg-primary text-primary-foreground rounded-full">Começar Grátis</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════ HERO — Dark Section ═══════════════ */}
      <section className="relative bg-[hsl(224,30%,10%)] overflow-hidden">
        {/* Gradient glow */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-20 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wider uppercase mb-6">
                <Zap className="w-3.5 h-3.5" /> Lançamento
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-white">
                Médico, conheça o{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))]">
                  EloLab
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/60 max-w-lg leading-relaxed">
                A solução completa para gestão clínica: agenda, prontuário, financeiro, laboratório e WhatsApp.{' '}
                <strong className="text-white/90">Tudo em um único sistema.</strong>
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="xl"
                  onClick={() => navigate('/auth')}
                  className="bg-primary text-primary-foreground rounded-full px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 text-base"
                >
                  COMECE A USAR AGORA
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-white/40">
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> LGPD Completa</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 3 dias grátis</span>
              </div>
            </motion.div>

            {/* Right — Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative w-[280px] sm:w-[320px] md:w-[360px]">
                <img
                  src={phoneMockup1}
                  alt="EloLab - Agenda inteligente no celular"
                  className="w-full rounded-[2rem] shadow-2xl shadow-black/50"
                  loading="eager"
                  width={600}
                  height={800}
                />
                {/* Floating card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -left-8 sm:-left-16 top-[60%] bg-white rounded-xl p-4 shadow-xl shadow-black/20 max-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-[hsl(224,30%,10%)]">Ganhos do mês</span>
                  </div>
                  <p className="text-lg font-extrabold text-[hsl(224,30%,10%)]">R$ 42.850</p>
                  <p className="text-[10px] text-[hsl(220,12%,50%)]">Todos os pagamentos em dia</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF ═══════════════ */}
      <section className="py-16 bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 500, suffix: '+', label: 'Clínicas ativas' },
            { value: 15000, suffix: '+', label: 'Pacientes gerenciados' },
            { value: 99, suffix: '.9%', label: 'Uptime garantido' },
            { value: 70, suffix: '%', label: 'Menos faltas' },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground tabular-nums"><Counter end={s.value} suffix={s.suffix} /></div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══════════════ O QUE FAZ O ELOLAB? ═══════════════ */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              O que faz o EloLab?
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </FadeIn>
          <FadeIn className="text-center mb-16">
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Módulos integrados que cobrem desde o agendamento até o laboratório
            </p>
          </FadeIn>

          {/* Feature alternating sections with phone mockups */}
          <div className="space-y-24">
            {/* Feature 1 — Agenda */}
            <FadeIn>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Agenda para clínica</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Com o EloLab você tem uma agenda totalmente personalizada para sua clínica, com confirmação automática via WhatsApp, 
                    controle de bloqueios, retornos programados e alertas inteligentes. Tenha mais segurança para nunca perder um agendamento!
                  </p>
                  <ul className="mt-6 space-y-3">
                    {['Confirmação automática via WhatsApp', 'Bloqueio de horários e férias', 'Retornos programados', 'Painel TV para recepção'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <img src={phoneMockup1} alt="Agenda EloLab" className="w-[260px] md:w-[300px] rounded-[2rem] shadow-xl" loading="lazy" />
                </div>
              </div>
            </FadeIn>

            {/* Feature 2 — Prontuário */}
            <FadeIn>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 flex justify-center">
                  <img src={phoneMockup2} alt="Prontuário EloLab" className="w-[260px] md:w-[300px] rounded-[2rem] shadow-xl" loading="lazy" />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Prontuário eletrônico</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Prontuários completos com assinatura digital, anexos de exames, timeline do paciente e integração com CID-10.
                    Prescrições, atestados e encaminhamentos em poucos cliques.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {['Assinatura digital ICP-Brasil', 'Timeline completa do paciente', 'Prescrições e atestados digitais', 'Busca CID-10 integrada'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>

            {/* Feature 3 — Financeiro */}
            <FadeIn>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Controle financeiro</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Registre valores a receber, controle pagamentos e acompanhe o fluxo de caixa da clínica. 
                    Faturamento TISS integrado com convênios e relatórios detalhados para gestão completa.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {['Fluxo de caixa em tempo real', 'Faturamento TISS para convênios', 'Contas a pagar e receber', 'Relatórios e exportação Excel/PDF'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <img src={phoneMockup3} alt="Financeiro EloLab" className="w-[260px] md:w-[300px] rounded-[2rem] shadow-xl" loading="lazy" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════ ALL FEATURES GRID ═══════════════ */}
      <section className="py-20 bg-[hsl(224,30%,10%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Mais suporte, mais autoridade, mais experiência
            </h2>
            <p className="mt-3 text-white/50 text-lg">no mesmo EloLab</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/8 transition-all duration-300">
                  <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ COMO FUNCIONA ═══════════════ */}
      <section id="como-funciona" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Como acessar o EloLab?
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </FadeIn>
          <FadeIn className="text-center mb-16">
            <p className="text-muted-foreground text-lg">Comece a usar em 3 passos simples</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="text-center">
                  <div className="text-6xl font-black text-primary/15 mb-4 leading-none">{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center mt-12">
            <Button
              size="xl"
              onClick={() => navigate('/auth')}
              className="bg-primary text-primary-foreground rounded-full px-10 shadow-lg shadow-primary/25"
            >
              COMECE SUA JORNADA AGORA <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════ DESKTOP SCREENSHOT ═══════════════ */}
      <section className="py-20 bg-card border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <img
                src={heroDashboard}
                alt="EloLab Dashboard no desktop"
                className="rounded-2xl shadow-2xl border border-border/30"
                loading="lazy"
                width={1280}
                height={800}
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">
                Também disponível no{' '}
                <span className="text-primary">desktop</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Acesse o EloLab de qualquer computador, notebook, tablet ou celular. 
                Todos os dados sincronizados em tempo real, com a mesma conta.
              </p>
              <img
                src={teamMedical}
                alt="Equipe médica colaborando"
                className="rounded-xl shadow-lg"
                loading="lazy"
                width={800}
                height={600}
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="planos" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Escolha seu plano
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </FadeIn>
          <FadeIn className="text-center mb-16">
            <p className="text-muted-foreground text-lg">3 dias grátis em todos os planos. Cancele quando quiser.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className={`relative rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'bg-card border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                    : 'bg-card border-border/50'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide">
                      MAIS POPULAR
                    </div>
                  )}
                  <h3 className="text-2xl font-extrabold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <div className="my-6 h-px bg-border" />
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-full text-base py-3 ${plan.popular ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Começar 3 dias grátis
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="depoimentos" className="py-24 bg-[hsl(224,30%,10%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-6">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">O que os médicos dizem</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              sobre o EloLab
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[hsl(38,92%,48%)] text-[hsl(38,92%,48%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60 flex-1 leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                    <span className="text-2xl">{t.avatar}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-6">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              Dúvidas frequentes
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </FadeIn>
          <div className="mt-14 space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-semibold text-sm hover:bg-accent/30 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA — Dark ═══════════════ */}
      <section className="py-24 bg-[hsl(224,30%,10%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Pronto para transformar sua clínica?
            </h2>
            <p className="mt-4 text-white/50 text-lg">
              Comece agora com 3 dias grátis. Sem cartão de crédito. Sem compromisso.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                size="xl"
                onClick={() => navigate('/auth')}
                className="bg-primary text-primary-foreground rounded-full px-10 shadow-lg shadow-primary/30 text-base"
              >
                EXPERIMENTE GRÁTIS AGORA <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[hsl(224,30%,8%)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <img src={elolabLogo} alt="EloLab" className="h-8 w-auto brightness-0 invert mb-4" loading="lazy" />
              <p className="text-sm text-white/40 leading-relaxed">
                Sistema completo de gestão para clínicas médicas e laboratórios.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Recursos</button></li>
                <li><button onClick={() => scrollTo('planos')} className="hover:text-white transition-colors">Planos</button></li>
                <li><button onClick={() => scrollTo('depoimentos')} className="hover:text-white transition-colors">Depoimentos</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="/politica-privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="/politica-cookies" className="hover:text-white transition-colors">Política de Cookies</a></li>
                <li><a href="/termos-uso" className="hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li>suporte@elolab.com.br</li>
                <li>(11) 9999-9999</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</p>
            <p className="text-xs text-white/30">Feito com ❤️ para a saúde brasileira</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
