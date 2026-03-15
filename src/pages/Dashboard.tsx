import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes, useAgendamentos, useLancamentos, useEstoque, useMedicos, useFilaAtendimento } from '@/hooks/useSupabaseData';
import {
  Users, Calendar, Clock, UserPlus, CalendarPlus, ArrowRight, ArrowUpRight,
  Activity, Stethoscope, Package, FileText, Database, TrendingUp, TrendingDown,
  Sparkles, CheckCircle2, AlertTriangle, Wallet, Plus, Zap, BarChart3,
  ClipboardList, HeartPulse, Bell, Sun, Sunset, Moon, Star, ChevronRight,
  ShieldCheck, RefreshCw, Eye, Layers, Target, Award, Timer,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
} from 'recharts';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

// ─── Animations ────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── SVG Progress Ring ─────────────────────────────────────
function ProgressRing({ value, size = 80, strokeWidth = 6, color = 'hsl(var(--primary))' }: {
  value: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out" />
    </svg>
  );
}

// ─── Sparkline ─────────────────────────────────────────────
function Sparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ──────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, color, href, delay = 0, sparkData, trend }: {
  title: string; value: string | number; subtitle?: string; icon: any;
  color: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  href?: string; delay?: number; sparkData?: number[]; trend?: number;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/8', text: 'text-primary', ring: 'ring-primary/15', spark: 'hsl(var(--primary))' },
    success: { bg: 'bg-success/8', text: 'text-success', ring: 'ring-success/15', spark: 'hsl(var(--success))' },
    warning: { bg: 'bg-warning/8', text: 'text-warning', ring: 'ring-warning/15', spark: 'hsl(var(--warning))' },
    info: { bg: 'bg-info/8', text: 'text-info', ring: 'ring-info/15', spark: 'hsl(var(--info))' },
    destructive: { bg: 'bg-destructive/8', text: 'text-destructive', ring: 'ring-destructive/15', spark: 'hsl(var(--destructive))' },
  };
  const c = colorMap[color];

  const content = (
    <motion.div variants={fadeUp} custom={delay}>
      <Card className="group relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold font-display tracking-tight truncate">{value}</p>
                {trend !== undefined && trend !== 0 && (
                  <span className={cn('text-[11px] font-semibold flex items-center gap-0.5',
                    trend > 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
            </div>
            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center ring-1 shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3', c.bg, c.ring)}>
              <Icon className={cn('h-5 w-5', c.text)} />
            </div>
          </div>
          {sparkData && sparkData.length > 1 && (
            <div className="opacity-50 group-hover:opacity-100 transition-opacity -mx-1 mt-1">
              <Sparkline data={sparkData} color={c.spark} />
            </div>
          )}
        </CardContent>
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowUpRight className={cn('h-4 w-4', c.text)} />
          </div>
        )}
      </Card>
    </motion.div>
  );
  return href ? <Link to={href} className="block">{content}</Link> : content;
}

// ─── Finance Stat Row ──────────────────────────────────────
function FinanceStat({ label, value, icon: Icon, variant }: {
  label: string; value: string; icon: any;
  variant: 'positive' | 'neutral' | 'negative';
}) {
  const styles = {
    positive: 'text-success',
    neutral: 'text-warning',
    negative: 'text-destructive',
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={cn('h-4 w-4', styles[variant])} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-sm font-bold', styles[variant])}>{value}</span>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────
function QuickActionBtn({ icon: Icon, label, href, color }: {
  icon: any; label: string; href: string; color: string;
}) {
  return (
    <Link to={href} className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all">
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-md', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{label}</span>
    </Link>
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
  const SaudacaoIcon = horaAtual < 12 ? Sun : horaAtual < 18 ? Sunset : Moon;

  const stats = useMemo(() => {
    const consultasHoje = agendamentos.filter(a => a.data === hoje);
    const consultasConfirmadas = consultasHoje.filter(a => a.status === 'confirmado').length;
    const consultasAgendadas = consultasHoje.filter(a => a.status === 'agendado').length;
    const consultasFinalizadas = consultasHoje.filter(a => a.status === 'finalizado').length;
    const totalHoje = consultasHoje.length;
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    const filterByMonth = (tipo: string, status: string, month = mesAtual, year = anoAtual) =>
      lancamentos
        .filter(l => { const d = new Date(l.data); return l.tipo === tipo && l.status === status && d.getMonth() === month && d.getFullYear() === year; })
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

    const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(anoAtual, mesAtual - 5 + i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const receitas = filterByMonth('receita', 'pago', month, year);
      const desp = filterByMonth('despesa', 'pago', month, year);
      return { name: format(date, 'MMM', { locale: ptBR }), receitas, despesas: desp, lucro: receitas - desp };
    });

    const sparkPacientes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(anoAtual, mesAtual - 5 + i, 1);
      return pacientes.filter(p => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      }).length;
    });

    const sparkConsultas = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(anoAtual, mesAtual - 5 + i, 1);
      return agendamentos.filter(a => {
        const d = new Date(a.data);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      }).length;
    });

    const sparkReceitas = monthlyChartData.map(d => d.receitas);

    const statusDistribution = [
      { name: 'Confirmado', value: consultasConfirmadas, color: 'hsl(var(--success))' },
      { name: 'Agendado', value: consultasAgendadas, color: 'hsl(var(--info))' },
      { name: 'Finalizado', value: consultasFinalizadas, color: 'hsl(var(--primary))' },
    ].filter(s => s.value > 0);

    const proximosAgendamentos = agendamentos
      .filter(a => a.data >= hoje && (a.status === 'agendado' || a.status === 'confirmado'))
      .sort((a, b) => `${a.data}${a.hora_inicio}`.localeCompare(`${b.data}${b.hora_inicio}`))
      .slice(0, 5);

    const receitaDia = lancamentos
      .filter(l => l.data === hoje && l.tipo === 'receita' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);

    return {
      consultasConfirmadas, consultasAgendadas, consultasFinalizadas, totalHoje,
      receitasMes, aReceber, inadimplente, despesas, saldoLiquido, trendReceita,
      estoqueBaixo, filaAguardando, novosPacientesMes, atendimentosFinalizadosMes,
      ticketMedio, taxaOcupacao, monthlyChartData, sparkPacientes, sparkConsultas,
      sparkReceitas, statusDistribution, proximosAgendamentos, receitaDia,
      medicosAtivos: medicos.filter(m => m.ativo).length,
    };
  }, [agendamentos, lancamentos, pacientes, medicos, estoque, fila, hoje]);

  const setupSteps = useMemo(() => [
    { label: 'Cadastrar médicos', done: medicos.length > 0, icon: Stethoscope, href: '/medicos', color: 'text-info' },
    { label: 'Cadastrar pacientes', done: pacientes.length > 0, icon: Users, href: '/pacientes', color: 'text-primary' },
    { label: 'Agendar consulta', done: agendamentos.length > 0, icon: Calendar, href: '/agenda', color: 'text-success' },
    { label: 'Registrar financeiro', done: lancamentos.length > 0, icon: Wallet, href: '/financeiro', color: 'text-warning' },
  ], [medicos, pacientes, agendamentos, lancamentos]);

  const setupProgress = Math.round((setupSteps.filter(s => s.done).length / setupSteps.length) * 100);

  if (isLoading) return <DashboardSkeleton />;

  const hasData = pacientes.length > 0 || agendamentos.length > 0 || lancamentos.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <OnboardingWizard />
      <ServiceStatusBanner />

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
        {/* ─── Welcome Hero ─── */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                      <SaudacaoIcon className="h-8 w-8 text-primary" />
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                      className="absolute -right-1.5 -bottom-1.5 h-6 w-6 rounded-full bg-success flex items-center justify-center shadow-md ring-2 ring-card"
                    >
                      <Zap className="h-3 w-3 text-success-foreground" />
                    </motion.div>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
                      {saudacao}, <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{user?.nome?.split(' ')[0] || 'Usuário'}</span>!
                    </h1>
                    <p className="text-sm text-muted-foreground capitalize mt-1">{hojeFormatado}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button asChild size="default" className="shadow-lg shadow-primary/20 gap-2 rounded-full">
                    <Link to="/agenda"><CalendarPlus className="h-4 w-4" />Nova Consulta</Link>
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2 rounded-full">
                    <Link to="/pacientes"><UserPlus className="h-4 w-4" />Novo Paciente</Link>
                  </Button>
                </div>
              </div>

              {/* Mini Stats Strip */}
              {hasData && (
                <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/30">
                  {[
                    { label: 'Consultas Hoje', value: stats.totalHoje, icon: Calendar, color: 'text-primary', bg: 'bg-primary/8' },
                    { label: 'Na Fila', value: stats.filaAguardando, icon: Timer, color: stats.filaAguardando > 0 ? 'text-warning' : 'text-success', bg: stats.filaAguardando > 0 ? 'bg-warning/8' : 'bg-success/8' },
                    { label: 'Receita Hoje', value: formatCurrencyShort(stats.receitaDia), icon: Wallet, color: 'text-success', bg: 'bg-success/8' },
                    { label: 'Estoque Crítico', value: stats.estoqueBaixo, icon: Package, color: stats.estoqueBaixo > 0 ? 'text-destructive' : 'text-success', bg: stats.estoqueBaixo > 0 ? 'bg-destructive/8' : 'bg-success/8' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                        <s.icon className={cn('h-4 w-4', s.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</p>
                        <p className="text-sm font-bold">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {!hasData ? (
          <>
            {/* ─── Setup Progress Card ─── */}
            <motion.div variants={fadeUp}>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs font-semibold gap-1">
                          <Sparkles className="h-3 w-3" /> Configuração Inicial
                        </Badge>
                        <span className="text-xs text-muted-foreground">{setupProgress}% completo</span>
                      </div>
                      <h2 className="text-xl font-bold font-display mb-1">Configure seu EloLab</h2>
                      <p className="text-sm text-muted-foreground">Complete os passos abaixo para desbloquear todo o potencial do sistema.</p>
                      <div className="mt-4">
                        <Progress value={setupProgress} className="h-2" />
                      </div>
                    </div>
                    <div className="relative shrink-0 hidden md:block">
                      <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        <ProgressRing value={setupProgress} size={90} strokeWidth={6} color="hsl(var(--primary))" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{setupProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 pt-0 md:p-8 md:pt-0 mt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {setupSteps.map((step, i) => (
                      <Link key={i} to={step.href}>
                        <motion.div
                          variants={fadeUp} custom={i}
                          className={cn(
                            'group flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-200',
                            step.done
                              ? 'bg-success/5 border-success/20'
                              : 'hover:bg-muted/50 hover:border-border hover:-translate-y-0.5 hover:shadow-md',
                          )}
                        >
                          <div className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                            step.done ? 'bg-success/15' : 'bg-muted',
                          )}>
                            {step.done ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <step.icon className={cn('h-5 w-5', step.color)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium text-sm', step.done && 'line-through text-muted-foreground')}>
                              {step.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {step.done ? 'Concluído ✓' : 'Clique para começar'}
                            </p>
                          </div>
                          {!step.done && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
                          )}
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Feature Highlights ─── */}
            <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Calendar, title: 'Agenda Inteligente', desc: 'Gerencie agendamentos, bloqueios e salas com visão completa.', href: '/agenda', color: 'bg-primary/10 text-primary' },
                { icon: FileText, title: 'Prontuário Eletrônico', desc: 'Registros clínicos completos com timeline e anexos.', href: '/prontuarios', color: 'bg-info/10 text-info' },
                { icon: Wallet, title: 'Gestão Financeira', desc: 'Controle receitas, despesas e fluxo de caixa.', href: '/financeiro', color: 'bg-success/10 text-success' },
                { icon: HeartPulse, title: 'Laboratório', desc: 'Coletas, resultados e laudos laboratoriais.', href: '/laboratorio', color: 'bg-destructive/10 text-destructive' },
                { icon: BarChart3, title: 'Relatórios & Analytics', desc: 'KPIs clínicos e financeiros com exportação PDF/Excel.', href: '/relatorios', color: 'bg-warning/10 text-warning' },
                { icon: Bell, title: 'Notificações', desc: 'WhatsApp, e-mail e lembretes automáticos.', href: '/automacoes', color: 'bg-accent text-accent-foreground' },
              ].map((feat, i) => (
                <motion.div key={i} variants={fadeUp} custom={i}>
                  <Link to={feat.href}>
                    <Card className="group h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <CardContent className="pt-6">
                        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3', feat.color)}>
                          <feat.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold font-display mb-1 group-hover:text-primary transition-colors">{feat.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* ─── Quick Access Grid ─── */}
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Acesso Rápido</CardTitle>
                  <CardDescription>Navegue pelos módulos do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
                    <QuickActionBtn icon={Calendar} label="Agenda" href="/agenda" color="bg-primary/10 text-primary" />
                    <QuickActionBtn icon={Users} label="Pacientes" href="/pacientes" color="bg-primary/10 text-primary" />
                    <QuickActionBtn icon={Stethoscope} label="Médicos" href="/medicos" color="bg-info/10 text-info" />
                    <QuickActionBtn icon={ClipboardList} label="Fila" href="/fila" color="bg-success/10 text-success" />
                    <QuickActionBtn icon={FileText} label="Prontuários" href="/prontuarios" color="bg-info/10 text-info" />
                    <QuickActionBtn icon={Wallet} label="Financeiro" href="/financeiro" color="bg-warning/10 text-warning" />
                    <QuickActionBtn icon={HeartPulse} label="Laboratório" href="/laboratorio" color="bg-destructive/10 text-destructive" />
                    <QuickActionBtn icon={Package} label="Estoque" href="/estoque" color="bg-muted text-muted-foreground" />
                    <QuickActionBtn icon={BarChart3} label="Relatórios" href="/relatorios" color="bg-accent text-accent-foreground" />
                    <QuickActionBtn icon={Bell} label="Automações" href="/automacoes" color="bg-warning/10 text-warning" />
                    <QuickActionBtn icon={ShieldCheck} label="Configurações" href="/configuracoes" color="bg-muted text-muted-foreground" />
                    <QuickActionBtn icon={Eye} label="Painel TV" href="/painel-tv" color="bg-primary/10 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* ─── KPI Cards ─── */}
            <motion.div variants={stagger} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <KPICard title="Total Pacientes" value={pacientes.length}
                subtitle={stats.novosPacientesMes > 0 ? `+${stats.novosPacientesMes} este mês` : `${stats.medicosAtivos} médicos ativos`}
                icon={Users} color="primary" href="/pacientes" delay={0}
                sparkData={stats.sparkPacientes} />
              <KPICard title="Consultas Hoje" value={stats.totalHoje}
                subtitle={`${stats.taxaOcupacao}% ocupação`}
                icon={Calendar} color="success" href="/agenda" delay={1}
                sparkData={stats.sparkConsultas} />
              <KPICard title="Receita do Mês" value={formatCurrencyShort(stats.receitasMes)}
                subtitle={stats.trendReceita !== 0 ? `vs mês anterior` : 'Sem comparação'}
                icon={TrendingUp} color="info" href="/financeiro" delay={2}
                sparkData={stats.sparkReceitas} trend={stats.trendReceita} />
              <KPICard title="Ticket Médio" value={formatCurrencyShort(stats.ticketMedio)}
                subtitle={`${stats.atendimentosFinalizadosMes} atendimentos`}
                icon={Target} color="warning" href="/financeiro" delay={3} />
            </motion.div>

            {/* ─── Main Grid: Charts + Finance ─── */}
            <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-3">
              {/* Fluxo de Caixa (2/3) */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                      <Link to="/fluxo-caixa">Detalhes <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lancamentos.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyChartData}>
                          <defs>
                            <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                          <XAxis dataKey="name" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                          <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} tickFormatter={v => formatCurrencyShort(v)} />
                          <Tooltip
                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'receitas' ? 'Receitas' : 'Despesas']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                          />
                          <Area type="monotone" dataKey="receitas" name="receitas" stroke="hsl(var(--success))" fill="url(#gRec)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="despesas" name="despesas" stroke="hsl(var(--destructive))" fill="url(#gDesp)" strokeWidth={2} strokeDasharray="5 3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Activity className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">Sem dados financeiros</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo Financeiro (1/3) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                  <CardDescription>Mês atual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <FinanceStat label="Recebido" value={formatCurrency(stats.receitasMes)} icon={CheckCircle2} variant="positive" />
                  <FinanceStat label="A Receber" value={formatCurrency(stats.aReceber)} icon={Clock} variant="neutral" />
                  <FinanceStat label="Inadimplente" value={formatCurrency(stats.inadimplente)} icon={AlertTriangle} variant="negative" />
                  <FinanceStat label="Despesas" value={formatCurrency(stats.despesas)} icon={TrendingDown} variant="negative" />
                  <div className="pt-3 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Saldo Líquido</span>
                      <span className={cn('text-lg font-bold', stats.saldoLiquido >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(stats.saldoLiquido)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Secondary Row: Today + Appointments + Quick Actions ─── */}
            <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-12">
              {/* Consultas de Hoje (3/12) */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-base">Hoje</CardTitle>
                  <CardDescription>{stats.totalHoje} consulta{stats.totalHoje !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.totalHoje > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <ProgressRing value={stats.taxaOcupacao} size={100} strokeWidth={8} color="hsl(var(--primary))" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-xl font-bold">{stats.taxaOcupacao}%</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Ocupação</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full space-y-2">
                        {stats.statusDistribution.map((s) => (
                          <div key={s.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-muted-foreground text-xs">{s.name}</span>
                            </div>
                            <span className="font-bold text-xs">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-xs text-muted-foreground">Sem consultas hoje</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-full text-xs" asChild>
                        <Link to="/agenda"><Plus className="mr-1 h-3 w-3" />Agendar</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Próximos Agendamentos (5/12) */}
              <Card className="lg:col-span-5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Próximos Agendamentos</CardTitle>
                      <CardDescription>Confirmados e agendados</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                      <Link to="/agenda">Ver todos <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.proximosAgendamentos.length > 0 ? (
                    <div className="space-y-2">
                      {stats.proximosAgendamentos.map((ag, idx) => (
                        <motion.div key={ag.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                              ag.status === 'confirmado' ? 'bg-success/10 text-success' : 'bg-info/10 text-info',
                            )}>
                              {ag.hora_inicio?.slice(0, 5)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{ag.observacoes || ag.tipo || 'Consulta'}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {ag.data === hoje ? 'Hoje' : format(parseISO(ag.data), "dd 'de' MMM", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={ag.status === 'confirmado' ? 'default' : 'secondary'}
                            className="text-[10px] shrink-0 opacity-80 group-hover:opacity-100">
                            {ag.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum agendamento</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-full" asChild>
                        <Link to="/agenda"><Plus className="mr-1 h-3 w-3" />Agendar</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Access + System (4/12) */}
              <Card className="lg:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Acesso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-1">
                    <QuickActionBtn icon={Calendar} label="Agenda" href="/agenda" color="bg-primary/10 text-primary" />
                    <QuickActionBtn icon={ClipboardList} label="Fila" href="/fila" color="bg-success/10 text-success" />
                    <QuickActionBtn icon={FileText} label="Prontuários" href="/prontuarios" color="bg-info/10 text-info" />
                    <QuickActionBtn icon={Wallet} label="Financeiro" href="/financeiro" color="bg-warning/10 text-warning" />
                    <QuickActionBtn icon={HeartPulse} label="Laboratório" href="/laboratorio" color="bg-destructive/10 text-destructive" />
                    <QuickActionBtn icon={BarChart3} label="Relatórios" href="/relatorios" color="bg-accent text-accent-foreground" />
                    <QuickActionBtn icon={Package} label="Estoque" href="/estoque" color="bg-muted text-muted-foreground" />
                    <QuickActionBtn icon={Stethoscope} label="Médicos" href="/medicos" color="bg-info/10 text-info" />
                    <QuickActionBtn icon={Users} label="Pacientes" href="/pacientes" color="bg-primary/10 text-primary" />
                  </div>

                  {/* System Status */}
                  <div className="mt-4 pt-4 border-t space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" /> Sistema
                      </span>
                      <span className="flex items-center gap-1.5 text-success font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Perfil</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {(user as any)?.roles?.[0] || 'admin'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Secondary KPIs ─── */}
            <motion.div variants={stagger} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <KPICard title="Médicos Ativos" value={stats.medicosAtivos}
                subtitle={`${medicos.length} cadastrados`}
                icon={Stethoscope} color="info" href="/medicos" />
              <KPICard title="Na Fila" value={stats.filaAguardando}
                subtitle={stats.filaAguardando > 0 ? 'Aguardando' : 'Fila vazia'}
                icon={Clock} color={stats.filaAguardando > 3 ? 'warning' : 'success'} href="/fila" />
              <KPICard title="Itens Estoque" value={estoque.length}
                subtitle={stats.estoqueBaixo > 0 ? `⚠️ ${stats.estoqueBaixo} crítico(s)` : '✓ Níveis normais'}
                icon={Package} color={stats.estoqueBaixo > 0 ? 'warning' : 'primary'} href="/estoque" />
              <KPICard title="Novos Pacientes" value={stats.novosPacientesMes}
                subtitle="Este mês"
                icon={UserPlus} color="success" href="/pacientes"
                sparkData={stats.sparkPacientes} />
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
