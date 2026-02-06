import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  href?: string;
}

function StatCard({ title, value, description, icon, trend, href }: StatCardProps) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend !== undefined && (
          <div className={`text-xs mt-2 ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
            {trend >= 0 ? '+' : ''}{trend}% em relação ao mês anterior
          </div>
        )}
      </CardContent>
      {href && (
        <div className="absolute bottom-2 right-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

export default function Dashboard() {
  const { profile: user } = useSupabaseAuth();
  
  // Use Supabase data hooks
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: lancamentos = [], isLoading: loadingLancamentos } = useLancamentos();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: estoque = [], isLoading: loadingEstoque } = useEstoque();
  
  const isLoading = loadingPacientes || loadingAgendamentos || loadingLancamentos || loadingMedicos || loadingEstoque;

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  // Calculate stats from Supabase data
  const consultasHoje = agendamentos.filter(a => a.data === hoje).length;
  
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  
  const receitasMes = lancamentos
    .filter(l => {
      const data = new Date(l.data);
      return l.tipo === 'receita' && l.status === 'pago' && 
             data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const estoqueBaixo = estoque.filter(e => e.quantidade <= e.quantidade_minima).length;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasData = pacientes.length > 0 || agendamentos.length > 0 || lancamentos.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Olá, {user?.nome?.split(' ')[0] || 'Usuário'}! 👋
        </h1>
        <p className="text-muted-foreground capitalize">{hojeFormatado}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/agenda">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/pacientes">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/prescricoes">
            <FileText className="mr-2 h-4 w-4" />
            Nova Prescrição
          </Link>
        </Button>
      </div>

      {!hasData ? (
        /* Empty State */
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Banco de Dados Conectado</h2>
              <p className="text-muted-foreground max-w-md">
                Seu sistema está conectado ao Supabase, mas ainda não há dados cadastrados.
                Comece adicionando pacientes, médicos e agendamentos para ver as métricas aqui.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button asChild>
                <Link to="/pacientes">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Paciente
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/medicos">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Cadastrar Médico
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Stats Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Pacientes"
            value={pacientes.length}
            description="Pacientes cadastrados"
            icon={<Users className="h-4 w-4 text-primary" />}
            href="/pacientes"
          />
          <StatCard
            title="Consultas Hoje"
            value={consultasHoje}
            description={`${agendamentos.length} agendamentos total`}
            icon={<Calendar className="h-4 w-4 text-primary" />}
            href="/agenda"
          />
          <StatCard
            title="Faturamento do Mês"
            value={receitasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            description="Receitas confirmadas"
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            href="/financeiro"
          />
          <StatCard
            title="Médicos Ativos"
            value={medicos.filter(m => m.ativo).length}
            description={`${estoqueBaixo} itens em estoque baixo`}
            icon={<Stethoscope className="h-4 w-4 text-primary" />}
            href="/medicos"
          />
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Banco de dados</span>
              <span className="text-sm font-medium text-success">Conectado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Autenticação</span>
              <span className="text-sm font-medium text-success">Ativa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seu perfil</span>
              <span className="text-sm font-medium capitalize">{user?.role || 'Sem função'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/fila">
                <Users className="mr-2 h-4 w-4" />
                Fila de Atendimento
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/prontuarios">
                <FileText className="mr-2 h-4 w-4" />
                Prontuários
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/estoque">
                <Package className="mr-2 h-4 w-4" />
                Estoque
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pacientes</span>
              <span className="text-sm font-medium">{pacientes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Médicos</span>
              <span className="text-sm font-medium">{medicos.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Itens em estoque</span>
              <span className="text-sm font-medium">{estoque.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
