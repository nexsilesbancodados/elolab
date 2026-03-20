import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Calendar, Download, FileText, Loader2, Eye, Edit,
  Trash2, Filter, TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertTriangle, BarChart3, RefreshCw, Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLancamentos } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';

// ─── Helpers ───────────────────────────────────────────────
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtShort = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : fmt(v);

const STATUS_CONFIG = {
  pago: { label: 'Pago', cls: 'badge-success' },
  pendente: { label: 'Pendente', cls: 'badge-warning' },
  vencido: { label: 'Vencido', cls: 'badge-destructive' },
  cancelado: { label: 'Cancelado', cls: 'bg-muted text-muted-foreground border-border' },
  fatura_fechada: { label: 'Faturado', cls: 'badge-info' },
};

const TIPO_CONFIG = {
  receita: { label: 'Receita', cls: 'badge-success' },
  despesa: { label: 'Despesa', cls: 'badge-destructive' },
};

const CATEGORIAS_RECEITA = ['Consulta', 'Retorno', 'Procedimento', 'Exame', 'Plano de saúde', 'Particular', 'Outro'];
const CATEGORIAS_DESPESA = ['Salários', 'Aluguel', 'Equipamentos', 'Materiais', 'Impostos', 'Serviços', 'Outro'];
const FORMAS_PAGAMENTO = ['Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'PIX', 'Transferência', 'Boleto', 'Convênio'];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ─── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: any; color: string; trend?: { value: number; positive: boolean };
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold font-display mt-1 tabular-nums">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              {trend && (
                <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
                  {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend.value)}% vs mês anterior
                </div>
              )}
            </div>
            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center ring-1 transition-transform group-hover:scale-110', color)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function Financeiro() {
  const [periodo, setPeriodo] = useState('mes_atual');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: 'receita',
    categoria: '',
    descricao: '',
    valor: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: '',
    status: 'pendente',
    forma_pagamento: '',
  });

  const queryClient = useQueryClient();
  const { data: lancamentos = [], isLoading } = useLancamentos();

  // ─── Date range ──────────────────────────────────────────
  const range = useMemo(() => {
    const now = new Date();
    switch (periodo) {
      case 'mes_atual': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'mes_anterior': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'ultimos_3': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'ultimos_6': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodo]);

  // ─── Filtered data ───────────────────────────────────────
  const filtered = useMemo(() => {
    return lancamentos.filter(l => {
      const d = new Date(l.data);
      if (d < range.start || d > range.end) return false;
      if (tipoFiltro !== 'todos' && l.tipo !== tipoFiltro) return false;
      if (statusFiltro !== 'todos' && l.status !== statusFiltro) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!l.descricao?.toLowerCase().includes(q) && !l.categoria?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [lancamentos, range, tipoFiltro, statusFiltro, search]);

  // ─── KPIs ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const receitas = filtered.filter(l => l.tipo === 'receita');
    const despesas = filtered.filter(l => l.tipo === 'despesa');
    const recebido = receitas.filter(l => l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0);
    const aReceber = receitas.filter(l => l.status === 'pendente').reduce((a, l) => a + Number(l.valor), 0);
    const vencido = receitas.filter(l => l.status === 'vencido').reduce((a, l) => a + Number(l.valor), 0);
    const pago = despesas.filter(l => l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0);
    const saldo = recebido - pago;

    // Previous month comparison
    const prevRange = {
      start: startOfMonth(subMonths(range.start, 1)),
      end: endOfMonth(subMonths(range.start, 1)),
    };
    const prevReceitas = lancamentos
      .filter(l => l.tipo === 'receita' && l.status === 'pago')
      .filter(l => { const d = new Date(l.data); return d >= prevRange.start && d <= prevRange.end; })
      .reduce((a, l) => a + Number(l.valor), 0);
    const trendReceita = prevReceitas > 0 ? Math.round(((recebido - prevReceitas) / prevReceitas) * 100) : 0;

    return { recebido, aReceber, vencido, despesas: pago, saldo, trendReceita };
  }, [filtered, lancamentos, range]);

  // ─── Chart data ──────────────────────────────────────────
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const m = d.getMonth(); const y = d.getFullYear();
      const rec = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pago' && new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y).reduce((a, l) => a + Number(l.valor), 0);
      const des = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pago' && new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y).reduce((a, l) => a + Number(l.valor), 0);
      return { name: format(d, 'MMM', { locale: ptBR }), receitas: rec, despesas: des, lucro: rec - des };
    });
    return months;
  }, [lancamentos]);

  // ─── Category breakdown ──────────────────────────────────
  const catData = useMemo(() => {
    const cats: Record<string, number> = {};
    filtered.filter(l => l.tipo === 'receita' && l.status === 'pago').forEach(l => {
      const cat = l.categoria || 'Outro';
      cats[cat] = (cats[cat] || 0) + Number(l.valor);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--chart-4))', 'hsl(var(--muted-foreground))'];

  // ─── CRUD ────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ tipo: 'receita', categoria: '', descricao: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), data_vencimento: '', status: 'pendente', forma_pagamento: '' });
    setFormOpen(true);
  };

  const openEdit = (l: any) => {
    setEditTarget(l);
    setForm({ tipo: l.tipo, categoria: l.categoria || '', descricao: l.descricao || '', valor: String(l.valor), data: l.data, data_vencimento: l.data_vencimento || '', status: l.status, forma_pagamento: l.forma_pagamento || '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao || !form.valor || !form.data) { toast.error('Preencha todos os campos obrigatórios.'); return; }
    setSaving(true);
    try {
      const payload = {
        tipo: form.tipo,
        categoria: form.categoria || 'Outro',
        descricao: form.descricao,
        valor: parseFloat(form.valor.replace(',', '.')),
        data: form.data,
        data_vencimento: form.data_vencimento || null,
        status: form.status as "pendente" | "pago" | "atrasado" | "cancelado" | "estornado",
        forma_pagamento: form.forma_pagamento || null,
      };
      if (editTarget) {
        const { error } = await supabase.from('lancamentos').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        toast.success('Lançamento atualizado!');
      } else {
        const { error } = await supabase.from('lancamentos').insert([payload]);
        if (error) throw error;
        toast.success('Lançamento criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setFormOpen(false);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const { error } = await supabase.from('lancamentos').delete().eq('id', deleteTarget.id);
    setSaving(false);
    if (error) { toast.error('Erro ao excluir'); return; }
    queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    toast.success('Lançamento excluído');
    setDeleteTarget(null);
  };

  const exportarExcel = () => {
    const rows = filtered.map(l => ({
      Data: l.data,
      Tipo: l.tipo,
      Categoria: l.categoria,
      Descrição: l.descricao,
      Valor: Number(l.valor),
      Status: l.status,
      Pagamento: l.forma_pagamento || '',
      Vencimento: l.data_vencimento || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, `financeiro_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Relatório exportado!');
  };

  const categorias = form.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  // ─── DRE data ─────────────────────────────────────────────
  const dreData = useMemo(() => {
    const receitasCats: Record<string, number> = {};
    const despesasCats: Record<string, number> = {};
    filtered.filter(l => l.tipo === 'receita' && l.status === 'pago').forEach(l => {
      const cat = l.categoria || 'Outro';
      receitasCats[cat] = (receitasCats[cat] || 0) + Number(l.valor);
    });
    filtered.filter(l => l.tipo === 'despesa' && l.status === 'pago').forEach(l => {
      const cat = l.categoria || 'Outro';
      despesasCats[cat] = (despesasCats[cat] || 0) + Number(l.valor);
    });
    const totalReceitas = Object.values(receitasCats).reduce((a, b) => a + b, 0);
    const totalDespesas = Object.values(despesasCats).reduce((a, b) => a + b, 0);
    const lucroLiquido = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;
    return { receitasCats, despesasCats, totalReceitas, totalDespesas, lucroLiquido, margem };
  }, [filtered]);

  const [activeTab, setActiveTab] = useState('visao_geral');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-header">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Receitas, despesas e fluxo de caixa</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês atual</SelectItem>
              <SelectItem value="mes_anterior">Mês anterior</SelectItem>
              <SelectItem value="ultimos_3">Últimos 3 meses</SelectItem>
              <SelectItem value="ultimos_6">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['lancamentos'] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportarExcel}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Receipt className="h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Recebido" value={fmtShort(kpis.recebido)} icon={CheckCircle2}
          color="bg-success/10 text-success ring-success/20"
          trend={{ value: Math.abs(kpis.trendReceita), positive: kpis.trendReceita >= 0 }} />
        <KpiCard label="A Receber" value={fmtShort(kpis.aReceber)} icon={Clock}
          color="bg-warning/10 text-warning ring-warning/20"
          sub={kpis.aReceber > 0 ? `${filtered.filter(l => l.tipo === 'receita' && l.status === 'pendente').length} lançamentos` : undefined} />
        <KpiCard label="Inadimplente" value={fmtShort(kpis.vencido)} icon={AlertTriangle}
          color="bg-destructive/10 text-destructive ring-destructive/20" />
        <KpiCard label="Despesas" value={fmtShort(kpis.despesas)} icon={TrendingDown}
          color="bg-destructive/10 text-destructive ring-destructive/20" />
        <KpiCard label="Saldo Líquido" value={fmtShort(kpis.saldo)} icon={DollarSign}
          color={kpis.saldo >= 0 ? 'bg-success/10 text-success ring-success/20' : 'bg-destructive/10 text-destructive ring-destructive/20'} />
      </motion.div>

      {/* Tabs: Visão Geral / DRE */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visao_geral" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="dre" className="gap-1.5"><FileText className="h-3.5 w-3.5" />DRE</TabsTrigger>
        </TabsList>

        <TabsContent value="visao_geral" className="space-y-6 mt-4">

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fluxo de Caixa — 6 meses</CardTitle>
            <CardDescription>Receitas vs Despesas pagas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="name" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                  <Tooltip formatter={(v: number, n: string) => [fmt(v), n === 'receitas' ? 'Receitas' : 'Despesas']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" fill="url(#gRec)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fill="url(#gDes)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {catData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catData} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} className="text-xs" tickFormatter={fmtShort} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs" width={80} />
                    <Tooltip formatter={(v: number) => [fmt(v), 'Valor']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Lançamentos</CardTitle>
                <CardDescription>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Input className="pl-8 w-48 h-8 text-sm" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <Select value={tipoFiltro} onValueChange={v => setTipoFiltro(v as any)}>
                  <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos status</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Pagamento</th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 100).map(l => {
                      const tipoCfg = TIPO_CONFIG[l.tipo as keyof typeof TIPO_CONFIG];
                      const statusCfg = STATUS_CONFIG[l.status as keyof typeof STATUS_CONFIG];
                      return (
                        <tr key={l.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(l.data), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', tipoCfg?.cls)}>
                                {tipoCfg?.label}
                              </span>
                              <span className="font-medium truncate max-w-[200px]">{l.descricao}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{l.categoria}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{l.forma_pagamento || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', statusCfg?.cls)}>
                              {statusCfg?.label}
                            </span>
                          </td>
                          <td className={cn('px-4 py-2.5 text-right font-semibold tabular-nums', l.tipo === 'receita' ? 'text-success' : 'text-destructive')}>
                            {l.tipo === 'receita' ? '+' : '-'}{fmt(Number(l.valor))}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(l)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>

        {/* ─── DRE Tab ─── */}
        <TabsContent value="dre" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Demonstrativo de Resultado do Exercício (DRE)
              </CardTitle>
              <CardDescription>Período: {format(range.start, 'dd/MM/yyyy')} a {format(range.end, 'dd/MM/yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Receitas */}
                <div className="font-semibold text-sm text-success py-2 border-b border-border">RECEITA BRUTA</div>
                {Object.entries(dreData.receitasCats).sort(([,a],[,b]) => b - a).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between py-1.5 px-4 text-sm hover:bg-muted/30 rounded">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="tabular-nums font-medium text-success">+{fmt(val)}</span>
                  </div>
                ))}
                {Object.keys(dreData.receitasCats).length === 0 && (
                  <div className="text-sm text-muted-foreground px-4 py-2">Nenhuma receita no período</div>
                )}
                <div className="flex justify-between py-2 px-4 font-semibold text-sm border-t border-border bg-success/5 rounded">
                  <span>Total Receitas</span>
                  <span className="tabular-nums text-success">{fmt(dreData.totalReceitas)}</span>
                </div>

                <div className="h-3" />

                {/* Despesas */}
                <div className="font-semibold text-sm text-destructive py-2 border-b border-border">DESPESAS OPERACIONAIS</div>
                {Object.entries(dreData.despesasCats).sort(([,a],[,b]) => b - a).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between py-1.5 px-4 text-sm hover:bg-muted/30 rounded">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="tabular-nums font-medium text-destructive">-{fmt(val)}</span>
                  </div>
                ))}
                {Object.keys(dreData.despesasCats).length === 0 && (
                  <div className="text-sm text-muted-foreground px-4 py-2">Nenhuma despesa no período</div>
                )}
                <div className="flex justify-between py-2 px-4 font-semibold text-sm border-t border-border bg-destructive/5 rounded">
                  <span>Total Despesas</span>
                  <span className="tabular-nums text-destructive">-{fmt(dreData.totalDespesas)}</span>
                </div>

                <div className="h-3" />

                {/* Resultado */}
                <div className={cn(
                  "flex justify-between py-3 px-4 font-bold text-base rounded-lg border-2",
                  dreData.lucroLiquido >= 0
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}>
                  <span>RESULTADO LÍQUIDO</span>
                  <div className="text-right">
                    <span className="tabular-nums">{fmt(dreData.lucroLiquido)}</span>
                    <span className="text-xs ml-2 opacity-70">({dreData.margem.toFixed(1)}% margem)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
            <DialogDescription>Preencha os dados do lançamento financeiro.</DialogDescription>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v, categoria: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Consulta particular — Dr. Silva" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento</Label>
                <Input type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select value={form.forma_pagamento} onValueChange={v => setForm(f => ({ ...f, forma_pagamento: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map(fp => <SelectItem key={fp} value={fp}>{fp}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Lançamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.descricao}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
