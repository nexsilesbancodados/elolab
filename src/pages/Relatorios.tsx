import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
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
import { usePacientes, useAgendamentos, useLancamentos, useMedicos, useEstoque } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { exportarFinanceiro, exportarPacientes, exportarAgendamentos, exportarEstoque } from '@/lib/excelExporter';
import { gerarRelatorioFinanceiro, gerarRelatorioAtendimentos, openPDF } from '@/lib/pdfGenerator';
import { Skeleton } from '@/components/ui/skeleton';
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
  Legend,
} from 'recharts';

const CHART_COLORS = ['#0066CC', '#00A86B', '#FFB020', '#FF4D4F', '#722ED1'];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mes_atual');

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: lancamentos = [], isLoading: loadingLancamentos } = useLancamentos();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: estoque = [], isLoading: loadingEstoque } = useEstoque();

  const isLoading = loadingPacientes || loadingAgendamentos || loadingLancamentos || loadingMedicos || loadingEstoque;

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
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const despesas = lancamentosFiltrados
      .filter(l => l.tipo === 'despesa' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const pendentes = lancamentosFiltrados
      .filter(l => l.status === 'pendente')
      .reduce((acc, l) => acc + Number(l.valor), 0);

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
        .reduce((acc, l) => acc + Number(l.valor), 0);
      const despesa = lancamentosFiltrados
        .filter(l => l.data === diaStr && l.tipo === 'despesa' && l.status === 'pago')
        .reduce((acc, l) => acc + Number(l.valor), 0);

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
      const atendimentos = agendamentosFiltrados.filter(a => a.medico_id === medico.id).length;
      const finalizados = agendamentosFiltrados.filter(
        a => a.medico_id === medico.id && a.status === 'finalizado'
      ).length;

      return {
        nome: medico.crm,
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
      const tipo = a.tipo || 'consulta';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
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
        const forma = l.forma_pagamento || 'Não informado';
        formas[forma] = (formas[forma] || 0) + Number(l.valor);
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

  const handleExportExcel = () => {
    exportarFinanceiro(lancamentosFiltrados.map(l => ({
      data: l.data,
      tipo: l.tipo,
      categoria: l.categoria,
      descricao: l.descricao,
      valor: Number(l.valor),
      status: l.status || 'pendente',
      formaPagamento: l.forma_pagamento || '',
    })));
  };

  const handleExportPDF = () => {
    const periodoLabel = {
      mes_atual: 'Mês Atual',
      mes_anterior: 'Mês Anterior',
      ultimos_3_meses: 'Últimos 3 Meses',
      ultimos_6_meses: 'Últimos 6 Meses',
    }[periodo] || periodo;

    const doc = gerarRelatorioFinanceiro({
      periodo: periodoLabel,
      receitas: estatisticas.receitas,
      despesas: estatisticas.despesas,
      lucro: estatisticas.lucro,
      lancamentos: lancamentosFiltrados.map(l => ({
        data: format(parseISO(l.data), 'dd/MM/yyyy'),
        tipo: l.tipo,
        categoria: l.categoria,
        descricao: l.descricao,
        valor: Number(l.valor),
        status: l.status || 'pendente',
      })),
    });
    openPDF(doc);
  };

  const handleExportAtendimentosPDF = () => {
    const periodoLabel = {
      mes_atual: 'Mês Atual',
      mes_anterior: 'Mês Anterior',
      ultimos_3_meses: 'Últimos 3 Meses',
      ultimos_6_meses: 'Últimos 6 Meses',
    }[periodo] || periodo;

    const doc = gerarRelatorioAtendimentos({
      periodo: periodoLabel,
      totalAtendimentos: estatisticas.totalAtendimentos,
      porMedico: dadosPorMedico,
      porTipo: dadosPorTipo.map(t => ({ tipo: t.name, quantidade: t.value })),
    });
    openPDF(doc);
  };

  const handleExportPacientesExcel = () => {
    exportarPacientes(pacientes.map(p => ({
      nome: p.nome,
      cpf: p.cpf || '',
      dataNascimento: p.data_nascimento || '',
      telefone: p.telefone || '',
      email: p.email || '',
      sexo: p.sexo || '',
    })));
  };

  const handleExportAgendamentosExcel = () => {
    exportarAgendamentos(agendamentosFiltrados.map(a => ({
      data: a.data,
      horaInicio: a.hora_inicio || '',
      horaFim: a.hora_fim || '',
      paciente: a.paciente_id,
      medico: a.medico_id,
      tipo: a.tipo || 'consulta',
      status: a.status || 'agendado',
    })));
  };

  const handleExportEstoqueExcel = () => {
    exportarEstoque(estoque.map(e => ({
      nome: e.nome,
      categoria: e.categoria,
      quantidade: e.quantidade,
      quantidadeMinima: e.quantidade_minima || 0,
      unidade: e.unidade || 'un',
      valorUnitario: Number(e.valor_unitario) || 0,
      fornecedor: e.fornecedor || '',
      validade: e.validade || '',
    })));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho e indicadores</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
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
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
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
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
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

      {/* KPIs Extras */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taxa Comparecimento</p>
            <p className="text-2xl font-bold text-primary">{estatisticas.taxaComparecimento}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold">
              {formatCurrency(estatisticas.atendimentosFinalizados > 0 ? estatisticas.receitas / estatisticas.atendimentosFinalizados : 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cancelamentos</p>
            <p className="text-2xl font-bold text-destructive">{estatisticas.cancelamentos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Valores Pendentes</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(estatisticas.pendentes)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financeiro" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="medicos">Por Médico</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
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
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExportAtendimentosPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
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

            {/* Por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Atendimento</CardTitle>
                <CardDescription>Distribuição por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPorTipo}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
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
        </TabsContent>

        <TabsContent value="medicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Médico</CardTitle>
              <CardDescription>Atendimentos realizados no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Médico</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-right">Agendados</TableHead>
                      <TableHead className="text-right">Finalizados</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosPorMedico.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum atendimento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      dadosPorMedico.map((medico, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{medico.nome}</TableCell>
                          <TableCell>{medico.especialidade}</TableCell>
                          <TableCell className="text-right">{medico.atendimentos}</TableCell>
                          <TableCell className="text-right">{medico.finalizados}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={cn(
                              medico.taxa >= 80 && 'bg-green-100 text-green-800',
                              medico.taxa >= 50 && medico.taxa < 80 && 'bg-yellow-100 text-yellow-800',
                              medico.taxa < 50 && 'bg-red-100 text-red-800'
                            )}>
                              {medico.taxa}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pacientes" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                <p className="text-2xl font-bold">{pacientes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Com Convênio</p>
                <p className="text-2xl font-bold">{pacientes.filter(p => p.convenio_id).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Com Alergias</p>
                <p className="text-2xl font-bold text-destructive">
                  {pacientes.filter(p => p.alergias && p.alergias.length > 0).length}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Sexo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(() => {
                        const sexos: Record<string, number> = {};
                        pacientes.forEach(p => {
                          const s = p.sexo || 'Não informado';
                          sexos[s] = (sexos[s] || 0) + 1;
                        });
                        return Object.entries(sexos).map(([name, value]) => ({
                          name: name === 'M' ? 'Masculino' : name === 'F' ? 'Feminino' : name,
                          value,
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[0, 1, 2, 3].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Itens em Estoque</p>
                <p className="text-2xl font-bold">{estoque.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl font-bold text-destructive">
                  {estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(estoque.reduce((acc, e) => acc + (e.quantidade * (e.valor_unitario || 0)), 0))}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Itens com Estoque Crítico</CardTitle>
              <CardDescription>Abaixo da quantidade mínima</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd. Atual</TableHead>
                      <TableHead className="text-right">Qtd. Mínima</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoque
                      .filter(e => e.quantidade <= (e.quantidade_minima || 0))
                      .sort((a, b) => a.quantidade - b.quantidade)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{item.quantidade}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade_minima || 0}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.valor_unitario || 0)}</TableCell>
                        </TableRow>
                      ))}
                    {estoque.filter(e => e.quantidade <= (e.quantidade_minima || 0)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum item com estoque crítico
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const cats: Record<string, number> = {};
                    estoque.forEach(e => {
                      cats[e.categoria] = (cats[e.categoria] || 0) + 1;
                    });
                    return Object.entries(cats).map(([name, value]) => ({ name, quantidade: value }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Itens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Status dos agendamentos no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const statusCount: Record<string, number> = {};
                    agendamentosFiltrados.forEach(a => {
                      const s = a.status || 'agendado';
                      statusCount[s] = (statusCount[s] || 0) + 1;
                    });
                    return Object.entries(statusCount).map(([name, value]) => ({
                      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                      quantidade: value,
                    }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
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
