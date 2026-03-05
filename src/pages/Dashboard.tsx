import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
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
} from 'recharts';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

// ─── Metric Card ───────────────────────────────────────────
function MetricCard({ title, value, subtitle, icon: Icon, color, href, delay = 0 }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  href?: string;
  delay?: number;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
    success: { bg: 'bg-success/10', text: 'text-success', ring: 'ring-success/20' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', ring: 'ring-warning/20' },
    info: { bg: 'bg-info/10', text: 'text-info', ring: 'ring-info/20' },
    destructive: { bg: 'bg-destructive/10', text: 'text-destructive', ring: 'ring-destructive/20' },
  };
  const c = colorMap[color];

  const content = (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      "animate-fade-in"
    )} style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold font-display tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center ring-1 transition-transform group-hover:scale-110", c.bg, c.ring)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </div>
        </div>
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
            <ArrowUpRight className={cn("h-4 w-4", c.text)} />
          </div>
        )}
      </CardContent>
    </Card>
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
    <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors hover:shadow-sm", variantMap[variant])}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-base font-bold truncate">{value}</p>
      </div>
    </div>
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

  // Financial
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

  // Previous month comparison
  const prevMonth = mesAtual === 0 ? 11 : mesAtual - 1;
  const prevYear = mesAtual === 0 ? anoAtual - 1 : anoAtual;
  const receitasMesAnterior = filterByMonth('receita', 'pago', prevMonth, prevYear);
  const trendReceita = receitasMesAnterior > 0 ? Math.round(((receitasMes - receitasMesAnterior) / receitasMesAnterior) * 100) : 0;

  const estoqueBaixo = estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length;
  const filaAguardando = fila.filter(f => f.status === 'aguardando').length;

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

  // Appointment status distribution for today
  const statusDistribution = [
    { name: 'Confirmado', value: consultasConfirmadas, color: 'hsl(var(--success))' },
    { name: 'Agendado', value: consultasAgendadas, color: 'hsl(var(--info))' },
    { name: 'Finalizado', value: consultasFinalizadas, color: 'hsl(var(--primary))' },
  ].filter(s => s.value > 0);

  // Upcoming appointments
  const proximosAgendamentos = agendamentos
    .filter(a => a.data >= hoje && (a.status === 'agendado' || a.status === 'confirmado'))
    .sort((a, b) => `${a.data}${a.hora_inicio}`.localeCompare(`${b.data}${b.hora_inicio}`))
    .slice(0, 6);

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
      <ServiceStatusBanner />
      
      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            {saudacao}, {user?.nome?.split(' ')[0] || 'Usuário'} 👋
          </h1>
          <p className="text-muted-foreground capitalize mt-0.5">{hojeFormatado}</p>
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

      {!hasData ? (
        /* ─── Empty State ─── */
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
      ) : (
        <>
          {/* ─── Hoje em Destaque ─── */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.03] via-transparent to-success/[0.02] animate-fade-in">
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold font-display text-lg">Hoje</h2>
                    <p className="text-sm text-muted-foreground">
                      {totalHoje > 0 
                        ? `${totalHoje} consulta${totalHoje > 1 ? 's' : ''} • ${consultasFinalizadas} finalizada${consultasFinalizadas !== 1 ? 's' : ''}`
                        : 'Nenhuma consulta agendada'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {filaAguardando > 0 && (
                    <Link to="/fila" className="flex items-center gap-2 text-warning hover:text-warning/80 transition-colors">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm font-medium">{filaAguardando} na fila</span>
                    </Link>
                  )}
                  {totalHoje > 0 && (
                    <div className="flex items-center gap-2">
                      <Progress value={totalHoje > 0 ? (consultasFinalizadas / totalHoje) * 100 : 0} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {totalHoje > 0 ? Math.round((consultasFinalizadas / totalHoje) * 100) : 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Financial Strip ─── */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
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
          </div>

          {/* ─── KPI Cards ─── */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Pacientes" value={pacientes.length}
              subtitle={`${medicos.filter(m => m.ativo).length} médicos ativos`}
              icon={Users} color="primary" href="/pacientes" delay={150}
            />
            <MetricCard
              title="Consultas Hoje" value={totalHoje}
              subtitle={`${consultasConfirmadas} confirmada${consultasConfirmadas !== 1 ? 's' : ''}`}
              icon={Calendar} color="success" href="/agenda" delay={200}
            />
            <MetricCard
              title="Receita do Mês" value={formatCurrencyShort(receitasMes)}
              subtitle={trendReceita !== 0 ? `${trendReceita > 0 ? '+' : ''}${trendReceita}% vs mês anterior` : 'Sem comparação'}
              icon={TrendingUp} color="info" href="/financeiro" delay={250}
            />
            <MetricCard
              title="Estoque" value={estoque.length}
              subtitle={estoqueBaixo > 0 ? `⚠️ ${estoqueBaixo} item(ns) crítico(s)` : '✓ Níveis normais'}
              icon={Package} color={estoqueBaixo > 0 ? 'warning' : 'primary'} href="/estoque" delay={300}
            />
          </div>

          {/* ─── Charts Row ─── */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Revenue Chart (3/5) */}
            <Card className="lg:col-span-3 animate-fade-in" style={{ animationDelay: '350ms' }}>
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
            <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
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
          </div>

          {/* ─── Appointments + Quick Access ─── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upcoming Appointments (2/3) */}
            <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '450ms' }}>
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
                      <div
                        key={ag.id}
                        className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold",
                            ag.status === 'confirmado' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'
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
                      </div>
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
            <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
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
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", action.color)}>
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
          </div>
        </>
      )}
    </div>
  );
}
