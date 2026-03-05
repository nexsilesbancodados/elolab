import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Check, Crown, Sparkles, Zap, Shield, Calendar, Users, FileText,
  Stethoscope, BarChart3, Bot, ArrowRight, Star, ChevronRight,
  Heart, Clock, Smartphone, LogIn, PlayCircle, DollarSign, Package,
  ClipboardList, Monitor, Brain, MessageSquare, HeadphonesIcon,
  CheckCircle2, Phone, Mail, MapPin, Menu, X, ChevronDown,
  Activity, Layers, Lock, TrendingUp, Award, ArrowUpRight,
} from 'lucide-react';
import heroInstitutional from '@/assets/hero-institutional.webp';
import doctorTablet from '@/assets/doctor-tablet.webp';
import clinicReception from '@/assets/clinic-reception.webp';
import whatsappAi from '@/assets/whatsapp-ai.webp';
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
    <div ref={ref} className="text-center group">
      <div className="text-4xl sm:text-5xl font-extrabold font-display tabular-nums text-foreground">
        {count.toLocaleString('pt-BR')}<span className="text-[hsl(168,76%,36%)]">{suffix}</span>
      </div>
      <div className="text-muted-foreground text-sm mt-2 font-medium">{label}</div>
    </div>
  );
}

/* ─── Scroll-reveal wrapper ─── */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
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
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática via WhatsApp.', color: 'hsl(200,80%,50%)' },
  { icon: FileText, title: 'Prontuário eletrônico', desc: 'Centralize todo o histórico clínico com segurança LGPD. Acesse de qualquer dispositivo.', color: 'hsl(168,76%,36%)' },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios detalhados.', color: 'hsl(38,92%,50%)' },
  { icon: ClipboardList, title: 'Laudos e exames', desc: 'Liberação de resultados via web com total segurança, rastreabilidade e assinatura digital.', color: 'hsl(280,65%,55%)' },
  { icon: BarChart3, title: 'Analytics e KPIs', desc: 'Dashboards inteligentes com indicadores em tempo real para decisões baseadas em dados.', color: 'hsl(0,72%,51%)' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Agente inteligente que agenda, confirma e responde pacientes 24h por dia, 7 dias por semana.', color: 'hsl(142,70%,35%)' },
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
  badge?: string;
  title: string;
  highlight: string;
  description: string;
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
        <span className="text-[hsl(168,76%,36%)]">{highlight}</span>
      </h2>
      <p className="text-[hsl(215,15%,45%)] text-lg leading-relaxed">{description}</p>
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
        toast.success('Redirecionando para o pagamento. Após aprovação, você receberá o código por e-mail.', { duration: 6000 });
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

  const navLinks = [
    { label: 'Funcionalidades', id: 'features' },
    { label: 'Diferenciais', id: 'differentials' },
    { label: 'WhatsApp IA', id: 'whatsapp-ai' },
    { label: 'Depoimentos', id: 'testimonials' },
    { label: 'Planos', id: 'pricing' },
  ];

  return (
    <div className="min-h-screen bg-white text-[hsl(215,28%,17%)] font-sans overflow-x-hidden">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-[hsl(220,13%,91%)]/50'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-2.5">
            <img src={logoInovalab} alt="EloLab" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-[22px] font-extrabold font-display tracking-tight">
              <span className={scrolled ? 'text-[hsl(215,28%,17%)]' : 'text-white'}>ELO</span>
              <span className="text-[hsl(168,76%,36%)]">LAB</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  scrolled
                    ? 'text-[hsl(215,15%,45%)] hover:text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Dropdown "Mais" */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    scrolled
                      ? 'text-[hsl(215,15%,45%)] hover:text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Mais <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl border-[hsl(220,13%,91%)] p-1.5 bg-white">
                <DropdownMenuLabel className="text-xs text-[hsl(215,15%,50%)] font-semibold uppercase tracking-wider px-3 py-2">
                  Atalhos rápidos
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/auth')} className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <LogIn className="mr-3 h-4 w-4 text-[hsl(168,76%,36%)]" />
                  <div>
                    <p className="font-medium text-sm">Acessar sistema</p>
                    <p className="text-xs text-[hsl(215,15%,55%)]">Login para usuários cadastrados</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollTo('pricing')} className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <Zap className="mr-3 h-4 w-4 text-[hsl(38,92%,50%)]" />
                  <div>
                    <p className="font-medium text-sm">Testar grátis</p>
                    <p className="text-xs text-[hsl(215,15%,55%)]">3 dias sem cartão de crédito</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-[hsl(220,13%,93%)]" />

                <DropdownMenuLabel className="text-xs text-[hsl(215,15%,50%)] font-semibold uppercase tracking-wider px-3 py-2">
                  Páginas
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/portal-paciente')} className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <Users className="mr-3 h-4 w-4 text-[hsl(200,80%,50%)]" />
                  <div>
                    <p className="font-medium text-sm">Portal do Paciente</p>
                    <p className="text-xs text-[hsl(215,15%,55%)]">Acesse resultados e agendamentos</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/aceitar-convite')} className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <Mail className="mr-3 h-4 w-4 text-[hsl(280,65%,55%)]" />
                  <div>
                    <p className="font-medium text-sm">Aceitar convite</p>
                    <p className="text-xs text-[hsl(215,15%,55%)]">Ativação de conta por convite</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-[hsl(220,13%,93%)]" />

                <DropdownMenuLabel className="text-xs text-[hsl(215,15%,50%)] font-semibold uppercase tracking-wider px-3 py-2">
                  Contato
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <a href="mailto:contato@elolab.com.br">
                    <Mail className="mr-3 h-4 w-4 text-[hsl(168,76%,36%)]" />
                    <div>
                      <p className="font-medium text-sm">Fale conosco</p>
                      <p className="text-xs text-[hsl(215,15%,55%)]">contato@elolab.com.br</p>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[hsl(168,76%,96%)] focus:bg-[hsl(168,76%,96%)]">
                  <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-3 h-4 w-4 text-[hsl(142,70%,35%)]" />
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-xs text-[hsl(215,15%,55%)]">Suporte via chat</p>
                    </div>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className={`hidden sm:inline-flex font-semibold ${
                scrolled
                  ? 'text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,96%)]'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-1.5 h-4 w-4" /> Entrar
            </Button>
            <Button
              size="sm"
              className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-lg shadow-[hsl(168,76%,36%)]/25 font-semibold px-5 rounded-lg"
              onClick={() => scrollTo('pricing')}
            >
              Começar grátis
            </Button>
            <button className="lg:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu
                ? <X className={`h-5 w-5 ${scrolled ? '' : 'text-white'}`} />
                : <Menu className={`h-5 w-5 ${scrolled ? '' : 'text-white'}`} />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden bg-white border-t px-4 pb-5 pt-2 shadow-lg animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="space-y-1 mb-3">
              {navLinks.map((item) => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className="block w-full text-left px-4 py-3 text-sm font-medium text-[hsl(215,15%,40%)] hover:bg-[hsl(168,76%,96%)] rounded-lg">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-[hsl(220,13%,93%)] pt-3 mb-3">
              <p className="px-4 py-1.5 text-[10px] font-bold text-[hsl(215,15%,55%)] uppercase tracking-widest">Páginas</p>
              <button onClick={() => { setMobileMenu(false); navigate('/portal-paciente'); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-[hsl(215,15%,40%)] hover:bg-[hsl(168,76%,96%)] rounded-lg">
                <Users className="h-4 w-4 text-[hsl(200,80%,50%)]" /> Portal do Paciente
              </button>
              <button onClick={() => { setMobileMenu(false); navigate('/aceitar-convite'); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-[hsl(215,15%,40%)] hover:bg-[hsl(168,76%,96%)] rounded-lg">
                <Mail className="h-4 w-4 text-[hsl(280,65%,55%)]" /> Aceitar convite
              </button>
            </div>

            <div className="border-t border-[hsl(220,13%,93%)] pt-3 mb-3">
              <p className="px-4 py-1.5 text-[10px] font-bold text-[hsl(215,15%,55%)] uppercase tracking-widest">Contato</p>
              <a href="mailto:contato@elolab.com.br" className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-[hsl(215,15%,40%)] hover:bg-[hsl(168,76%,96%)] rounded-lg">
                <Mail className="h-4 w-4 text-[hsl(168,76%,36%)]" /> contato@elolab.com.br
              </a>
            </div>

            <div className="border-t border-[hsl(220,13%,93%)] pt-3 space-y-2">
              <Button
                className="w-full bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white font-bold rounded-xl h-12 shadow-lg shadow-[hsl(168,76%,36%)]/20"
                onClick={() => { setMobileMenu(false); navigate('/auth'); }}
              >
                <LogIn className="mr-2 h-4 w-4" /> Entrar no sistema
              </Button>
              <Button
                variant="outline"
                className="w-full border-[hsl(220,13%,91%)] rounded-xl h-12 font-semibold"
                onClick={() => { setMobileMenu(false); scrollTo('pricing'); }}
              >
                Começar grátis
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={heroInstitutional}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(215,28%,10%)]/90 via-[hsl(215,28%,12%)]/80 to-[hsl(215,28%,15%)]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(215,28%,10%)]/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white rounded-full px-5 py-2.5 text-sm font-medium mb-8">
                <span className="flex h-2 w-2 rounded-full bg-[hsl(168,76%,50%)] animate-pulse" />
                Teste grátis por 3 dias — sem cartão de crédito
              </div>

              <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.05] tracking-tight font-display text-white mb-6">
                Software completo para{' '}
                <span className="text-[hsl(168,76%,50%)]">gestão clínica</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-[540px] mb-8">
                Agenda, prontuário eletrônico, financeiro e inteligência artificial em uma plataforma segura, moderna e em conformidade com a LGPD.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white shadow-2xl shadow-[hsl(168,76%,36%)]/30 text-base px-8 h-14 rounded-xl font-bold group"
                  onClick={() => scrollTo('pricing')}
                >
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-xl h-14 font-medium backdrop-blur-sm"
                  onClick={() => scrollTo('features')}
                >
                  <PlayCircle className="mr-2 h-5 w-5" /> Ver funcionalidades
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-8 text-sm text-white/50">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,50%)]" /> Sem fidelidade</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,50%)]" /> Suporte humano</span>
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(168,76%,50%)]" /> LGPD</span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/40" />
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="py-20 px-4 bg-[hsl(210,40%,98%)] border-b border-[hsl(220,13%,91%)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
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
            <SectionHeading
              badge="✨ Funcionalidades"
              title="Tudo que sua clínica precisa,"
              highlight="em um só lugar"
              description="Ferramentas profissionais para otimizar cada etapa da gestão clínica, do agendamento ao faturamento."
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((f, i) => (
              <Reveal key={i}>
                <div className="group relative bg-white border border-[hsl(220,13%,91%)] rounded-2xl p-7 hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-300 h-full">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${f.color}10` }}
                  >
                    <f.icon className="h-6 w-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-[17px] mb-2 font-display">{f.title}</h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: f.color }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LARGE FEATURE - PRONTUÁRIO ═══════════════ */}
      <section className="py-24 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 text-[hsl(168,76%,30%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-5 border border-[hsl(168,76%,36%)]/15">
                <FileText className="h-3.5 w-3.5" /> Prontuário Eletrônico
              </span>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-display leading-tight mb-5">
                Prontuário completo,{' '}
                <span className="text-[hsl(168,76%,36%)]">seguro e acessível</span>
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
                      <h4 className="font-bold text-[15px] mb-0.5">{item.title}</h4>
                      <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="delay-200">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(168,76%,36%)]/6 to-transparent rounded-[2rem] blur-2xl" />
              <img
                src={doctorTablet}
                alt="Médica utilizando prontuário eletrônico EloLab no tablet"
                className="relative z-10 w-full rounded-2xl shadow-2xl shadow-black/12 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ DIFFERENTIALS GRID ═══════════════ */}
      <section id="differentials" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              badge="🏥 Diferenciais"
              title="Por que clínicas escolhem o"
              highlight="EloLab"
              description="Tecnologia médica de ponta com segurança, praticidade e suporte humano dedicado."
            />
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentials.map((f, i) => (
              <Reveal key={i}>
                <div className="group bg-[hsl(210,40%,98%)] hover:bg-white rounded-2xl border border-transparent hover:border-[hsl(220,13%,91%)] p-7 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-[hsl(168,76%,36%)]/8 flex items-center justify-center mb-5 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                    <f.icon className="h-6 w-6 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-[16px] mb-1.5 font-display">{f.title}</h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ RECEPTION / CLINIC ═══════════════ */}
      <section className="py-24 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(40,90%,55%)]/6 to-[hsl(168,76%,36%)]/4 rounded-[2rem] blur-2xl" />
              <img
                src={clinicReception}
                alt="Recepção moderna de clínica com EloLab"
                className="relative z-10 w-full rounded-2xl shadow-2xl shadow-black/12 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2 delay-200">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 bg-[hsl(40,90%,92%)] text-[hsl(40,80%,30%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-[hsl(40,90%,60%)]/25">
                <Heart className="h-3.5 w-3.5" /> Experiência do Paciente
              </span>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-display leading-tight">
                Modernize a{' '}
                <span className="text-[hsl(40,85%,48%)]">recepção</span>{' '}
                da sua clínica
              </h2>
              <p className="text-[hsl(215,15%,42%)] leading-relaxed max-w-md">
                Painel TV em tempo real, fila de atendimento digital e check-in automatizado para uma experiência moderna e eficiente.
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
                      style={{ backgroundColor: `${item.color}10` }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-[15px] font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ WHATSAPP AI ═══════════════ */}
      <section id="whatsapp-ai" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 bg-[hsl(142,70%,92%)] text-[hsl(142,70%,28%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-[hsl(142,70%,60%)]/25 mb-5">
                🤖 Inteligência Artificial
              </span>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold font-display leading-tight mb-5">
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
                    <div className="h-10 w-10 rounded-xl bg-[hsl(142,70%,92%)] flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-[hsl(142,70%,35%)]" />
                    </div>
                    <span className="text-[15px] font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-[hsl(142,70%,96%)] rounded-xl border border-[hsl(142,70%,75%)]/30">
                <p className="text-sm text-[hsl(142,70%,25%)] font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[hsl(40,90%,50%)]" />
                  Exclusivo do plano <strong>EloLab Ultra</strong>
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal className="delay-200">
            <div className="relative flex justify-center">
              <div className="absolute -inset-6 bg-[hsl(142,70%,50%)]/5 rounded-[2.5rem] blur-2xl" />
              <img
                src={whatsappAi}
                alt="WhatsApp com agente IA do EloLab"
                className="relative z-10 w-full max-w-[360px] rounded-[2rem] shadow-2xl shadow-black/12 ring-1 ring-black/5"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="py-24 px-4 bg-[hsl(210,40%,98%)]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              badge="⭐ Depoimentos"
              title="Quem usa,"
              highlight="recomenda"
              description="Veja o que profissionais de saúde dizem sobre o EloLab."
            />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={i}>
                <Card className="border-[hsl(220,13%,91%)]/60 bg-white shadow-sm hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300 rounded-2xl h-full">
                  <CardContent className="p-7">
                    <div className="flex gap-0.5 mb-5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[hsl(40,90%,55%)] text-[hsl(40,90%,55%)]" />
                      ))}
                    </div>
                    <p className="text-[15px] text-[hsl(215,15%,35%)] mb-6 leading-relaxed italic">"{t.text}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-[hsl(220,13%,93%)]">
                      <div className="h-11 w-11 rounded-full bg-[hsl(168,76%,36%)]/8 flex items-center justify-center text-lg">
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
            <SectionHeading
              badge="💳 Planos e preços"
              title="Escolha o plano ideal para"
              highlight="sua clínica"
              description="Comece com 3 dias grátis. Sem cartão de crédito. Cancele quando quiser."
            />
          </Reveal>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {planos?.map((plano: any) => {
              const isHighlighted = plano.destaque;
              return (
                <Reveal key={plano.id}>
                  <Card
                    className={`relative flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300 ${
                      isHighlighted
                        ? 'border-2 border-[hsl(168,76%,36%)] shadow-2xl shadow-[hsl(168,76%,36%)]/10 scale-[1.02]'
                        : 'border border-[hsl(220,13%,91%)] shadow-lg hover:shadow-xl'
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
                      <CardTitle className="text-2xl font-extrabold font-display">{plano.nome}</CardTitle>
                      <p className="text-sm text-[hsl(215,15%,50%)] mt-1">{plano.descricao}</p>
                    </CardHeader>
                    <CardContent className="text-center pb-4">
                      <div className="mb-3 pt-2">
                        <span className="text-sm text-[hsl(215,15%,50%)] align-top">R$ </span>
                        <span className="text-[3.5rem] font-extrabold leading-none tracking-tight font-display">{Math.floor(plano.valor)}</span>
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
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,28%,14%)] via-[hsl(215,30%,11%)] to-[hsl(215,35%,8%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[hsl(168,76%,36%)]/[0.06] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[hsl(200,80%,50%)]/[0.04] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10 py-28 px-4">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur rounded-full px-5 py-2.5 text-sm text-white/70 font-medium mb-8 border border-white/10">
              <Award className="h-4 w-4 text-[hsl(168,76%,50%)]" /> +500 clínicas já confiam no EloLab
            </div>
            <h2 className="text-3xl sm:text-[2.75rem] font-extrabold font-display text-white leading-tight mb-5">
              Comece a transformar sua clínica hoje
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Junte-se a milhares de profissionais de saúde que já simplificaram a gestão do consultório com o EloLab.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white rounded-xl text-base px-8 h-14 shadow-2xl shadow-[hsl(168,76%,36%)]/25 font-bold"
                onClick={() => scrollTo('pricing')}
              >
                Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/8 rounded-xl text-base px-8 h-14 font-medium"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="mr-2 h-5 w-5" /> Já tenho conta
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[hsl(215,28%,8%)] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <img src={logoInovalab} alt="EloLab" className="h-9 w-9 rounded-lg object-contain" />
                <span className="text-xl font-extrabold font-display tracking-tight">
                  ELO<span className="text-[hsl(168,76%,36%)]">LAB</span>
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/35">
                <a href="mailto:contato@elolab.com.br" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                  <Mail className="h-4 w-4" /> contato@elolab.com.br
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white/60 uppercase tracking-wider">Produto</h4>
              <div className="space-y-3 text-sm text-white/40">
                <button onClick={() => scrollTo('features')} className="block hover:text-white/80 transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white/80 transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('testimonials')} className="block hover:text-white/80 transition-colors">Depoimentos</button>
                <button onClick={() => scrollTo('whatsapp-ai')} className="block hover:text-white/80 transition-colors">IA WhatsApp</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-white/60 uppercase tracking-wider">Acesso</h4>
              <div className="space-y-3 text-sm text-white/40">
                <button onClick={() => navigate('/auth')} className="block hover:text-white/80 transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white/80 transition-colors">Criar conta grátis</button>
                <a href="mailto:contato@elolab.com.br" className="block hover:text-white/80 transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ CHECKOUT DIALOG ═══════════════ */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold font-display">Assine o {selectedPlan?.nome}</DialogTitle>
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

            <div className="bg-[hsl(168,76%,95%)] rounded-xl p-4 border border-[hsl(168,76%,36%)]/12">
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
                className="h-14 flex flex-col items-center justify-center gap-0.5 border-[hsl(168,76%,36%)] text-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,36%)]/8 rounded-xl"
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
