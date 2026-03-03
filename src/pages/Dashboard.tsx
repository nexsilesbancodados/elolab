import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes, useAgendamentos, useLancamentos, useEstoque, useMedicos } from '@/hooks/useSupabaseData';
import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  UserPlus,
  CalendarPlus,
  ArrowRight,
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
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO, isFuture } from 'date-fns';
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
  Line,
  Legend,
  ComposedChart,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: number;
  href?: string;
  index?: number;
}

function StatCard({ title, value, description, icon, iconColor = 'primary', trend, href, index = 0 }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    destructive: 'bg-destructive/10 text-destructive',
  };

  const content = (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
      "animate-fade-in"
    )} style={{ animationDelay: `${index * 100}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          colorClasses[iconColor as keyof typeof colorClasses] || colorClasses.primary
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs mt-2 font-medium",
            trend >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}% vs mês anterior
          </div>
        )}
      </CardContent>
      {href && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
}

function FinancialSummaryCard({ title, value, icon: Icon, colorClass, subtitle }: {
  title: string;
  value: string;
  icon: any;
  colorClass: string;
  subtitle?: string;
}) {
  return (
    <Card className={cn("bg-gradient-to-br border", colorClass)}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4" />
          <span className="text-[11px] text-muted-foreground">{title}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { profile: user } = useSupabaseAuth();
  
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: lancamentos = [], isLoading: loadingLancamentos } = useLancamentos();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: estoque = [], isLoading: loadingEstoque } = useEstoque();
  
  const isLoading = loadingPacientes || loadingAgendamentos || loadingLancamentos || loadingMedicos || loadingEstoque;

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const consultasHoje = agendamentos.filter(a => a.data === hoje).length;
  
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  
  // Financial calculations
  const receitasMes = lancamentos
    .filter(l => {
      const data = new Date(l.data);
      return l.tipo === 'receita' && l.status === 'pago' && 
             data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const aReceber = lancamentos
    .filter(l => {
      const data = new Date(l.data);
      return l.tipo === 'receita' && l.status === 'pendente' && 
             data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const inadimplente = lancamentos
    .filter(l => {
      return l.tipo === 'receita' && l.status === 'vencido';
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const despesas = lancamentos
    .filter(l => {
      const data = new Date(l.data);
      return l.tipo === 'despesa' && l.status === 'pago' && 
             data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const saldoLiquido = receitasMes - despesas;
  const totalIncome = receitasMes + aReceber + inadimplente;
  const inadimplenciaRate = totalIncome > 0 ? ((inadimplente / totalIncome) * 100).toFixed(1) : '0';

  const estoqueBaixo = estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length;

  // Monthly chart data (last 6 months)
  const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(anoAtual, mesAtual - 5 + i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthLabel = format(date, 'MMM', { locale: ptBR });
    
    const receitas = lancamentos
      .filter(l => {
        const d = new Date(l.data);
        return l.tipo === 'receita' && l.status === 'pago' && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const desp = lancamentos
      .filter(l => {
        const d = new Date(l.data);
        return l.tipo === 'despesa' && l.status === 'pago' && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, l) => acc + Number(l.valor), 0);

    return { name: monthLabel, receitas, despesas: desp };
  });

  // Upcoming appointments
  const proximosAgendamentos = agendamentos
    .filter(a => a.data >= hoje && (a.status === 'agendado' || a.status === 'confirmado'))
    .sort((a, b) => `${a.data}${a.hora_inicio}`.localeCompare(`${b.data}${b.hora_inicio}`))
    .slice(0, 5);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasData = pacientes.length > 0 || agendamentos.length > 0 || lancamentos.length > 0;

  return (
    <div className="space-y-6">
      <ServiceStatusBanner />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
              Olá, {user?.nome?.split(' ')[0] || 'Usuário'}!
            </h1>
            <span className="text-2xl md:text-3xl">👋</span>
          </div>
          <p className="text-muted-foreground capitalize">{hojeFormatado}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="shadow-sm">
            <Link to="/agenda">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pacientes">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
        </div>
      </div>

      {!hasData ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Database className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-success flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-success-foreground" />
              </div>
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-semibold font-display mb-2">Sistema Conectado!</h2>
              <p className="text-muted-foreground">
                Seu sistema EloLab está conectado ao banco de dados. Comece cadastrando pacientes e médicos para ver as métricas aqui.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Button asChild size="lg">
                <Link to="/pacientes">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Paciente
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/medicos">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Cadastrar Médico
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 animate-fade-in">
            <FinancialSummaryCard
              title="Recebido"
              value={formatCurrency(receitasMes)}
              icon={CheckCircle2}
              colorClass="from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-600"
            />
            <FinancialSummaryCard
              title="A Receber"
              value={formatCurrency(aReceber)}
              icon={Clock}
              colorClass="from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-600"
            />
            <FinancialSummaryCard
              title="Inadimplente"
              value={formatCurrency(inadimplente)}
              icon={AlertTriangle}
              colorClass="from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 text-rose-600"
              subtitle={`${inadimplenciaRate}% do total`}
            />
            <FinancialSummaryCard
              title="Despesas"
              value={formatCurrency(despesas)}
              icon={TrendingDown}
              colorClass="from-red-500/10 via-red-500/5 to-transparent border-red-500/20 text-red-500"
            />
            <FinancialSummaryCard
              title="Saldo Líquido"
              value={formatCurrency(saldoLiquido)}
              icon={Wallet}
              colorClass={cn(
                saldoLiquido >= 0
                  ? "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-600"
                  : "from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30 text-rose-600"
              )}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total de Pacientes"
              value={pacientes.length}
              description="Pacientes cadastrados"
              icon={<Users className="h-5 w-5" />}
              iconColor="primary"
              href="/pacientes"
              index={0}
            />
            <StatCard
              title="Consultas Hoje"
              value={consultasHoje}
              description={`${agendamentos.length} agendamentos total`}
              icon={<Calendar className="h-5 w-5" />}
              iconColor="success"
              href="/agenda"
              index={1}
            />
            <StatCard
              title="Médicos Ativos"
              value={medicos.filter(m => m.ativo).length}
              description={`${medicos.length} cadastrados`}
              icon={<Stethoscope className="h-5 w-5" />}
              iconColor="info"
              href="/medicos"
              index={2}
            />
            <StatCard
              title="Estoque"
              value={estoque.length}
              description={estoqueBaixo > 0 ? `⚠️ ${estoqueBaixo} itens baixos` : 'Estoque normal'}
              icon={<Package className="h-5 w-5" />}
              iconColor={estoqueBaixo > 0 ? 'warning' : 'primary'}
              href="/estoque"
              index={3}
            />
          </div>

          {/* Charts + Appointments Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Revenue Chart */}
            <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Fluxo de Caixa
                </CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {lancamentos.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} />
                        <YAxis className="text-xs fill-muted-foreground" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Sem dados financeiros</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-success" />
                    </div>
                    Próximos Agendamentos
                  </CardTitle>
                  <CardDescription>Consultas agendadas</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {proximosAgendamentos.length > 0 ? (
                  <div className="space-y-3">
                    {proximosAgendamentos.map((ag) => (
                      <div
                        key={ag.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                            <Calendar className="h-5 w-5 text-info" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Paciente</p>
                            <p className="text-xs text-muted-foreground">{ag.observacoes || ag.tipo || 'Consulta'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{ag.hora_inicio}</p>
                          <p className="text-xs text-muted-foreground">
                            {ag.data === hoje ? 'Hoje' : format(parseISO(ag.data), 'dd/MM', { locale: ptBR })}
                          </p>
                          <Badge variant={ag.status === 'confirmado' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                            {ag.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link to="/agenda">
                        Ver agenda completa <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum agendamento próximo</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link to="/agenda">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agendamento
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Banco de dados</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Autenticação</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Ativa
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Seu perfil</span>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role || 'Sem função'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-success" />
                  </div>
                  Acesso Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50" asChild>
                  <Link to="/fila">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Fila de Atendimento
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50" asChild>
                  <Link to="/prontuarios">
                    <div className="h-6 w-6 rounded-md bg-info/10 flex items-center justify-center mr-3">
                      <FileText className="h-3.5 w-3.5 text-info" />
                    </div>
                    Prontuários
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50" asChild>
                  <Link to="/laboratorio">
                    <div className="h-6 w-6 rounded-md bg-warning/10 flex items-center justify-center mr-3">
                      <Package className="h-3.5 w-3.5 text-warning" />
                    </div>
                    Laboratório
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50" asChild>
                  <Link to="/tarefas">
                    <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center mr-3">
                      <FileText className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    Tarefas
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-info" />
                  </div>
                  Resumo Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Pacientes</span>
                  <span className="text-sm font-semibold">{pacientes.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Médicos</span>
                  <span className="text-sm font-semibold">{medicos.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Itens em estoque</span>
                  <span className="text-sm font-semibold">{estoque.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Agendamentos</span>
                  <span className="text-sm font-semibold">{agendamentos.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
