import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Lock, Unlock, Plus, Loader2, Trash2, Search, Clock, Printer, Download,
  TrendingUp, TrendingDown, Banknote, CreditCard, QrCode, Wallet, ArrowDownToLine,
  ArrowUpFromLine, FileText, History, DollarSign, Receipt, ChevronRight, CalendarDays,
  BarChart3, Eye,
} from 'lucide-react';
import { printReceiptPdf, downloadReceiptPdf, type ReceiptData } from '@/lib/pdfReceipt';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type LancamentoTipo = 'receita' | 'despesa' | 'sangria' | 'suprimento';
type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'cartao_credito' | 'cartao_debito' | 'cheque' | 'transferencia';

interface Lancamento {
  id: string;
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  categoria: string;
  data: string;
  created_at: string;
}

interface CaixaDiarioType {
  id: string;
  data: string;
  aberto: boolean;
  valor_abertura: number;
  valor_fechamento: number | null;
  operador_abertura: string | null;
  operador_fechamento: string | null;
  observacoes: string | null;
  clinica_id: string;
  created_at: string;
  updated_at: string;
}

const FORMA_ICONS: Record<string, typeof Banknote> = {
  dinheiro: Banknote,
  pix: QrCode,
  credito: CreditCard,
  cartao_credito: CreditCard,
  debito: Wallet,
  cartao_debito: Wallet,
  cheque: FileText,
  transferencia: ArrowUpFromLine,
};

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  cartao_credito: 'Crédito',
  debito: 'Débito',
  cartao_debito: 'Débito',
  cheque: 'Cheque',
  transferencia: 'Transferência',
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

interface ProdutoCarrinho {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  origem: 'consulta' | 'exame' | 'produto' | 'manual';
}

