import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
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
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  };

  const content = (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
      "animate-fade-in"
    )} style={{ animationDelay: `${index * 100}ms` }}>
      {/* Decorative gradient */}
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
            <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
            {trend >= 0 ? '+' : ''}{trend}% em relação ao mês anterior
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
  
  const receitasMes = lancamentos
    .filter(l => {
      const data = new Date(l.data);
      return l.tipo === 'receita' && l.status === 'pago' && 
             data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    })
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const estoqueBaixo = estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasData = pacientes.length > 0 || agendamentos.length > 0 || lancamentos.length > 0;

  return (
    <div className="space-y-8">
      <ServiceStatusBanner />
      {/* Header */}
      <div className="relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
              Olá, {user?.nome?.split(' ')[0] || 'Usuário'}!
            </h1>
            <span className="text-2xl md:text-3xl">👋</span>
          </div>
          <p className="text-muted-foreground capitalize">{hojeFormatado}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="shadow-sm">
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
        /* Stats Grid */
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
            title="Faturamento do Mês"
            value={receitasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            description="Receitas confirmadas"
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="warning"
            href="/financeiro"
            index={2}
          />
          <StatCard
            title="Médicos Ativos"
            value={medicos.filter(m => m.ativo).length}
            description={`${estoqueBaixo} itens em estoque baixo`}
            icon={<Stethoscope className="h-5 w-5" />}
            iconColor="info"
            href="/medicos"
            index={3}
          />
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
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
              <span className="text-sm font-medium capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                {user?.role || 'Sem função'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
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
              <Link to="/estoque">
                <div className="h-6 w-6 rounded-md bg-warning/10 flex items-center justify-center mr-3">
                  <Package className="h-3.5 w-3.5 text-warning" />
                </div>
                Estoque
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
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
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Itens em estoque</span>
              <span className="text-sm font-semibold">{estoque.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
