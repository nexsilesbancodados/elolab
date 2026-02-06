import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  DollarSign,
  Activity,
  Stethoscope,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function KPICard({ title, value, change, icon, description }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change)}% vs mês anterior
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  // Buscar dados para análise
  const { data: agendamentos = [] } = useQuery({
    queryKey: ['analytics-agendamentos'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['analytics-lancamentos'],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data', start.split('T')[0])
        .lte('data', end.split('T')[0]);
      if (error) throw error;
      return data;
    },
  });

  const { data: triagens = [] } = useQuery({
    queryKey: ['analytics-triagens'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('triagens')
        .select('*')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  const { data: retornos = [] } = useQuery({
    queryKey: ['analytics-retornos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retornos')
        .select('*')
        .eq('status', 'agendado');
      if (error) throw error;
      return data;
    },
  });

  // Calcular KPIs
  const totalAgendamentos = agendamentos.length;
  const agendamentosFinalizados = agendamentos.filter(a => a.status === 'finalizado').length;
  const taxaComparecimento = totalAgendamentos > 0 
    ? Math.round((agendamentosFinalizados / totalAgendamentos) * 100) 
    : 0;

  const receitaTotal = lancamentos
    .filter(l => l.tipo === 'receita' && l.status === 'pago')
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const despesaTotal = lancamentos
    .filter(l => l.tipo === 'despesa' && l.status === 'pago')
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const taxaRetorno = retornos.length;

  // Dados para gráficos
  const agendamentosPorDia = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = agendamentos.filter(a => a.data === dateStr).length;
    return {
      dia: format(date, 'EEE', { locale: ptBR }),
      agendamentos: count,
    };
  });

  const statusAgendamentos = [
    { name: 'Finalizados', value: agendamentos.filter(a => a.status === 'finalizado').length },
    { name: 'Confirmados', value: agendamentos.filter(a => a.status === 'confirmado').length },
    { name: 'Aguardando', value: agendamentos.filter(a => a.status === 'aguardando').length },
    { name: 'Cancelados', value: agendamentos.filter(a => a.status === 'cancelado').length },
    { name: 'Faltou', value: agendamentos.filter(a => a.status === 'faltou').length },
  ].filter(s => s.value > 0);

  const classificacaoRisco = [
    { name: 'Verde', value: triagens.filter(t => t.classificacao_risco === 'verde').length, color: '#22c55e' },
    { name: 'Amarelo', value: triagens.filter(t => t.classificacao_risco === 'amarelo').length, color: '#eab308' },
    { name: 'Laranja', value: triagens.filter(t => t.classificacao_risco === 'laranja').length, color: '#f97316' },
    { name: 'Vermelho', value: triagens.filter(t => t.classificacao_risco === 'vermelho').length, color: '#ef4444' },
  ].filter(c => c.value > 0);

  const fluxoCaixaDiario = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const receitas = lancamentos
      .filter(l => l.data === dateStr && l.tipo === 'receita' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const despesas = lancamentos
      .filter(l => l.data === dateStr && l.tipo === 'despesa' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);
    return {
      dia: format(date, 'dd/MM'),
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Dashboard Analytics
        </h1>
        <p className="text-muted-foreground">
          Métricas e indicadores de desempenho da clínica
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Taxa de Comparecimento"
          value={`${taxaComparecimento}%`}
          change={5}
          icon={<Users className="h-6 w-6 text-primary" />}
          description={`${agendamentosFinalizados} de ${totalAgendamentos} consultas`}
        />
        <KPICard
          title="Receita do Mês"
          value={receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          change={12}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
        />
        <KPICard
          title="Retornos Agendados"
          value={taxaRetorno}
          icon={<Calendar className="h-6 w-6 text-primary" />}
          description="Pacientes com retorno marcado"
        />
        <KPICard
          title="Triagens Realizadas"
          value={triagens.length}
          icon={<Stethoscope className="h-6 w-6 text-primary" />}
          description="Últimos 30 dias"
        />
      </div>

      <Tabs defaultValue="atendimento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="triagem">Triagem</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimento" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Dia</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agendamentosPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dia" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="agendamentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Agendamentos</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusAgendamentos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusAgendamentos.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-3xl font-bold text-success">
                    {receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Despesa Total</p>
                  <p className="text-3xl font-bold text-destructive">
                    {despesaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-3xl font-bold ${receitaTotal - despesaTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {(receitaTotal - despesaTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Receitas vs Despesas - Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={fluxoCaixaDiario}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                  <Area type="monotone" dataKey="receitas" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="despesas" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triagem" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Classificação de Risco</CardTitle>
                <CardDescription>Protocolo Manchester - Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={classificacaoRisco}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {classificacaoRisco.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Triagens</CardTitle>
                <CardDescription>Estatísticas do período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Total de Triagens</span>
                  <span className="font-bold">{triagens.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <span>Risco Baixo (Verde)</span>
                  <span className="font-bold text-success">
                    {triagens.filter(t => t.classificacao_risco === 'verde').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                  <span>Risco Médio (Amarelo)</span>
                  <span className="font-bold text-warning">
                    {triagens.filter(t => t.classificacao_risco === 'amarelo').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span>Risco Alto (Laranja/Vermelho)</span>
                  <span className="font-bold text-destructive">
                    {triagens.filter(t => ['laranja', 'vermelho'].includes(t.classificacao_risco || '')).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
