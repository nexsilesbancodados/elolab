import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Calendar, Users, FileText, Stethoscope, BarChart3, Bot,
  ArrowRight, Star, Heart, Clock, Smartphone, LogIn,
  DollarSign, Mail, ClipboardList, Monitor, MessageSquare,
  CheckCircle2, Shield, Activity, Layers, Lock, Award,
  MousePointerClick, Rocket, Settings2, Sparkles, Zap,
} from 'lucide-react';
import dashboardPreview from '@/assets/dashboard-preview.webp';
import whatsappPhone from '@/assets/whatsapp-phone.webp';
import logoInovalab from '@/assets/logo-icon.png';

/* ─── data ─── */
const featureCards = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática via WhatsApp.' },
  { icon: FileText, title: 'Prontuário eletrônico', desc: 'Centralize todo o histórico clínico com segurança LGPD. Acesse de qualquer dispositivo.' },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios detalhados.' },
  { icon: ClipboardList, title: 'Laudos e exames', desc: 'Liberação de resultados via web com total segurança, rastreabilidade e assinatura digital.' },
  { icon: BarChart3, title: 'Analytics e KPIs', desc: 'Dashboards inteligentes com indicadores em tempo real para decisões baseadas em dados.' },
  { icon: Bot, title: 'IA no WhatsApp', desc: 'Agente inteligente que agenda, confirma e responde pacientes 24h por dia, 7 dias por semana.' },
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
  { name: 'Dra. Fernanda Lima', role: 'Dermatologista', text: 'Reduzi 40% do tempo administrativo com o EloLab. O prontuário eletrônico é incrível!', avatar: '👩‍⚕️' },
  { name: 'Dr. Carlos Mendes', role: 'Ortopedista', text: 'O agente de IA no WhatsApp revolucionou meu consultório. Atendimento 24h sem esforço.', avatar: '👨‍⚕️' },
  { name: 'Dra. Ana Souza', role: 'Pediatra', text: 'A triagem Manchester e a fila de atendimento mudaram completamente o fluxo da clínica.', avatar: '👩‍⚕️' },
];

const faqs = [
  { q: 'Quanto tempo leva para configurar?', a: 'Menos de 10 minutos. Crie sua conta, cadastre médicos e salas, e comece a agendar.' },
  { q: 'Preciso instalar software?', a: 'Não! O EloLab é 100% web. Funciona no navegador do computador, celular ou tablet.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia de ponta, servidores seguros e total conformidade com a LGPD.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem fidelidade. Cancele quando quiser sem taxa adicional.' },
  { q: 'Como funciona o agente IA?', a: 'O agente IA responde pacientes automaticamente, agenda consultas e envia lembretes via WhatsApp 24h.' },
  { q: 'Vocês oferecem suporte?', a: 'Sim! Suporte humano dedicado por e-mail e WhatsApp para todos os planos.' },
];

