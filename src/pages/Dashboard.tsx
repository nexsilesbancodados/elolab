import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getAll } from '@/lib/localStorage';
import { Agendamento, Paciente, Lancamento, User, FilaAtendimento } from '@/types';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  UserPlus,
  CalendarPlus,
  ArrowRight,
  Activity,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  color: 'primary' | 'success' | 'warning' | 'info';
}

function StatCard({ title, value, description, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {trend.positive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  aguardando: 'bg-yellow-100 text-yellow-800',
  em_atendimento: 'bg-purple-100 text-purple-800',
  finalizado: 'bg-gray-100 text-gray-600',
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Dashboard() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [fila, setFila] = useState<FilaAtendimento[]>([]);

  useEffect(() => {
    setPacientes(getAll<Paciente>('pacientes'));
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setLancamentos(getAll<Lancamento>('lancamentos'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
    setFila(getAll<FilaAtendimento>('fila'));
  }, []);

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const consultasHoje = agendamentos.filter(a => a.data === hoje);
    const aguardando = fila.filter(f => f.status === 'aguardando').length;

    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const receitasMesAtual = lancamentos
      .filter(l => {
        const data = new Date(l.data);
        return l.tipo === 'receita' && l.status === 'pago' && 
               data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      })
      .reduce((acc, l) => acc + l.valor, 0);

    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    
    const receitasMesAnterior = lancamentos
      .filter(l => {
        const data = new Date(l.data);
        return l.tipo === 'receita' && l.status === 'pago' && 
               data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      })
      .reduce((acc, l) => acc + l.valor, 0);

    const trendReceita = receitasMesAnterior > 0 
      ? Math.round(((receitasMesAtual - receitasMesAnterior) / receitasMesAnterior) * 100)
      : 0;

    return {
      pacientesTotal: pacientes.length,
      consultasHoje: consultasHoje.length,
      faturamentoMes: receitasMesAtual,
      aguardando,
      trendReceita,
    };
  }, [pacientes, agendamentos, lancamentos, fila, hoje]);

  const consultasHoje = useMemo(() => {
    return agendamentos
      .filter(a => a.data === hoje)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .slice(0, 6);
  }, [agendamentos, hoje]);

  // Dados para gráfico de faturamento (últimos 7 dias)
  const dadosFaturamento = useMemo(() => {
    const dias: { dia: string; receita: number; despesa: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = format(data, 'yyyy-MM-dd');
      const diaLabel = format(data, 'EEE', { locale: ptBR });

      const receita = lancamentos
        .filter(l => l.data === dataStr && l.tipo === 'receita' && l.status === 'pago')
        .reduce((acc, l) => acc + l.valor, 0);

      const despesa = lancamentos
        .filter(l => l.data === dataStr && l.tipo === 'despesa' && l.status === 'pago')
        .reduce((acc, l) => acc + l.valor, 0);

      dias.push({ dia: diaLabel, receita, despesa });
    }
    return dias;
  }, [lancamentos]);

  // Dados para gráfico de tipos de atendimento
  const dadosTipoAtendimento = useMemo(() => {
    const tipos: Record<string, number> = {};
    agendamentos.forEach(a => {
      tipos[a.tipo] = (tipos[a.tipo] || 0) + 1;
    });
    return Object.entries(tipos).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [agendamentos]);

  // Dados para médicos mais ativos
  const dadosMedicos = useMemo(() => {
    const medicoCount: Record<string, number> = {};
    agendamentos.forEach(a => {
      medicoCount[a.medicoId] = (medicoCount[a.medicoId] || 0) + 1;
    });
    return medicos
      .map(m => ({
        nome: m.nome.split(' ').slice(0, 2).join(' '),
        atendimentos: medicoCount[m.id] || 0,
      }))
      .sort((a, b) => b.atendimentos - a.atendimentos)
      .slice(0, 5);
  }, [agendamentos, medicos]);

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Paciente';
  const getMedicoNome = (id: string) => medicos.find(m => m.id === id)?.nome || 'Médico';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getGreeting()}, {user?.nome.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/pacientes">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
          <Button asChild>
            <Link to="/agenda">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pacientes Cadastrados"
          value={stats.pacientesTotal}
          description="Total no sistema"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Consultas Hoje"
          value={stats.consultasHoje}
          description="Agendamentos para hoje"
          icon={Calendar}
          color="info"
        />
        <StatCard
          title="Faturamento do Mês"
          value={formatCurrency(stats.faturamentoMes)}
          description="Receita mensal"
          icon={DollarSign}
          trend={{ value: Math.abs(stats.trendReceita), positive: stats.trendReceita >= 0 }}
          color="success"
        />
        <StatCard
          title="Aguardando"
          value={stats.aguardando}
          description="Pacientes na fila"
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Faturamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Faturamento (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosFaturamento}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Receita"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Médicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Atendimentos por Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMedicos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="nome" type="category" className="text-xs" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Próximos Atendimentos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agenda de Hoje</CardTitle>
              <CardDescription>{stats.consultasHoje} atendimentos programados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agenda">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {consultasHoje.length > 0 ? (
              <div className="space-y-3">
                {consultasHoje.map(agendamento => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {agendamento.horaInicio}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{getPacienteNome(agendamento.pacienteId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getMedicoNome(agendamento.medicoId)} • {agendamento.tipo}
                        </p>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[agendamento.status]}>
                      {agendamento.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum agendamento para hoje</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/agenda">Criar agendamento</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Atendimento</CardTitle>
            <CardDescription>Distribuição geral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosTipoAtendimento}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dadosTipoAtendimento.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {dadosTipoAtendimento.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/pacientes">
                <Users className="h-6 w-6" />
                <span>Pacientes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/agenda">
                <Calendar className="h-6 w-6" />
                <span>Agenda</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/fila">
                <Clock className="h-6 w-6" />
                <span>Fila</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/prontuarios">
                <Stethoscope className="h-6 w-6" />
                <span>Prontuários</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/financeiro">
                <DollarSign className="h-6 w-6" />
                <span>Financeiro</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/relatorios">
                <Activity className="h-6 w-6" />
                <span>Relatórios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
