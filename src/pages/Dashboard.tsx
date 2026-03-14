import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes, useAgendamentos, useLancamentos, useEstoque, useMedicos, useFilaAtendimento } from '@/hooks/useSupabaseData';
import {
  Users,
  Calendar,
  Clock,
  UserPlus,
  CalendarPlus,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Stethoscope,
  Package,
  FileText,
  Database,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Plus,
  Zap,
  BarChart3,
  ClipboardList,
  HeartPulse,
  Bell,
  Sun,
  Sunset,
  Moon,
  Star,
  ChevronRight,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

// ─── Animation variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Sparkline Mini Chart ──────────────────────────────────
function Sparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Metric Card with Sparkline ────────────────────────────
function MetricCard({
  title, value, subtitle, icon: Icon, color, href, delay = 0, sparkData, sparkColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  href?: string;
  delay?: number;
  sparkData?: number[];
  sparkColor?: string;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20', spark: 'hsl(var(--primary))' },
    success: { bg: 'bg-success/10', text: 'text-success', ring: 'ring-success/20', spark: 'hsl(var(--success))' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', ring: 'ring-warning/20', spark: 'hsl(var(--warning))' },
    info: { bg: 'bg-info/10', text: 'text-info', ring: 'ring-info/20', spark: 'hsl(var(--info))' },
    destructive: { bg: 'bg-destructive/10', text: 'text-destructive', ring: 'ring-destructive/20', spark: 'hsl(var(--destructive))' },
  };
  const c = colorMap[color];

  const content = (
    <motion.div variants={fadeUp} custom={delay / 60}>
      <Card className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
      )}>
        <CardContent className="pt-5 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-2xl font-bold font-display tracking-tight">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={cn(
              'h-11 w-11 rounded-xl flex items-center justify-center ring-1 transition-transform group-hover:scale-110',
              c.bg, c.ring,
            )}>
              <Icon className={cn('h-5 w-5', c.text)} />
            </div>
          </div>
          {sparkData && sparkData.length > 1 && (
            <div className="opacity-60 group-hover:opacity-100 transition-opacity -mx-1">
              <Sparkline data={sparkData} color={sparkColor ?? c.spark} />
            </div>
          )}
        </CardContent>
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
            <ArrowUpRight className={cn('h-4 w-4', c.text)} />
          </div>
        )}
      </Card>
    </motion.div>
  );

  return href ? <Link to={href} className="block">{content}</Link> : content;
}