const stats = [
  { value: '12M+', label: 'Marcações agendadas', icon: Calendar },
  { value: '3M+', label: 'Pacientes atendidos', icon: Users },
  { value: '10K+', label: 'Médicos cadastrados', icon: Stethoscope },
  { value: '500+', label: 'Clientes ativos', icon: Heart },
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
      <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight mb-4">
        {title}{' '}
        <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">{highlight}</span>
      </h2>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle return from Mercado Pago checkout
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* NAVBAR */}
      <EloLabNavbar scrolled={scrolled} onScrollTo={scrollTo} />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-background to-[hsl(168,76%,97%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 border border-[hsl(168,76%,36%)]/15 text-[hsl(168,76%,30%)] rounded-full px-5 py-2.5 text-sm font-medium mb-8">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(168,76%,50%)]" />
                Teste grátis por 3 dias — sem cartão
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight font-display text-foreground mb-6">
                Gestão clínica{' '}
                <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">
                  inteligente
                </span>{' '}
                e completa
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-[540px] mb-10">
                Agenda, prontuário eletrônico, financeiro e IA em uma plataforma segura, moderna e em conformidade com a LGPD.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[hsl(168,76%,36%)] hover:bg-[hsl(168,76%,30%)] text-white text-base px-8 h-14 rounded-xl font-bold shadow-lg shadow-[hsl(168,76%,36%)]/20 group"
                  onClick={() => scrollTo('pricing')}
                >
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[hsl(168,76%,36%)]/30 text-[hsl(168,76%,30%)] hover:bg-[hsl(168,76%,36%)]/8 rounded-xl h-14 font-medium"
                  onClick={() => scrollTo('features')}
                >
                  Ver funcionalidades
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-10 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Sem fidelidade</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[hsl(168,76%,36%)]" /> Suporte humano</span>
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(168,76%,36%)]" /> LGPD</span>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="hidden lg:block">
              <div className="relative bg-card border border-border rounded-2xl p-4 shadow-xl">
                <div className="flex gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,60%)]" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,75%)]" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(168,76%,85%)]" />
                </div>
                <img src={dashboardPreview} alt="Dashboard EloLab" className="w-full rounded-xl" loading="eager" width={600} height={400} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-20 px-4 bg-[hsl(168,76%,97%)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm font-semibold text-[hsl(168,76%,50%)] uppercase tracking-widest mb-12">
            Números que comprovam resultados
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-[hsl(168,76%,36%)]/10 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-[hsl(168,76%,36%)]" />
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold font-display tabular-nums text-foreground">{s.value}</div>
                <div className="text-muted-foreground text-sm mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-28 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="✨ Funcionalidades"
            title="Tudo que sua clínica precisa,"
            highlight="em um só lugar"
            description="Ferramentas profissionais para otimizar cada etapa da gestão clínica."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((f, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-[hsl(168,76%,36%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                  <f.icon className="h-6 w-6 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-base mb-2 font-display text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA RIBBON ═══ */}
      <section className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,45%)]">
        <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white font-display">Teste grátis por 3 dias!</h3>
              <p className="text-white/70 text-sm">Sem cartão · Sem compromisso · Cancele quando quiser</p>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl h-13 px-8 font-bold shadow-lg shrink-0"
            onClick={() => scrollTo('pricing')}
          >
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-28 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="🚀 Como funciona"
            title="Comece em"
            highlight="3 passos simples"
            description="Sem burocracia, sem instalação. Configure sua clínica em minutos."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-[hsl(168,76%,36%)] flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-[hsl(168,76%,36%)]/20 mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-extrabold font-display mb-3 text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DIFFERENTIALS ═══ */}
      <section id="differentials" className="py-28 px-4 bg-[hsl(168,76%,97%)]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="🏥 Diferenciais" title="Por que clínicas escolhem o" highlight="EloLab" description="Tecnologia médica de ponta com segurança, praticidade e suporte humano dedicado." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {differentials.map((f, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-[hsl(168,76%,36%)]/8 flex items-center justify-center mb-4 group-hover:bg-[hsl(168,76%,36%)] transition-colors duration-300">
                  <f.icon className="h-5 w-5 text-[hsl(168,76%,36%)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-[15px] mb-1 font-display text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHATSAPP AI ═══ */}
      <section id="whatsapp-ai" className="py-28 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-[hsl(168,76%,36%)]/8 text-[hsl(168,76%,30%)] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-[hsl(168,76%,36%)]/15 mb-5">
              🤖 Inteligência Artificial
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight mb-5 text-foreground">
              Agente IA no WhatsApp{' '}
              <span className="bg-gradient-to-r from-[hsl(168,76%,36%)] to-[hsl(168,76%,50%)] bg-clip-text text-transparent">que atende 24h</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
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
                  <span className="text-[15px] font-medium text-foreground">{item.text}</span>
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
          <div className="flex justify-center">
            <img src={whatsappPhone} alt="WhatsApp com agente IA" className="w-full max-w-[320px] rounded-2xl shadow-xl" loading="lazy" width={320} height={640} />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-28 px-4 bg-[hsl(168,76%,97%)]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="⭐ Depoimentos" title="Quem usa," highlight="recomenda" description="Veja o que profissionais de saúde dizem sobre o EloLab." />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border bg-card rounded-2xl hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-7">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[hsl(168,76%,45%)] text-[hsl(168,76%,45%)]" />
                    ))}
                  </div>
                  <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4">
                    <div className="h-11 w-11 rounded-full bg-[hsl(168,76%,36%)]/10 flex items-center justify-center text-lg">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-[hsl(168,76%,36%)] font-medium">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing">
        <ModernPricingSection
          title={<>Escolha o plano ideal para <span className="text-[hsl(168,76%,36%)]">sua clínica</span></>}
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
      <section id="faq" className="py-28 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <SectionHeading badge="❓ Perguntas frequentes" title="Tire suas" highlight="dúvidas" description="Tudo que você precisa saber antes de começar." />
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left text-[15px] font-bold py-5 hover:no-underline text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="bg-gradient-to-br from-[hsl(168,76%,30%)] via-[hsl(168,60%,25%)] to-[hsl(215,28%,17%)] py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-5 py-2.5 text-sm text-white font-medium mb-8 border border-white/20">
            <Award className="h-4 w-4" /> +500 clínicas já confiam no EloLab
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white leading-tight mb-5">
            Comece a transformar sua clínica hoje
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Junte-se a milhares de profissionais de saúde que já simplificaram a gestão do consultório.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-[hsl(168,76%,30%)] hover:bg-white/90 rounded-xl text-base px-8 h-14 shadow-lg font-bold group"
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
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[hsl(168,76%,97%)] text-foreground py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={logoInovalab} alt="EloLab" className="h-9 w-9 rounded-lg object-contain" width={36} height={36} />
                <span className="text-xl font-extrabold font-display tracking-tight">
                  ELO<span className="text-[hsl(168,76%,36%)]">LAB</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-6">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <a href="mailto:contato@elolab.com.br" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(168,76%,36%)] transition-colors">
                <Mail className="h-4 w-4" /> contato@elolab.com.br
              </a>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-[hsl(168,76%,36%)] uppercase tracking-wider">Produto</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <button onClick={() => scrollTo('features')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('how-it-works')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Como funciona</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('faq')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">FAQ</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-[hsl(168,76%,36%)] uppercase tracking-wider">Acesso</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <button onClick={() => navigate('/auth')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Criar conta grátis</button>
                <button onClick={() => navigate('/portal-paciente')} className="block hover:text-[hsl(168,76%,36%)] transition-colors">Portal do Paciente</button>
                <a href="mailto:contato@elolab.com.br" className="block hover:text-[hsl(168,76%,36%)] transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[hsl(168,76%,36%)]" /> Em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ CHECKOUT DIALOG ═══ */}
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
                  <p className="text-sm text-muted-foreground">{selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês</p>
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
    </div>
  );
}
