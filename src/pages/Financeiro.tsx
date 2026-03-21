import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, CheckCircle2, Clock,
  AlertTriangle, HandCoins, CreditCard, Wallet, BarChart3,
  ArrowRight, Stethoscope, Receipt, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLancamentos } from '@/hooks/useSupabaseData';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtShort = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : fmt(v);

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function Financeiro() {
  const navigate = useNavigate();
  const { data: lancamentos = [], isLoading } = useLancamentos();

  const now = new Date();
  const mesAtual = { start: startOfMonth(now), end: endOfMonth(now) };

  const kpis = useMemo(() => {
    const doMes = lancamentos.filter(l => {
      const d = new Date(l.data);
      return d >= mesAtual.start && d <= mesAtual.end;
    });
    const receitas = doMes.filter(l => l.tipo === 'receita');
    const despesas = doMes.filter(l => l.tipo === 'despesa');
    const recebido = receitas.filter(l => l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0);
    const aReceber = receitas.filter(l => l.status === 'pendente').reduce((a, l) => a + Number(l.valor), 0);
    const vencido = receitas.filter(l => {
      if (l.status !== 'pendente' || !l.data_vencimento) return false;
      return l.data_vencimento < format(now, 'yyyy-MM-dd');
    }).reduce((a, l) => a + Number(l.valor), 0);
    const totalDespesas = despesas.filter(l => l.status === 'pago').reduce((a, l) => a + Number(l.valor), 0);
    const aPagar = despesas.filter(l => l.status === 'pendente').reduce((a, l) => a + Number(l.valor), 0);
    const saldo = recebido - totalDespesas;
    const countPendentesReceber = receitas.filter(l => l.status === 'pendente').length;
    const countPendentesPagar = despesas.filter(l => l.status === 'pendente').length;
    return { recebido, aReceber, vencido, totalDespesas, aPagar, saldo, countPendentesReceber, countPendentesPagar };
  }, [lancamentos, mesAtual]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const m = d.getMonth(); const y = d.getFullYear();
      const rec = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pago' && new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y).reduce((a, l) => a + Number(l.valor), 0);
      const des = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pago' && new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y).reduce((a, l) => a + Number(l.valor), 0);
      return { name: format(d, 'MMM', { locale: ptBR }), receitas: rec, despesas: des };
    });
  }, [lancamentos]);

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Painel Financeiro
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo do mês de {format(now, 'MMMM yyyy', { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Recebido', value: kpis.recebido, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          { label: 'A Receber', value: kpis.aReceber, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', sub: kpis.countPendentesReceber > 0 ? `${kpis.countPendentesReceber} pendente(s)` : undefined },
          { label: 'Inadimplente', value: kpis.vencido, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
          { label: 'Despesas Pagas', value: kpis.totalDespesas, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
          { label: 'A Pagar', value: kpis.aPagar, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', sub: kpis.countPendentesPagar > 0 ? `${kpis.countPendentesPagar} pendente(s)` : undefined },
          { label: 'Saldo Líquido', value: kpis.saldo, icon: DollarSign,
            color: kpis.saldo >= 0 ? 'text-success' : 'text-destructive',
            bg: kpis.saldo >= 0 ? 'bg-success/10' : 'bg-destructive/10',
            border: kpis.saldo >= 0 ? 'border-success/20' : 'border-destructive/20' },
        ].map((s, i) => (
          <motion.div key={s.label} variants={fadeUp}>
            <Card className={cn('border hover:shadow-md hover:-translate-y-0.5 transition-all', s.border)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className={cn('text-2xl font-black mt-1 tabular-nums', s.color)}>{fmtShort(s.value)}</p>
                    {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
                  </div>
                  <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', s.bg)}>
                    <s.icon className={cn('h-5 w-5', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fluxo de Caixa — Últimos 6 meses</CardTitle>
            <CardDescription>Receitas vs Despesas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
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
      </motion.div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Caixa Diário', desc: 'Abrir/fechar caixa, receber pagamentos do dia', icon: HandCoins, href: '/caixa', color: 'text-success', bg: 'bg-success/10' },
            { label: 'Contas a Receber', desc: 'Cobranças, recebimentos e inadimplência', icon: TrendingUp, href: '/contas-receber', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Contas a Pagar', desc: 'Fornecedores, salários, impostos e despesas', icon: CreditCard, href: '/contas-pagar', color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'Fluxo de Caixa', desc: 'Visão mensal de entradas e saídas', icon: Wallet, href: '/fluxo-caixa', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Tabela de Preços', desc: 'Preços de exames por convênio', icon: Receipt, href: '/precos-exames', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Tipos de Consulta', desc: 'Valores, durações e categorias', icon: Stethoscope, href: '/tipos-consulta', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Relatórios', desc: 'Exportações e análises detalhadas', icon: BarChart3, href: '/relatorios', color: 'text-teal-500', bg: 'bg-teal-500/10' },
            { label: 'DRE', desc: 'Demonstrativo de Resultado', icon: FileText, href: '/financeiro', color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map((item) => (
            <Card key={item.href + item.label} className="group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all border"
              onClick={() => item.href !== '/financeiro' && navigate(item.href)}>
              <CardContent className="py-5 px-5">
                <div className="flex items-start gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
                    <item.icon className={cn('h-5 w-5', item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{item.label}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