export default function CaixaDiario() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('hoje');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAbertura, setShowAbertura] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showLancamento, setShowLancamento] = useState(false);
  const [showSangria, setShowSangria] = useState(false);
  const [showSuprimento, setShowSuprimento] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showDetalhesCaixa, setShowDetalhesCaixa] = useState<CaixaDiarioType | null>(null);

  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [obsFechamento, setObsFechamento] = useState('');

  // POS state
  const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
  const [catalogoTab, setCatalogoTab] = useState<'consultas' | 'produtos' | 'manual'>('consultas');
  const [catalogoSearch, setCatalogoSearch] = useState('');
  const [lancFormaPagamento, setLancFormaPagamento] = useState<FormaPagamento>('dinheiro');
  const [lancDesconto, setLancDesconto] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualValor, setManualValor] = useState('');

  const [lancamentoForm, setLancamentoForm] = useState({
    tipo: 'receita' as LancamentoTipo,
    valor: '',
    descricao: '',
    forma_pagamento: 'dinheiro' as FormaPagamento,
  });

  const [sangriaForm, setSangriaForm] = useState({ valor: '', motivo: '' });
  const [suprimentoForm, setSuprimentoForm] = useState({ valor: '', descricao: '' });

  // ─── Queries ────────────────────────────────────
  const { data: caixaHoje, isLoading: loadingCaixa } = useQuery({
    queryKey: ['caixa-hoje', today, profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return null;
      const { data } = await supabase
        .from('caixa_diario')
        .select('*')
        .eq('data', today)
        .eq('clinica_id', profile.clinica_id)
        .maybeSingle();
      return data as CaixaDiarioType | null;
    },
    enabled: !!profile?.clinica_id,
  });

  const { data: lancamentos = [], isLoading: loadingLanc } = useQuery({
    queryKey: ['lancamentos-caixa', caixaHoje?.data, profile?.clinica_id],
    queryFn: async () => {
      if (!caixaHoje?.data || !profile?.clinica_id) return [];
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('data', caixaHoje.data)
        .eq('clinica_id', profile.clinica_id)
        .in('tipo', ['receita', 'despesa', 'sangria', 'suprimento'])
        .order('created_at', { ascending: false });
      return (data || []) as Lancamento[];
    },
    enabled: !!caixaHoje?.data && !!profile?.clinica_id,
  });

  // Histórico de caixas anteriores
  const { data: historicosCaixa = [] } = useQuery({
    queryKey: ['historico-caixas', profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return [];
      const { data } = await supabase
        .from('caixa_diario')
        .select('*')
        .eq('clinica_id', profile.clinica_id)
        .order('data', { ascending: false })
        .limit(30);
      return (data || []) as CaixaDiarioType[];
    },
    enabled: !!profile?.clinica_id && activeTab === 'historico',
  });

  // Lançamentos do caixa em detalhe
  const { data: lancamentosDetalhe = [] } = useQuery({
    queryKey: ['lancamentos-detalhe', showDetalhesCaixa?.data],
    queryFn: async () => {
      if (!showDetalhesCaixa?.data || !profile?.clinica_id) return [];
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('data', showDetalhesCaixa.data)
        .eq('clinica_id', profile.clinica_id)
        .in('tipo', ['receita', 'despesa', 'sangria', 'suprimento'])
        .order('created_at', { ascending: false });
      return (data || []) as Lancamento[];
    },
    enabled: !!showDetalhesCaixa?.data,
  });

  // ─── Calculations ───────────────────────────────
  const totais = useMemo(() => {
    const receita = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor || 0), 0);
    const despesa = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor || 0), 0);
    const sangria = lancamentos.filter(l => l.tipo === 'sangria').reduce((s, l) => s + (l.valor || 0), 0);
    const suprimento = lancamentos.filter(l => l.tipo === 'suprimento').reduce((s, l) => s + (l.valor || 0), 0);
    const liquido = receita - despesa - sangria + suprimento;
    const final_ = (caixaHoje?.valor_abertura || 0) + liquido;
    return { receita, despesa, sangria, suprimento, liquido, final: final_ };
  }, [lancamentos, caixaHoje]);

  const breakdownFormas = useMemo(() => {
    const formas: Record<string, number> = {};
    lancamentos.filter(l => l.tipo === 'receita').forEach(l => {
      const key = l.forma_pagamento?.replace('cartao_', '') || 'outros';
      formas[key] = (formas[key] || 0) + (l.valor || 0);
    });
    return formas;
  }, [lancamentos]);

  const lancamentosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return lancamentos;
    const q = searchTerm.toLowerCase();
    return lancamentos.filter(l =>
      l.descricao.toLowerCase().includes(q) || l.tipo.includes(q)
    );
  }, [lancamentos, searchTerm]);

  // ─── Mutations ──────────────────────────────────
  const abrirCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      const { data, error } = await supabase
        .from('caixa_diario')
        .insert({
          data: today, aberto: true, valor_abertura: valor,
          operador_abertura: profile?.nome, clinica_id: profile.clinica_id,
        })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Caixa aberto com sucesso!');
      setShowAbertura(false);
      setValorAbertura('');
      queryClient.invalidateQueries({ queryKey: ['caixa-hoje'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao abrir caixa'),
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!caixaHoje) throw new Error('Caixa não encontrado');
      const { error } = await supabase
        .from('caixa_diario')
        .update({
          aberto: false, valor_fechamento: valor,
          operador_fechamento: profile?.nome,
          observacoes: obsFechamento || null,
        })
        .eq('id', caixaHoje.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Caixa fechado com sucesso!');
      setShowFechamento(false);
      setValorFechamento('');
      setObsFechamento('');
      queryClient.invalidateQueries({ queryKey: ['caixa-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['historico-caixas'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao fechar caixa'),
  });

  const adicionarLancamentoMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id || !caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!lancamentoForm.valor || Number(lancamentoForm.valor) <= 0) throw new Error('Valor inválido');
      if (!lancamentoForm.descricao.trim()) throw new Error('Descrição obrigatória');
      const { error } = await (supabase as any).from('lancamentos').insert({
        tipo: lancamentoForm.tipo, valor: Number(lancamentoForm.valor),
        descricao: lancamentoForm.descricao, forma_pagamento: lancamentoForm.forma_pagamento,
        categoria: lancamentoForm.tipo === 'receita' ? 'receita_caixa' : 'despesa_caixa',
        data: today, clinica_id: profile.clinica_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lançamento registrado!');
      setShowLancamento(false);
      setLancamentoForm({ tipo: 'receita', valor: '', descricao: '', forma_pagamento: 'dinheiro' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro'),
  });

  const adicionarSangriaMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id || !caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!sangriaForm.valor || Number(sangriaForm.valor) <= 0) throw new Error('Valor inválido');
      if (!sangriaForm.motivo.trim()) throw new Error('Motivo obrigatório');
      const { error } = await (supabase as any).from('lancamentos').insert({
        tipo: 'sangria', valor: Number(sangriaForm.valor),
        descricao: `Sangria — ${sangriaForm.motivo}`, forma_pagamento: 'dinheiro',
        categoria: 'sangria', data: today, clinica_id: profile.clinica_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Sangria registrada!');
      setShowSangria(false);
      setSangriaForm({ valor: '', motivo: '' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro'),
  });

  const adicionarSuprimentoMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id || !caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!suprimentoForm.valor || Number(suprimentoForm.valor) <= 0) throw new Error('Valor inválido');
      const { error } = await (supabase as any).from('lancamentos').insert({
        tipo: 'suprimento', valor: Number(suprimentoForm.valor),
        descricao: suprimentoForm.descricao || 'Suprimento de Caixa', forma_pagamento: 'dinheiro',
        categoria: 'suprimento', data: today, clinica_id: profile.clinica_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Suprimento adicionado!');
      setShowSuprimento(false);
      setSuprimentoForm({ valor: '', descricao: '' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro'),
  });

  const deletarLancamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lançamento removido!');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro'),
  });

  // ─── Helpers ────────────────────────────────────
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const getTipoConfig = (tipo: LancamentoTipo) => ({
    receita: { label: 'Receita', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    despesa: { label: 'Despesa', icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
    sangria: { label: 'Sangria', icon: ArrowDownToLine, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    suprimento: { label: 'Suprimento', icon: ArrowUpFromLine, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  }[tipo]);

  const buildReceiptData = (l: Lancamento): ReceiptData => ({
    titulo: 'COMPROVANTE DE PAGAMENTO',
    dataHora: fmtTime(l.created_at),
    docId: l.id.slice(0, 8).toUpperCase(),
    paciente: 'Paciente',
    descricao: l.descricao || 'Serviço',
    formaPagamento: FORMA_LABELS[l.forma_pagamento] || l.forma_pagamento,
    valorOriginal: l.valor,
    valorFinal: l.valor,
  });

  if (!profile?.clinica_id) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (loadingCaixa) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isOpen = caixaHoje?.aberto === true;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-xl',
            isOpen ? 'bg-success/10' : 'bg-muted'
          )}>
            <DollarSign className={cn('h-6 w-6', isOpen ? 'text-success' : 'text-muted-foreground')} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Caixa Diário</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={cn(
            'gap-1.5 px-3 py-1 text-xs font-medium',
            isOpen
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-muted text-muted-foreground border-border'
          )}>
            <span className={cn('h-2 w-2 rounded-full', isOpen ? 'bg-success animate-pulse' : 'bg-muted-foreground')} />
            {isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
          </Badge>
          {isOpen && caixaHoje?.operador_abertura && (
            <span className="text-xs text-muted-foreground">por {caixaHoje.operador_abertura}</span>
          )}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="hoje" className="gap-1.5">
            <Receipt className="h-4 w-4" /> Caixa Hoje
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB HOJE ═══ */}
        <TabsContent value="hoje" className="space-y-5 mt-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!isOpen ? (
              <Button onClick={() => setShowAbertura(true)} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                <Unlock className="h-4 w-4" /> Abrir Caixa
              </Button>
            ) : (
              <>
                <Button onClick={() => setShowLancamento(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Lançamento
                </Button>
                <Button onClick={() => setShowSangria(true)} variant="outline" className="gap-2 border-warning/30 text-warning hover:bg-warning/10">
                  <ArrowDownToLine className="h-4 w-4" /> Sangria
                </Button>
                <Button onClick={() => setShowSuprimento(true)} variant="outline" className="gap-2 border-info/30 text-info hover:bg-info/10">
                  <ArrowUpFromLine className="h-4 w-4" /> Suprimento
                </Button>
                <Button onClick={() => setShowFechamento(true)} variant="destructive" className="gap-2 ml-auto">
                  <Lock className="h-4 w-4" /> Fechar Caixa
                </Button>
              </>
            )}
          </div>

          {/* KPI Cards */}
          {isOpen && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Abertura', value: caixaHoje?.valor_abertura || 0, icon: Unlock, color: 'text-muted-foreground', bgIcon: 'bg-muted' },
                { label: 'Receitas', value: totais.receita, icon: TrendingUp, color: 'text-success', bgIcon: 'bg-success/10' },
                { label: 'Despesas', value: totais.despesa, icon: TrendingDown, color: 'text-destructive', bgIcon: 'bg-destructive/10' },
                { label: 'Sangrias', value: totais.sangria, icon: ArrowDownToLine, color: 'text-warning', bgIcon: 'bg-warning/10' },
                { label: 'Saldo Final', value: totais.final, icon: DollarSign, color: totais.final >= 0 ? 'text-success' : 'text-destructive', bgIcon: 'bg-primary/10' },
              ].map((kpi, i) => (
                <motion.div key={kpi.label} custom={i} variants={cardVariant} initial="hidden" animate="visible">
                  <Card className={cn(i === 4 && 'border-primary/30 shadow-sm')}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('p-1.5 rounded-lg', kpi.bgIcon)}>
                          <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      </div>
                      <p className={cn('text-xl font-bold tabular-nums', kpi.color)}>{fmt(kpi.value)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Payment Breakdown */}
          {isOpen && totais.receita > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Receitas por Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(breakdownFormas).map(([forma, valor]) => {
                      const Icon = FORMA_ICONS[forma] || Banknote;
                      const pct = totais.receita > 0 ? ((valor / totais.receita) * 100).toFixed(0) : '0';
                      return (
                        <div key={forma} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="p-2 rounded-lg bg-background">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground capitalize">{FORMA_LABELS[forma] || forma}</p>
                            <p className="text-sm font-bold tabular-nums">{fmt(valor)}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{pct}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Lançamentos Table */}
          {isOpen && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Movimentações ({lancamentos.length})
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8 w-52 h-9 text-sm" placeholder="Buscar..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLanc ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : lancamentosFiltrados.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhuma movimentação</p>
                    <p className="text-xs mt-1">Registre receitas, despesas ou sangrias</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Descrição</TableHead>
                          <TableHead className="text-xs">Pagamento</TableHead>
                          <TableHead className="text-xs">Hora</TableHead>
                          <TableHead className="text-xs text-right">Valor</TableHead>
                          <TableHead className="text-xs w-24">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {lancamentosFiltrados.map((l) => {
                            const cfg = getTipoConfig(l.tipo);
                            const Icon = cfg.icon;
                            const FormaIcon = FORMA_ICONS[l.forma_pagamento] || Banknote;
                            return (
                              <motion.tr key={l.id}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                              >
                                <TableCell>
                                  <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium', cfg.bg, cfg.color)}>
                                    <Icon className="h-3 w-3" /> {cfg.label}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-sm">{l.descricao}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <FormaIcon className="h-3.5 w-3.5" />
                                    {FORMA_LABELS[l.forma_pagamento] || l.forma_pagamento}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {fmtTime(l.created_at)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={cn('font-bold tabular-nums text-sm', cfg.color)}>
                                    {l.tipo === 'receita' || l.tipo === 'suprimento' ? '+' : '−'}{fmt(l.valor)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-0.5">
                                    {l.tipo === 'receita' && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                          title="Imprimir" onClick={() => printReceiptPdf(buildReceiptData(l))}>
                                          <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                          title="Download" onClick={() => downloadReceiptPdf(buildReceiptData(l))}>
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => setConfirmDelete(l.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state when caixa is closed */}
          {!isOpen && !caixaHoje && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Caixa não aberto hoje</h3>
                <p className="text-sm text-muted-foreground mb-4">Abra o caixa para iniciar as movimentações do dia</p>
                <Button onClick={() => setShowAbertura(true)} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                  <Unlock className="h-4 w-4" /> Abrir Caixa Agora
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Closed caixa summary */}
          {caixaHoje && !isOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" /> Resumo do Caixa Fechado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Abertura</p><p className="font-bold">{fmt(caixaHoje.valor_abertura)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Fechamento</p><p className="font-bold">{fmt(caixaHoje.valor_fechamento || 0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Operador</p><p className="font-medium">{caixaHoje.operador_fechamento || '—'}</p></div>
                  {caixaHoje.observacoes && <div><p className="text-muted-foreground text-xs">Obs</p><p className="font-medium">{caixaHoje.observacoes}</p></div>}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB HISTÓRICO ═══ */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Últimos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historicosCaixa.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum registro de caixa</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historicosCaixa.map((cx) => (
                    <motion.div key={cx.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setShowDetalhesCaixa(cx)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', cx.aberto ? 'bg-success/10' : 'bg-muted')}>
                          {cx.aberto ? <Unlock className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{fmtDate(cx.data)}</p>
                          <p className="text-xs text-muted-foreground">
                            {cx.operador_abertura || 'Sem operador'} · Abertura: {fmt(cx.valor_abertura)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {cx.valor_fechamento !== null ? (
                            <>
                              <p className="text-sm font-bold tabular-nums">{fmt(cx.valor_fechamento)}</p>
                              <p className="text-[10px] text-muted-foreground">Fechamento</p>
                            </>
                          ) : (
                            <Badge variant={cx.aberto ? 'default' : 'secondary'} className="text-[10px]">
                              {cx.aberto ? 'Aberto' : 'Sem fechamento'}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ═══ */}

      {/* Abrir Caixa */}
      <Dialog open={showAbertura} onOpenChange={setShowAbertura}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-emerald-600" /> Abrir Caixa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor inicial em caixa (R$)</Label>
              <Input type="number" placeholder="0,00" value={valorAbertura}
                onChange={e => setValorAbertura(e.target.value)} step="0.01" min="0" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbertura(false)}>Cancelar</Button>
            <Button onClick={() => abrirCaixaMutation.mutate(parseFloat(valorAbertura) || 0)}
              disabled={abrirCaixaMutation.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {abrirCaixaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo Lançamento */}
      <Dialog open={showLancamento} onOpenChange={setShowLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Novo Lançamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={lancamentoForm.tipo} onValueChange={v => setLancamentoForm(p => ({ ...p, tipo: v as LancamentoTipo }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">💰 Receita</SelectItem>
                  <SelectItem value="despesa">💸 Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Input placeholder="Ex: Consulta Dr. Silva" value={lancamentoForm.descricao}
                onChange={e => setLancamentoForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input type="number" placeholder="0,00" value={lancamentoForm.valor}
                  onChange={e => setLancamentoForm(p => ({ ...p, valor: e.target.value }))} step="0.01" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select value={lancamentoForm.forma_pagamento} onValueChange={v => setLancamentoForm(p => ({ ...p, forma_pagamento: v as FormaPagamento }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="credito">💳 Crédito</SelectItem>
                    <SelectItem value="debito">💳 Débito</SelectItem>
                    <SelectItem value="cheque">📄 Cheque</SelectItem>
                    <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLancamento(false)}>Cancelar</Button>
            <Button onClick={() => adicionarLancamentoMutation.mutate()} disabled={adicionarLancamentoMutation.isPending} className="gap-2">
              {adicionarLancamentoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sangria */}
      <Dialog open={showSangria} onOpenChange={setShowSangria}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-amber-600" /> Registrar Sangria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$) *</Label>
              <Input type="number" placeholder="0,00" value={sangriaForm.valor}
                onChange={e => setSangriaForm(p => ({ ...p, valor: e.target.value }))} step="0.01" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo *</Label>
              <Input placeholder="Motivo da retirada" value={sangriaForm.motivo}
                onChange={e => setSangriaForm(p => ({ ...p, motivo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSangria(false)}>Cancelar</Button>
            <Button onClick={() => adicionarSangriaMutation.mutate()} disabled={adicionarSangriaMutation.isPending}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              {adicionarSangriaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar Sangria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suprimento */}
      <Dialog open={showSuprimento} onOpenChange={setShowSuprimento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-blue-600" /> Registrar Suprimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$) *</Label>
              <Input type="number" placeholder="0,00" value={suprimentoForm.valor}
                onChange={e => setSuprimentoForm(p => ({ ...p, valor: e.target.value }))} step="0.01" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input placeholder="Descrição do suprimento" value={suprimentoForm.descricao}
                onChange={e => setSuprimentoForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuprimento(false)}>Cancelar</Button>
            <Button onClick={() => adicionarSuprimentoMutation.mutate()} disabled={adicionarSuprimentoMutation.isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {adicionarSuprimentoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar Suprimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa */}
      <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" /> Fechar Caixa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Abertura', value: caixaHoje?.valor_abertura || 0, color: 'text-foreground' },
                { label: 'Receitas', value: totais.receita, color: 'text-emerald-600', prefix: '+' },
                { label: 'Despesas', value: totais.despesa, color: 'text-red-500', prefix: '−' },
                { label: 'Sangrias', value: totais.sangria, color: 'text-amber-600', prefix: '−' },
                { label: 'Suprimentos', value: totais.suprimento, color: 'text-blue-600', prefix: '+' },
                { label: 'Saldo Teórico', value: totais.final, color: totais.final >= 0 ? 'text-emerald-600' : 'text-red-500' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn('text-lg font-bold tabular-nums', item.color)}>
                    {item.prefix || ''}{fmt(item.value)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valor contado no caixa (R$)</Label>
                <Input type="number" placeholder="Digite o valor contado" value={valorFechamento}
                  onChange={e => setValorFechamento(e.target.value)} step="0.01" min="0" autoFocus />
              </div>
              {valorFechamento && (
                <div className={cn(
                  'p-3 rounded-lg border',
                  parseFloat(valorFechamento) === totais.final
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                )}>
                  <p className="text-xs text-muted-foreground">Diferença</p>
                  <p className={cn('text-xl font-bold tabular-nums',
                    parseFloat(valorFechamento) === totais.final ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {fmt(parseFloat(valorFechamento) - totais.final)}
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Observações (opcional)</Label>
                <Textarea placeholder="Anotações sobre o fechamento..." value={obsFechamento}
                  onChange={e => setObsFechamento(e.target.value)} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFechamento(false)}>Cancelar</Button>
            <Button onClick={() => fecharCaixaMutation.mutate(parseFloat(valorFechamento) || 0)}
              disabled={fecharCaixaMutation.isPending} variant="destructive" className="gap-2">
              {fecharCaixaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhes de Caixa Anterior */}
      <Dialog open={!!showDetalhesCaixa} onOpenChange={() => setShowDetalhesCaixa(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Caixa — {showDetalhesCaixa ? fmtDate(showDetalhesCaixa.data) : ''}
            </DialogTitle>
          </DialogHeader>
          {showDetalhesCaixa && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Abertura</p>
                  <p className="font-bold">{fmt(showDetalhesCaixa.valor_abertura)}</p>
                  <p className="text-[10px] text-muted-foreground">{showDetalhesCaixa.operador_abertura || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fechamento</p>
                  <p className="font-bold">{fmt(showDetalhesCaixa.valor_fechamento || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{showDetalhesCaixa.operador_fechamento || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={showDetalhesCaixa.aberto ? 'default' : 'secondary'} className="mt-1">
                    {showDetalhesCaixa.aberto ? 'Aberto' : 'Fechado'}
                  </Badge>
                </div>
                {showDetalhesCaixa.observacoes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Obs</p>
                    <p className="text-xs">{showDetalhesCaixa.observacoes}</p>
                  </div>
                )}
              </div>

              <Separator />
              <p className="text-sm font-semibold">Movimentações ({lancamentosDetalhe.length})</p>

              {lancamentosDetalhe.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma movimentação neste caixa</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {lancamentosDetalhe.map(l => {
                    const cfg = getTipoConfig(l.tipo);
                    return (
                      <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('px-2 py-0.5 rounded text-[10px] font-medium', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </div>
                          <span className="text-foreground">{l.descricao}</span>
                        </div>
                        <span className={cn('font-bold tabular-nums', cfg.color)}>
                          {l.tipo === 'receita' || l.tipo === 'suprimento' ? '+' : '−'}{fmt(l.valor)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deletarLancamentoMutation.mutate(confirmDelete)}
              className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
