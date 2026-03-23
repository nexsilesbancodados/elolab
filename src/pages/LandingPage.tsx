import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Calendar, Users, FileText, Shield, BarChart3, Stethoscope,
  MessageSquare, Clock, ChevronRight, Star, ArrowRight, Check,
  Smartphone, Zap, Lock, HeadphonesIcon, FlaskConical, Receipt,
  Menu, X, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroDashboard from '@/assets/hero-dashboard.webp';
import teamMedical from '@/assets/team-medical.webp';
import elolabLogo from '@/assets/elolab-logo.png';

/* ─── Animated Section Wrapper ─── */
const FadeInSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Stats Counter ─── */
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

/* ─── Feature Data ─── */
const features = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Agendamento online com confirmação automática via WhatsApp e controle de bloqueios.' },
  { icon: FileText, title: 'Prontuário Eletrônico', desc: 'Prontuários completos com assinatura digital, anexos e timeline do paciente.' },
  { icon: Receipt, title: 'Financeiro Completo', desc: 'Contas a pagar/receber, fluxo de caixa, faturamento TISS e relatórios.' },
  { icon: FlaskConical, title: 'Laboratório', desc: 'Gestão de coletas, laudos, mapa de coleta e controle de amostras.' },
  { icon: Users, title: 'Gestão de Pacientes', desc: 'Cadastro completo, lista de espera, convênios e portal do paciente.' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Agente IA no WhatsApp para agendamentos, lembretes e atendimento 24h.' },
  { icon: Stethoscope, title: 'Módulo Clínico', desc: 'Prescrições, atestados, encaminhamentos, CID-10 e protocolos clínicos.' },
  { icon: Shield, title: 'LGPD Completa', desc: 'Consentimentos, audit trail, backup automático e conformidade total.' },
  { icon: BarChart3, title: 'Analytics & Relatórios', desc: 'Dashboards em tempo real, métricas de desempenho e exportação Excel/PDF.' },
];

const testimonials = [
  { name: 'Dra. Mariana Silva', role: 'Cardiologista', text: 'O EloLab transformou minha clínica. Reduzimos 70% das faltas com os lembretes automáticos via WhatsApp.', stars: 5 },
  { name: 'Dr. Carlos Mendes', role: 'Clínico Geral', text: 'O prontuário eletrônico é intuitivo e seguro. A assinatura digital me economiza horas por semana.', stars: 5 },
  { name: 'Ana Paula Costa', role: 'Administradora Clínica', text: 'O financeiro integrado com faturamento TISS é incrível. Temos controle total do fluxo de caixa.', stars: 5 },
  { name: 'Dr. Roberto Alves', role: 'Ortopedista', text: 'Migrei de outro sistema e a transição foi suave. O suporte é excepcional e o app é muito rápido.', stars: 5 },
];

const faqs = [
  { q: 'Posso testar gratuitamente?', a: 'Sim! Oferecemos 3 dias de teste grátis com acesso completo a todos os recursos do plano escolhido, sem necessidade de cartão de crédito.' },
  { q: 'Como funciona o pagamento?', a: 'Os pagamentos são processados via Mercado Pago com cobrança mensal automática. Você pode cancelar a qualquer momento sem multa.' },
  { q: 'O sistema é seguro?', a: 'Sim. Utilizamos criptografia de ponta a ponta, certificação LGPD completa, backup automático semanal e audit trail em todas as operações.' },
  { q: 'Posso usar no celular?', a: 'Sim! O EloLab é um PWA (Progressive Web App) que funciona perfeitamente em qualquer dispositivo — smartphone, tablet ou desktop.' },
  { q: 'Quantos usuários posso ter?', a: 'Os planos incluem usuários ilimitados. Médicos, recepcionistas, enfermeiros e administradores podem acessar simultaneamente.' },
  { q: 'O que acontece se eu não pagar?', a: 'Enviamos lembretes automáticos. Após 2 dias de atraso, o acesso é temporariamente suspenso até a regularização, sem perda de dados.' },
];

