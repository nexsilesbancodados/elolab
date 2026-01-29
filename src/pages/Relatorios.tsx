import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Agendamento, Paciente, Lancamento, User } from '@/types';
import { getAll } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#0066CC', '#00A86B', '#FFB020', '#FF4D4F', '#722ED1'];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mes_atual');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);

  useEffect(() => {
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setPacientes(getAll<Paciente>('pacientes'));
    setLancamentos(getAll<Lancamento>('lancamentos'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  }, []);

  const periodoRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfMonth(now);

    switch (periodo) {
      case 'mes_atual':
        start = startOfMonth(now);
        break;
      case 'mes_anterior':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'ultimos_3_meses':
        start = startOfMonth(subMonths(now, 2));
        break;
      case 'ultimos_6_meses':
        start = startOfMonth(subMonths(now, 5));
        break;
      default:
        start = startOfMonth(now);
    }

    return { start, end };
  }, [periodo]);

  // Filtrar dados pelo período
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(a => {
      const data = parseISO(a.data);
      return data >= periodoRange.start && data <= periodoRange.end;
    });
  }, [agendamentos, periodoRange]);

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter(l => {
      const data = parseISO(l.data);
      return data >= periodoRange.start && data <= periodoRange.end;
    });
  }, [lancamentos, periodoRange]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const totalAtendimentos = agendamentosFiltrados.length;
    const atendimentosFinalizados = agendamentosFiltrados.filter(a => a.status === 'finalizado').length;
    const cancelamentos = agendamentosFiltrados.filter(a => a.status === 'cancelado').length;
    const faltas = agendamentosFiltrados.filter(a => a.status === 'faltou').length;

    const receitas = lancamentosFiltrados
      .filter(l => l.tipo === 'receita' && l.status === 'pago')
      .reduce((acc, l) => acc + l.valor, 0);

    const despesas = lancamentosFiltrados
      .filter(l => l.tipo === 'despesa' && l.status === 'pago')
      .reduce((acc, l) => acc + l.valor, 0);

    const pendentes = lancamentosFiltrados
      .filter(l => l.status === 'pendente')
      .reduce((acc, l) => acc + l.valor, 0);

    const taxaComparecimento = totalAtendimentos > 0 
      ? Math.round((atendimentosFinalizados / totalAtendimentos) * 100) 
      : 0;

    return {
      totalAtendimentos,
      atendimentosFinalizados,
      cancelamentos,
      faltas,
      receitas,
      despesas,
      lucro: receitas - despesas,
      pendentes,
      taxaComparecimento,
    };
  }, [agendamentosFiltrados, lancamentosFiltrados]);

  // Dados por dia
  const dadosDiarios = useMemo(() => {
    const dias = eachDayOfInterval({
      start: periodoRange.start,
      end: periodoRange.end,
    });

    return dias.map(dia => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      const atendimentos = agendamentosFiltrados.filter(a => a.data === diaStr).length;
      const receita = lancamentosFiltrados
        .filter(l => l.data === diaStr && l.tipo === 'receita' && l.status === 'pago')
        .reduce((acc, l) => acc + l.valor, 0);
      const despesa = lancamentosFiltrados
        .filter(l => l.data === diaStr && l.tipo === 'despesa' && l.status === 'pago')
        .reduce((acc, l) => acc + l.valor, 0);

      return {
        data: format(dia, 'dd/MM'),
        atendimentos,
        receita,
        despesa,
      };
    });
  }, [agendamentosFiltrados, lancamentosFiltrados, periodoRange]);

  // Dados por médico
  const dadosPorMedico = useMemo(() => {
    return medicos.map(medico => {
      const atendimentos = agendamentosFiltrados.filter(a => a.medicoId === medico.id).length;
      const finalizados = agendamentosFiltrados.filter(
        a => a.medicoId === medico.id && a.status === 'finalizado'
      ).length;

      return {
        nome: medico.nome,
        especialidade: medico.especialidade || 'Geral',
        atendimentos,
        finalizados,
        taxa: atendimentos > 0 ? Math.round((finalizados / atendimentos) * 100) : 0,
      };
    }).sort((a, b) => b.atendimentos - a.atendimentos);
  }, [medicos, agendamentosFiltrados]);

  // Dados por tipo de atendimento
  const dadosPorTipo = useMemo(() => {
    const tipos: Record<string, number> = {};
    agendamentosFiltrados.forEach(a => {
      tipos[a.tipo] = (tipos[a.tipo] || 0) + 1;
    });
    return Object.entries(tipos).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [agendamentosFiltrados]);

  // Dados por forma de pagamento
  const dadosPorPagamento = useMemo(() => {
    const formas: Record<string, number> = {};
    lancamentosFiltrados
      .filter(l => l.tipo === 'receita' && l.status === 'pago')
      .forEach(l => {
        const forma = l.formaPagamento || 'Não informado';
        formas[forma] = (formas[forma] || 0) + l.valor;
      });
    return Object.entries(formas).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value,
    }));
  }, [lancamentosFiltrados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportCSV = () => {
    // Implementação simples de export CSV
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status'];
    const rows = lancamentosFiltrados.map(l => [
      format(parseISO(l.data), 'dd/MM/yyyy'),
      l.tipo,
      l.categoria,
      l.descricao,
      l.valor.toString(),
      l.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho e indicadores</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atendimentos</p>
                <p className="text-2xl font-bold">{estatisticas.totalAtendimentos}</p>
                <p className="text-xs text-muted-foreground">
                  {estatisticas.atendimentosFinalizados} finalizados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(estatisticas.receitas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(estatisticas.despesas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className={cn(
                  'text-2xl font-bold',
                  estatisticas.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(estatisticas.lucro)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financeiro" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="medicos">Por Médico</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico de Receitas x Despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas x Despesas</CardTitle>
                <CardDescription>Comparativo diário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosDiarios}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A86B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00A86B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4D4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF4D4F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="#00A86B"
                        fill="url(#colorReceita)"
                        name="Receita"
                      />
                      <Area
                        type="monotone"
                        dataKey="despesa"
                        stroke="#FF4D4F"
                        fill="url(#colorDespesa)"
                        name="Despesa"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>Distribuição das receitas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPorPagamento}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dadosPorPagamento.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="atendimentos" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico de Atendimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Volume de Atendimentos</CardTitle>
                <CardDescription>Por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosDiarios}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="atendimentos" fill="#0066CC" radius={[4, 4, 0, 0]} name="Atendimentos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Atendimento */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Atendimento</CardTitle>
                <CardDescription>Distribuição</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPorTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {dadosPorTipo.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Indicadores */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{estatisticas.taxaComparecimento}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Comparecimento</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{estatisticas.atendimentosFinalizados}</p>
                  <p className="text-sm text-muted-foreground">Finalizados</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-600">{estatisticas.cancelamentos}</p>
                  <p className="text-sm text-muted-foreground">Cancelamentos</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-600">{estatisticas.faltas}</p>
                  <p className="text-sm text-muted-foreground">Faltas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Médico</CardTitle>
              <CardDescription>Atendimentos no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Médico</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-center">Atendimentos</TableHead>
                      <TableHead className="text-center">Finalizados</TableHead>
                      <TableHead className="text-center">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosPorMedico.map((medico) => (
                      <TableRow key={medico.nome}>
                        <TableCell className="font-medium">{medico.nome}</TableCell>
                        <TableCell>{medico.especialidade}</TableCell>
                        <TableCell className="text-center">{medico.atendimentos}</TableCell>
                        <TableCell className="text-center">{medico.finalizados}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            medico.taxa >= 80 ? 'bg-green-100 text-green-800' :
                            medico.taxa >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {medico.taxa}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de barras por médico */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorMedico} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nome" type="category" width={120} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="atendimentos" fill="#0066CC" name="Total" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="finalizados" fill="#00A86B" name="Finalizados" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