// ─── Financial Mini Card ───────────────────────────────────
function FinanceChip({ label, value, icon: Icon, variant }: {
  label: string;
  value: string;
  icon: any;
  variant: 'positive' | 'neutral' | 'negative' | 'danger';
}) {
  const variantMap = {
    positive: 'bg-success/5 border-success/20 text-success',
    neutral: 'bg-warning/5 border-warning/20 text-warning',
    negative: 'bg-destructive/5 border-destructive/20 text-destructive',
    danger: 'bg-destructive/5 border-destructive/20 text-destructive',
  };

  return (
    <motion.div variants={fadeUp}>
      <div className={cn(
        'rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors hover:shadow-sm',
        variantMap[variant],
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
          <p className="text-base font-bold truncate">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Today Focus Card ──────────────────────────────────────
function TodayFocusCard({
  icon: Icon, label, value, sub, href, color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  href: string;
  color: string;
}) {
  return (
    <Link to={href}>
      <div className={cn(
        'group flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 bg-card',
      )}>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="font-semibold text-sm truncate">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>
    </Link>
  );
}

// ─── Welcome Banner ────────────────────────────────────────
function WelcomeBanner({
  name, saudacao, horaAtual, hojeFormatado,
}: {
  name: string;
  saudacao: string;
  horaAtual: number;
  hojeFormatado: string;
}) {
  const SaudacaoIcon = horaAtual < 12 ? Sun : horaAtual < 18 ? Sunset : Moon;
  const bgClass = horaAtual < 12
    ? 'from-amber-50 via-transparent to-transparent dark:from-amber-950/20'
    : horaAtual < 18
    ? 'from-sky-50 via-transparent to-transparent dark:from-sky-950/20'
    : 'from-indigo-50 via-transparent to-transparent dark:from-indigo-950/20';

  return (
    <motion.div variants={fadeUp}>
      <Card className={cn('border-primary/10 bg-gradient-to-r overflow-hidden', bgClass)}>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <SaudacaoIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-success flex items-center justify-center shadow-sm">
                  <Star className="h-3 w-3 text-white fill-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight">
                  {saudacao}, {name}!
                </h1>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">{hojeFormatado}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="shadow-sm gap-2">
                <Link to="/agenda">
                  <CalendarPlus className="h-4 w-4" />
                  Nova Consulta
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/pacientes">
                  <UserPlus className="h-4 w-4" />
                  Novo Paciente
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const { profile: user } = useSupabaseAuth();

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: lancamentos = [], isLoading: loadingLancamentos } = useLancamentos();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: estoque = [], isLoading: loadingEstoque } = useEstoque();
  const { data: fila = [] } = useFilaAtendimento();

  const isLoading = loadingPacientes || loadingAgendamentos || loadingLancamentos || loadingMedicos || loadingEstoque;

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const horaAtual = new Date().getHours();
  const saudacao = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  const consultasHoje = agendamentos.filter(a => a.data === hoje);
  const consultasConfirmadas = consultasHoje.filter(a => a.status === 'confirmado').length;
  const consultasAgendadas = consultasHoje.filter(a => a.status === 'agendado').length;
  const consultasFinalizadas = consultasHoje.filter(a => a.status === 'finalizado').length;
  const totalHoje = consultasHoje.length;

  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  const filterByMonth = (tipo: string, status: string, month = mesAtual, year = anoAtual) =>
    lancamentos
      .filter(l => {
        const d = new Date(l.data);
        return l.tipo === tipo && l.status === status && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, l) => acc + Number(l.valor), 0);

  const receitasMes = filterByMonth('receita', 'pago');
  const aReceber = filterByMonth('receita', 'pendente');
  const inadimplente = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'vencido').reduce((acc, l) => acc + Number(l.valor), 0);
  const despesas = filterByMonth('despesa', 'pago');
  const saldoLiquido = receitasMes - despesas;

  const prevMonth = mesAtual === 0 ? 11 : mesAtual - 1;
  const prevYear = mesAtual === 0 ? anoAtual - 1 : anoAtual;
  const receitasMesAnterior = filterByMonth('receita', 'pago', prevMonth, prevYear);
  const trendReceita = receitasMesAnterior > 0 ? Math.round(((receitasMes - receitasMesAnterior) / receitasMesAnterior) * 100) : 0;

  const estoqueBaixo = estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length;
  const filaAguardando = fila.filter(f => f.status === 'aguardando').length;

  const novosPacientesMes = pacientes.filter(p => {
    if (!p.created_at) return false;
    const d = new Date(p.created_at);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).length;

  const atendimentosFinalizadosMes = agendamentos.filter(a => {
    const d = new Date(a.data);
    return a.status === 'finalizado' && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).length;

  const ticketMedio = atendimentosFinalizadosMes > 0 ? receitasMes / atendimentosFinalizadosMes : 0;
  const taxaOcupacao = totalHoje > 0 ? Math.round((consultasFinalizadas + consultasConfirmadas) / totalHoje * 100) : 0;

  // Chart data (last 6 months)
  const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(anoAtual, mesAtual - 5 + i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthLabel = format(date, 'MMM', { locale: ptBR });
    const receitas = filterByMonth('receita', 'pago', month, year);
    const desp = filterByMonth('despesa', 'pago', month, year);
    return { name: monthLabel, receitas, despesas: desp, lucro: receitas - desp };
  });

  // Sparkline data per KPI (last 6 months)
  const sparkPacientes = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(anoAtual, mesAtual - 5 + i, 1);
    return pacientes.filter(p => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
  });

  const sparkReceitas = monthlyChartData.map(d => d.receitas);
  const sparkConsultas = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(anoAtual, mesAtual - 5 + i, 1);
    return agendamentos.filter(a => {
      const d = new Date(a.data);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
  });
  const sparkTicket = monthlyChartData.map(d =>
    d.receitas > 0 ? Math.round(d.receitas / Math.max(1, sparkConsultas[monthlyChartData.indexOf(d)])) : 0
  );

  // Upcoming appointments
  const proximosAgendamentos = agendamentos
    .filter(a => a.data >= hoje && (a.status === 'agendado' || a.status === 'confirmado'))
    .sort((a, b) => `${a.data}${a.hora_inicio}`.localeCompare(`${b.data}${b.hora_inicio}`))
    .slice(0, 6);

  // Próximo paciente hoje
  const proximoPacienteHoje = agendamentos
    .filter(a => a.data === hoje && (a.status === 'agendado' || a.status === 'confirmado'))
    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
    .find(Boolean);

  // Appointment status distribution for today
  const statusDistribution = [
    { name: 'Confirmado', value: consultasConfirmadas, color: 'hsl(var(--success))' },
    { name: 'Agendado', value: consultasAgendadas, color: 'hsl(var(--info))' },
    { name: 'Finalizado', value: consultasFinalizadas, color: 'hsl(var(--primary))' },
  ].filter(s => s.value > 0);

  // Quick actions
  const quickActions = [
    { label: 'Agenda', icon: Calendar, href: '/agenda', color: 'bg-primary/10 text-primary' },
    { label: 'Fila', icon: ClipboardList, href: '/fila', color: 'bg-success/10 text-success' },
    { label: 'Prontuários', icon: FileText, href: '/prontuarios', color: 'bg-info/10 text-info' },
    { label: 'Financeiro', icon: Wallet, href: '/financeiro', color: 'bg-warning/10 text-warning' },
    { label: 'Laboratório', icon: HeartPulse, href: '/laboratorio', color: 'bg-destructive/10 text-destructive' },
    { label: 'Relatórios', icon: BarChart3, href: '/relatorios', color: 'bg-accent text-accent-foreground' },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasData = pacientes.length > 0 || agendamentos.length > 0 || lancamentos.length > 0;

  return (
    <div className="space-y-6 pb-8">
      <OnboardingWizard />
      <ServiceStatusBanner />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ─── Welcome Banner ─── */}
        <WelcomeBanner
          name={user?.nome?.split(' ')[0] || 'Usuário'}
          saudacao={saudacao}
          horaAtual={horaAtual}
          hojeFormatado={hojeFormatado}
        />

        {!hasData ? (
          /* ─── Empty State ─── */
          <motion.div variants={fadeUp}>
            <Card className="p-8 md:p-14 text-center">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Database className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-success flex items-center justify-center shadow-md">
                    <Sparkles className="h-4 w-4 text-success-foreground" />
                  </div>
                </div>
                <div className="max-w-md">
                  <h2 className="text-xl font-semibold font-display mb-2">Sistema Conectado!</h2>
                  <p className="text-muted-foreground">
                    Seu EloLab está pronto. Comece cadastrando pacientes e médicos para ver as métricas.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <Button asChild size="lg"><Link to="/pacientes"><UserPlus className="mr-2 h-4 w-4" />Cadastrar Paciente</Link></Button>
                  <Button variant="outline" size="lg" asChild><Link to="/medicos"><Stethoscope className="mr-2 h-4 w-4" />Cadastrar Médico</Link></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* ─── Hoje em Foco ─── */}
            <motion.div variants={fadeUp}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TodayFocusCard
                  icon={Calendar}
                  label="Próxima consulta"
                  value={proximoPacienteHoje ? (proximoPacienteHoje.hora_inicio?.slice(0, 5) ?? '—') : 'Nenhuma hoje'}
                  sub={proximoPacienteHoje ? `${proximoPacienteHoje.observacoes || proximoPacienteHoje.tipo || 'Consulta'}` : 'Agenda livre'}
                  href="/agenda"
                  color="bg-primary/10 text-primary"
                />
                <TodayFocusCard
                  icon={ClipboardList}
                  label="Fila de espera"
                  value={filaAguardando > 0 ? `${filaAguardando} paciente${filaAguardando > 1 ? 's' : ''}` : 'Fila vazia'}
                  sub={filaAguardando > 0 ? 'Aguardando atendimento' : 'Nenhum na fila'}
                  href="/fila"
                  color={filaAguardando > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}
                />
                <TodayFocusCard
                  icon={Wallet}
                  label="Receita do dia"
                  value={formatCurrencyShort(lancamentos
                    .filter(l => l.data === hoje && l.tipo === 'receita' && l.status === 'pago')
                    .reduce((acc, l) => acc + Number(l.valor), 0)
                  )}
                  sub="Pagamentos confirmados"
                  href="/financeiro"
                  color="bg-success/10 text-success"
                />
                <TodayFocusCard
                  icon={Package}
                  label="Estoque"
                  value={estoqueBaixo > 0 ? `${estoqueBaixo} item(ns) crítico(s)` : 'Níveis normais'}
                  sub={estoqueBaixo > 0 ? 'Verificar reposição' : `${estoque.length} itens cadastrados`}
                  href="/estoque"
                  color={estoqueBaixo > 0 ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}
                />
              </div>
            </motion.div>

            {/* ─── Financial Strip ─── */}
            <motion.div variants={stagger} className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              <FinanceChip label="Recebido" value={formatCurrency(receitasMes)} icon={CheckCircle2} variant="positive" />
              <FinanceChip label="A Receber" value={formatCurrency(aReceber)} icon={Clock} variant="neutral" />
              <FinanceChip label="Inadimplente" value={formatCurrency(inadimplente)} icon={AlertTriangle} variant="danger" />
              <FinanceChip label="Despesas" value={formatCurrency(despesas)} icon={TrendingDown} variant="negative" />
              <FinanceChip
                label="Saldo Líquido"
                value={formatCurrency(saldoLiquido)}
                icon={Wallet}
                variant={saldoLiquido >= 0 ? 'positive' : 'negative'}
              />
            </motion.div>

            {/* ─── KPI Cards com Sparklines ─── */}
            <motion.div variants={stagger} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Pacientes" value={pacientes.length}
                subtitle={novosPacientesMes > 0 ? `+${novosPacientesMes} este mês` : `${medicos.filter(m => m.ativo).length} médicos ativos`}
                icon={Users} color="primary" href="/pacientes" delay={0}
                sparkData={sparkPacientes}
              />
              <MetricCard
                title="Consultas Hoje" value={totalHoje}
                subtitle={`${taxaOcupacao}% de ocupação`}
                icon={Calendar} color="success" href="/agenda" delay={1}
                sparkData={sparkConsultas}
                sparkColor="hsl(var(--success))"
              />
              <MetricCard
                title="Receita do Mês" value={formatCurrencyShort(receitasMes)}
                subtitle={trendReceita !== 0 ? `${trendReceita > 0 ? '+' : ''}${trendReceita}% vs mês anterior` : 'Sem comparação'}
                icon={TrendingUp} color="info" href="/financeiro" delay={2}
                sparkData={sparkReceitas}
                sparkColor="hsl(var(--info))"
              />
              <MetricCard
                title="Ticket Médio" value={formatCurrencyShort(ticketMedio)}
                subtitle={`${atendimentosFinalizadosMes} atendimento${atendimentosFinalizadosMes !== 1 ? 's' : ''} no mês`}
                icon={Activity} color={estoqueBaixo > 0 ? 'warning' : 'primary'} href="/financeiro" delay={3}
                sparkData={sparkTicket}
              />
            </motion.div>

            {/* ─── Secondary KPIs ─── */}
            <motion.div variants={stagger} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Médicos Ativos" value={medicos.filter(m => m.ativo).length}
                subtitle={`${medicos.length} total cadastrados`}
                icon={Stethoscope} color="info" href="/medicos" delay={0}
              />
              <MetricCard
                title="Na Fila" value={filaAguardando}
                subtitle={filaAguardando > 0 ? 'Aguardando atendimento' : 'Fila vazia'}
                icon={Clock} color={filaAguardando > 3 ? 'warning' : 'success'} href="/fila" delay={1}
              />
              <MetricCard
                title="Estoque" value={estoque.length}
                subtitle={estoqueBaixo > 0 ? `⚠️ ${estoqueBaixo} item(ns) crítico(s)` : '✓ Níveis normais'}
                icon={Package} color={estoqueBaixo > 0 ? 'warning' : 'primary'} href="/estoque" delay={2}
              />
              <MetricCard
                title="Novos Pacientes" value={novosPacientesMes}
                subtitle="Cadastrados este mês"
                icon={UserPlus} color="success" href="/pacientes" delay={3}
                sparkData={sparkPacientes}
              />
            </motion.div>

            {/* ─── Charts Row ─── */}
            <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-5">
              {/* Revenue Chart (3/5) */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Fluxo de Caixa</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs">
                      <Link to="/fluxo-caixa">
                        Ver detalhes <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lancamentos.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyChartData}>
                          <defs>
                            <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                          <XAxis dataKey="name" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                          <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyShort(v)} />
                          <Tooltip
                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'receitas' ? 'Receitas' : 'Despesas']}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                            }}
                          />
                          <Area type="monotone" dataKey="receitas" name="receitas" stroke="hsl(var(--success))" fill="url(#gradReceitas)" strokeWidth={2} />
                          <Area type="monotone" dataKey="despesas" name="despesas" stroke="hsl(var(--destructive))" fill="url(#gradDespesas)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Sem dados financeiros ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Status (2/5) */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Consultas de Hoje</CardTitle>
                  <CardDescription>{totalHoje} agendamento{totalHoje !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  {totalHoje > 0 ? (
                    <div className="space-y-4">
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {statusDistribution.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [`${value} consulta${value > 1 ? 's' : ''}`, name]}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.75rem',
                                fontSize: '0.75rem',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {statusDistribution.map((s) => (
                          <div key={s.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-muted-foreground">{s.name}</span>
                            </div>
                            <span className="font-semibold">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Sem consultas hoje</p>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link to="/agenda"><Plus className="mr-2 h-4 w-4" />Agendar</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Appointments + Quick Access ─── */}
            <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-3">
              {/* Upcoming Appointments (2/3) */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Próximos Agendamentos</CardTitle>
                      <CardDescription>Consultas confirmadas e agendadas</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs">
                      <Link to="/agenda">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {proximosAgendamentos.length > 0 ? (
                    <div className="space-y-2">
                      {proximosAgendamentos.map((ag) => (
                        <motion.div
                          key={ag.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold',
                              ag.status === 'confirmado' ? 'bg-success/10 text-success' : 'bg-info/10 text-info',
                            )}>
                              {ag.hora_inicio?.slice(0, 5)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{ag.observacoes || ag.tipo || 'Consulta'}</p>
                              <p className="text-xs text-muted-foreground">
                                {ag.data === hoje ? 'Hoje' : format(parseISO(ag.data), "dd 'de' MMM", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={ag.status === 'confirmado' ? 'default' : 'secondary'} className="text-[10px] opacity-80 group-hover:opacity-100 transition-opacity">
                            {ag.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum agendamento próximo</p>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link to="/agenda"><Plus className="mr-2 h-4 w-4" />Novo Agendamento</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Access (1/3) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Acesso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        to={action.href}
                        className="flex flex-col items-center gap-2 rounded-xl border border-transparent p-4 hover:border-border hover:bg-muted/30 transition-all group"
                      >
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', action.color)}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* System status mini */}
                  <div className="mt-4 pt-4 border-t space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Banco de dados</span>
                      <span className="flex items-center gap-1.5 text-success text-xs font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Perfil</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {user?.roles?.[0] || 'admin'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