const plans = [
  {
    name: 'EloLab Max',
    price: '299',
    desc: 'Ideal para clínicas em crescimento',
    popular: false,
    features: [
      'Agenda ilimitada',
      'Prontuário eletrônico',
      'Financeiro completo',
      'Gestão de estoque',
      'Relatórios e analytics',
      'Suporte por chat',
      'Backup automático',
      'Conformidade LGPD',
    ],
  },
  {
    name: 'EloLab Ultra',
    price: '399',
    desc: 'Para clínicas que querem o máximo',
    popular: true,
    features: [
      'Tudo do plano Max',
      'Agente IA WhatsApp',
      'Laboratório completo',
      'Portal do Paciente',
      'Automações avançadas',
      'Suporte prioritário',
      'Painel TV',
      'API & integrações',
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={elolabLogo} alt="EloLab" className="h-8 w-auto" loading="eager" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">Recursos</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-foreground transition-colors">Planos</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-foreground transition-colors">Depoimentos</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Entrar</Button>
            <Button onClick={() => scrollTo('pricing')} className="bg-primary text-primary-foreground">
              Começar Grátis
            </Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3"
          >
            <button onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-sm">Recursos</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left py-2 text-sm">Planos</button>
            <button onClick={() => scrollTo('testimonials')} className="block w-full text-left py-2 text-sm">Depoimentos</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left py-2 text-sm">FAQ</button>
            <Button variant="ghost" onClick={() => navigate('/auth')} className="w-full">Entrar</Button>
            <Button onClick={() => scrollTo('pricing')} className="w-full bg-primary text-primary-foreground">Começar Grátis</Button>
          </motion.div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand)/0.08),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                  <Zap className="w-3.5 h-3.5" /> 3 dias grátis • Sem cartão de crédito
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  Gestão clínica{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))]">
                    inteligente
                  </span>{' '}
                  e completa
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Agenda, prontuário, financeiro, laboratório e WhatsApp — tudo em um único sistema. 
                  Conformidade LGPD e segurança de ponta a ponta.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="xl" onClick={() => scrollTo('pricing')} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl">
                    Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button size="xl" variant="outline" onClick={() => scrollTo('features')}>
                    Ver Recursos
                  </Button>
                </div>
                <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-primary" /> LGPD</span>
                  <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-primary" /> PWA</span>
                  <span className="flex items-center gap-1.5"><HeadphonesIcon className="w-4 h-4 text-primary" /> Suporte</span>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-[hsl(var(--brand-glow)/0.15)] rounded-3xl blur-3xl" />
              <img
                src={heroDashboard}
                alt="Dashboard EloLab - Sistema de gestão clínica"
                className="relative rounded-2xl shadow-2xl border border-border/30"
                loading="eager"
                width={1280}
                height={800}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF STATS ═══ */}
      <section className="py-16 bg-card border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 500, suffix: '+', label: 'Clínicas ativas' },
            { value: 15000, suffix: '+', label: 'Pacientes gerenciados' },
            { value: 99, suffix: '.9%', label: 'Uptime garantido' },
            { value: 70, suffix: '%', label: 'Menos faltas' },
          ].map((s, i) => (
            <FadeInSection key={i} delay={i * 0.1}>
              <div className="text-3xl md:text-4xl font-bold text-foreground"><Counter end={s.value} suffix={s.suffix} /></div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Recursos</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Tudo que sua clínica precisa
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Módulos integrados que cobrem desde o agendamento até o financeiro, com automações inteligentes.
            </p>
          </FadeInSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA + IMAGE ═══ */}
      <section className="py-24 bg-card border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <img
                src={teamMedical}
                alt="Equipe médica usando EloLab"
                className="rounded-2xl shadow-xl"
                loading="lazy"
                width={800}
                height={600}
              />
            </FadeInSection>
            <FadeInSection delay={0.2}>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Feito por quem entende de{' '}
                <span className="text-primary">saúde digital</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Desenvolvido com feedback de centenas de profissionais de saúde. 
                Cada funcionalidade foi pensada para otimizar o dia a dia da clínica.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Redução de 70% nas faltas com lembretes automáticos',
                  'Prontuário eletrônico com assinatura digital ICP-Brasil',
                  'Faturamento TISS integrado com convênios',
                  'Conformidade total com LGPD e CFM',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="mt-8 bg-primary text-primary-foreground" onClick={() => scrollTo('pricing')}>
                Conheça os planos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Planos</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Escolha o plano ideal para sua clínica
            </h2>
            <p className="mt-4 text-muted-foreground">3 dias grátis em todos os planos. Cancele quando quiser.</p>
          </FadeInSection>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <FadeInSection key={i} delay={i * 0.15}>
                <div className={`relative rounded-2xl p-8 border transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'bg-card border-primary/30 shadow-lg shadow-primary/10 scale-[1.02]'
                    : 'bg-card border-border/50'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      Mais Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <div className="my-6 h-px bg-border" />
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Começar 3 dias grátis
                  </Button>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 bg-card border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              O que nossos clientes dizem
            </h2>
          </FadeInSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-background border border-border/50 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[hsl(38,92%,48%)] text-[hsl(38,92%,48%)]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Perguntas Frequentes
            </h2>
          </FadeInSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeInSection key={i} delay={i * 0.05}>
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-medium hover:bg-accent/40 transition-colors"
                  >
                    {faq.q}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-[hsl(var(--brand-glow)/0.05)]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <FadeInSection>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Pronto para transformar sua clínica?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Comece agora com 3 dias grátis. Sem cartão de crédito. Sem compromisso.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="xl" onClick={() => navigate('/auth')} className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                Criar Conta Grátis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="xl" variant="outline" onClick={() => scrollTo('features')}>
                Explorar Recursos
              </Button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card border-t border-border/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <img src={elolabLogo} alt="EloLab" className="h-8 w-auto mb-4" loading="lazy" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sistema completo de gestão para clínicas médicas e laboratórios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">Recursos</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-foreground transition-colors">Planos</button></li>
                <li><button onClick={() => scrollTo('testimonials')} className="hover:text-foreground transition-colors">Depoimentos</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/politica-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="/politica-cookies" className="hover:text-foreground transition-colors">Política de Cookies</a></li>
                <li><a href="/termos-uso" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>suporte@elolab.com.br</li>
                <li>(11) 9999-9999</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</p>
            <p className="text-xs text-muted-foreground">Feito com ❤️ para a saúde brasileira</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
