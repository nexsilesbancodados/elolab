import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getAll } from '@/lib/localStorage';
import { Agendamento, Paciente, Lancamento } from '@/types';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  UserPlus,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-display font-bold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp className={`h-4 w-4 ${trend.positive ? 'text-success' : 'text-destructive rotate-180'}`} />
                <span className={`text-sm font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}>
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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pacientesTotal: 0,
    consultasHoje: 0,
    faturamentoMes: 0,
    aguardando: 0,
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    // Load stats from localStorage
    const pacientes = getAll<Paciente>('pacientes');
    const agendamentos = getAll<Agendamento>('agendamentos');
    const lancamentos = getAll<Lancamento>('lancamentos');

    const hoje = new Date().toISOString().split('T')[0];
    const consultasHoje = agendamentos.filter(a => a.data === hoje);
    const aguardando = agendamentos.filter(a => a.status === 'aguardando').length;

    const mesAtual = new Date().getMonth();
    const faturamentoMes = lancamentos
      .filter(l => l.tipo === 'receita' && new Date(l.data).getMonth() === mesAtual)
      .reduce((acc, l) => acc + l.valor, 0);

    setStats({
      pacientesTotal: pacientes.length || 150, // Mock data if empty
      consultasHoje: consultasHoje.length || 12,
      faturamentoMes: faturamentoMes || 45000,
      aguardando: aguardando || 3,
    });

    setProximosAgendamentos(consultasHoje.slice(0, 5));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {getGreeting()}, {user?.nome.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo do seu dia
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
          trend={{ value: 12, positive: true }}
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
          value={`R$ ${stats.faturamentoMes.toLocaleString('pt-BR')}`}
          description="Receita mensal"
          icon={DollarSign}
          trend={{ value: 8, positive: true }}
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

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos Atendimentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Atendimentos</CardTitle>
              <CardDescription>Agenda de hoje</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agenda">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length > 0 ? (
              <div className="space-y-4">
                {proximosAgendamentos.map(agendamento => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {agendamento.horaInicio}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">Paciente #{agendamento.pacienteId}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {agendamento.tipo}
                        </p>
                      </div>
                    </div>
                    <Badge variant={agendamento.status === 'confirmado' ? 'default' : 'secondary'}>
                      {agendamento.status}
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

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
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
                <Link to="/financeiro">
                  <DollarSign className="h-6 w-6" />
                  <span>Financeiro</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
