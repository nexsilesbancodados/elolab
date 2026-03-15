import { useState, useEffect } from 'react';
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
  MousePointerClick, Rocket, Settings2, Sparkles, Zap, Play,
} from 'lucide-react';
import dashboardPreview from '@/assets/dashboard-preview.webp';
import whatsappPhone from '@/assets/whatsapp-phone.webp';
import logoInovalab from '@/assets/logo-icon.png';

/* ─── data ─── */
const featureCards = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Agendamento online com recorrência, fila de espera e confirmação automática via WhatsApp.', color: 'text-brand' },
  { icon: FileText, title: 'Prontuário eletrônico', desc: 'Centralize todo o histórico clínico com segurança LGPD. Acesse de qualquer dispositivo.', color: 'text-success' },
  { icon: DollarSign, title: 'Financeiro completo', desc: 'Fluxo de caixa, contas a pagar/receber, faturamento TISS e relatórios detalhados.', color: 'text-info' },
];

const moreFeatures = [
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
function SectionHeading({ badge, title, description, center = true }: {
  badge?: string; title: string; description: string; center?: boolean;
}) {
  return (
    <div className={`mb-14 max-w-2xl ${center ? 'text-center mx-auto' : ''}`}>
      {badge && (
        <span className="inline-block bg-brand/8 text-brand rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-brand/12">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-4 text-foreground">
        {title}
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
      <EloLabNavbar scrolled={scrolled} onScrollTo={scrollTo} />

      {/* ═══ HERO — Bold blue like 4Medic ═══ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ background: 'hsl(240 100% 28%)' }}>
        {/* Decorative circle */}
        <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full hidden lg:block" style={{ background: 'hsl(240 100% 34% / 0.6)' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 border border-white/20 text-white/80 rounded-full px-5 py-2 text-sm font-medium mb-8 bg-white/5">
                TEMPO PARA VIVER
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight font-display text-white mb-6">
                Sistema Médico Completo para Clínicas e Consultórios
              </h1>

              <p className="text-lg text-white/70 leading-relaxed max-w-[540px] mb-10">
                Otimize sua rotina com um sistema médico completo: gestão de pacientes, agenda, prontuário e finanças em um só lugar. Simples, seguro e eficaz.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-white text-brand hover:bg-white/90 text-base px-8 h-14 rounded-xl font-semibold shadow-lg group"
                  onClick={() => scrollTo('pricing')}
                >
                  Fale com especialistas
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 rounded-xl h-14 font-medium"
                  onClick={() => scrollTo('features')}
                >
                  <Play className="mr-2 h-4 w-4" /> Assistir demonstração
                </Button>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Floating icons like 4Medic */}
                <div className="absolute -left-6 top-1/4 h-14 w-14 rounded-2xl bg-info flex items-center justify-center shadow-lg z-10">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -right-4 top-1/3 h-12 w-12 rounded-2xl bg-success flex items-center justify-center shadow-lg z-10">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="absolute left-1/4 -bottom-4 h-14 w-14 rounded-2xl bg-destructive flex items-center justify-center shadow-lg z-10">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <img src={dashboardPreview} alt="Dashboard EloLab" className="w-full rounded-2xl shadow-2xl" loading="eager" width={600} height={400} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom curve like 4Medic */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 30C1200 0 900 60 720 40C540 20 240 0 0 30L0 80Z" fill="hsl(0 0% 100%)" />
          </svg>
        </div>
      </section>

      {/* ═══ FEATURES — 3 cards on beige like 4Medic ═══ */}
      <section id="features" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="PRINCIPAIS RECURSOS"
            title="Tudo o que sua clínica precisa, em um único lugar"
            description="Ferramentas profissionais para otimizar cada etapa da gestão clínica."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {featureCards.map((f, i) => (
              <div key={i} className="bg-accent rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group">
                <div className={`h-14 w-14 rounded-xl bg-brand flex items-center justify-center mb-6 shadow-md`}>
                  <f.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                <button className="mt-5 text-brand font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Saiba mais <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORGANIZATION SECTION — Image + text like 4Medic ═══ */}
      <section className="py-24 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <img src={dashboardPreview} alt="Organização de ponta a ponta" className="w-full rounded-2xl shadow-lg" loading="lazy" width={600} height={400} />
          </div>
          <div>
            <span className="inline-block bg-brand/8 text-brand rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-brand/12">
              TUDO O QUE VOCÊ PRECISA
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-5 text-foreground">
              Organização de ponta a ponta na sua clínica
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              A metodologia de organização de processos do EloLab é baseada nos principais pilares de uma clínica: Agenda, Financeiro e Prontuário. Integração e organização nos principais setores.
            </p>
            <Button
              size="lg"
              className="bg-brand hover:bg-brand-hover text-brand-foreground rounded-xl h-13 px-7 font-semibold shadow-md"
              onClick={() => scrollTo('pricing')}
            >
              Assistir demonstração <Play className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ EASE OF USE — like 4Medic ═══ */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-brand/8 text-brand rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-brand/12">
              FACILIDADE DE USO
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-5 text-foreground">
              Tenha uma rotina eficiente, sem nenhuma complicação
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Personalize modelos de exames, atestados e encaminhamentos, e atenda melhor seus pacientes. Nosso prontuário eletrônico é intuitivo, rápido e organizado.
            </p>
            <div className="space-y-4">
              {moreFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand/8 flex items-center justify-center shrink-0">
                    <f.icon className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{f.title}</h4>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img src={whatsappPhone} alt="Interface intuitiva EloLab" className="w-full max-w-[340px] mx-auto rounded-2xl shadow-lg" loading="lazy" width={340} height={680} />
          </div>
        </div>
      </section>

      {/* ═══ SUPPORT SECTION — like 4Medic ═══ */}
      <section className="py-24 px-4" style={{ background: 'hsl(240 100% 28%)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/10 text-white/80 rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-white/15">
            SUPORTE REAL, PESSOAS REAIS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight mb-5">
            Aqui não tem robôzinho, nosso suporte é humanizado
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Gostamos de uma boa conversa e nossos especialistas estão sempre à disposição. Chega de longas esperas. Aqui você fala com pessoas reais.
          </p>
          <Button
            size="lg"
            className="bg-white text-brand hover:bg-white/90 rounded-xl h-14 px-8 font-semibold shadow-lg"
            onClick={() => scrollTo('pricing')}
          >
            Fale com especialistas <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ═══ SECURITY — like 4Medic ═══ */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-brand/8 text-brand rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-brand/12">
              PROTEÇÃO QUE VOCÊ PODE CONFIAR
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display leading-tight mb-5 text-foreground">
              Os dados dos seus pacientes 100% protegidos
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Nossos servidores têm tecnologia de segurança bancária, com altos níveis de privacidade, backups diários e sem perdas, além de um sistema de permissões de usuários 100% customizável.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Lock, text: 'Criptografia de ponta' },
                { icon: Shield, text: 'Compliance LGPD' },
                { icon: Activity, text: 'Backups diários' },
                { icon: Users, text: 'Permissões granulares' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-accent rounded-xl p-3">
                  <item.icon className="h-5 w-5 text-brand shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-[400px]">
              <div className="bg-accent rounded-2xl p-8 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-brand/10 flex items-center justify-center mb-6">
                  <Shield className="h-10 w-10 text-brand" />
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-2">Segurança Bancária</h3>
                <p className="text-muted-foreground text-sm">Seus dados protegidos com os mais altos padrões de segurança do mercado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-20 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-brand flex items-center justify-center shadow-md">
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold font-display tabular-nums text-foreground">{s.value}</div>
                <div className="text-muted-foreground text-sm mt-1.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="COMO FUNCIONA"
            title="Comece em 3 passos simples"
            description="Sem burocracia, sem instalação. Configure sua clínica em minutos."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-xl shadow-lg mb-6">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold font-display mb-2.5 text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DIFFERENTIALS ═══ */}
      <section id="differentials" className="py-24 px-4 bg-accent">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="DIFERENCIAIS" title="Por que clínicas escolhem o EloLab" description="Tecnologia médica de ponta com segurança, praticidade e suporte humano dedicado." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {differentials.map((f, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-brand/8 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold text-base mb-2 font-display text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <SectionHeading badge="NOSSOS CLIENTES" title="Histórias de quem faz acontecer com o EloLab" description="Veja o que profissionais de saúde dizem sobre nossa plataforma." />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/60 bg-card rounded-2xl hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-7">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <div className="h-11 w-11 rounded-full bg-brand/8 flex items-center justify-center text-lg">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-brand font-medium">{t.role}</p>
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
      <section id="faq" className="py-24 px-4 bg-secondary">
        <div className="max-w-3xl mx-auto">
          <SectionHeading badge="PERGUNTAS FREQUENTES" title="Tire suas dúvidas" description="Tudo que você precisa saber antes de começar." />
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/60 rounded-xl px-6">
                <AccordionTrigger className="text-left text-sm font-semibold py-5 hover:no-underline text-foreground">
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

      {/* ═══ FINAL CTA — Bold blue like 4Medic ═══ */}
      <section style={{ background: 'hsl(240 100% 28%)' }} className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 text-white/80 rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5 border border-white/15">
            COMECE AGORA
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight mb-5">
            Quer saber como o EloLab pode simplificar a gestão da sua clínica?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Entre em contato com a gente. Nossa equipe de especialistas está preparada para apresentar nossa plataforma e esclarecer suas dúvidas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-brand hover:bg-white/90 rounded-xl text-base px-8 h-14 shadow-lg font-semibold group"
              onClick={() => scrollTo('pricing')}
            >
              Testar grátis 3 dias <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 text-white hover:bg-white/10 rounded-xl text-base px-8 h-14 font-medium"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-2 h-5 w-5" /> Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-foreground text-white py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={logoInovalab} alt="EloLab" className="h-8 w-8 rounded-lg object-contain" width={32} height={32} />
                <span className="text-lg font-bold font-display tracking-tight text-white">
                  ELO<span className="text-brand-glow">LAB</span>
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-5">
                Software de gestão completo para clínicas e consultórios médicos. Agenda, prontuário, financeiro e IA — tudo em um só lugar.
              </p>
              <a href="mailto:contato@elolab.com.br" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <Mail className="h-4 w-4" /> contato@elolab.com.br
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/40 uppercase tracking-wider">Produto</h4>
              <div className="space-y-2.5 text-sm text-white/60">
                <button onClick={() => scrollTo('features')} className="block hover:text-white transition-colors">Funcionalidades</button>
                <button onClick={() => scrollTo('how-it-works')} className="block hover:text-white transition-colors">Como funciona</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white transition-colors">Planos e preços</button>
                <button onClick={() => scrollTo('faq')} className="block hover:text-white transition-colors">FAQ</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/40 uppercase tracking-wider">Acesso</h4>
              <div className="space-y-2.5 text-sm text-white/60">
                <button onClick={() => navigate('/auth')} className="block hover:text-white transition-colors">Login</button>
                <button onClick={() => scrollTo('pricing')} className="block hover:text-white transition-colors">Criar conta grátis</button>
                <button onClick={() => navigate('/portal-paciente')} className="block hover:text-white transition-colors">Portal do Paciente</button>
                <a href="mailto:contato@elolab.com.br" className="block hover:text-white transition-colors">Suporte</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <span>© {new Date().getFullYear()} EloLab. Todos os direitos reservados.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Em conformidade com a LGPD
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ CHECKOUT DIALOG ═══ */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
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
            <div className="bg-accent rounded-xl p-4 border border-brand/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{selectedPlan?.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.valor)}/mês</p>
                </div>
                <Badge className="bg-brand text-brand-foreground text-xs font-semibold">{selectedPlan?.trial_dias || 3} dias grátis</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button onClick={() => handleCheckout('trial')} disabled={checkoutMutation.isPending} variant="outline" className="h-14 flex flex-col items-center justify-center gap-0.5 border-brand text-brand hover:bg-brand/5 rounded-xl">
                <span className="text-sm font-semibold">{checkoutMutation.isPending ? 'Processando...' : 'Testar grátis'}</span>
                <span className="text-[10px] font-normal opacity-70">Sem cartão de crédito</span>
              </Button>
              <Button onClick={() => handleCheckout('buy')} disabled={checkoutMutation.isPending} className="h-14 flex flex-col items-center justify-center gap-0.5 bg-brand hover:bg-brand-hover text-brand-foreground font-semibold rounded-xl">
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
