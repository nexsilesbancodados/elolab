import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Banknote, CreditCard, QrCode, Landmark, DollarSign,
  CheckCircle2, Clock, Search, User, Receipt,
  CircleDollarSign, TrendingUp, Loader2,
  ChevronLeft, ChevronRight, AlertCircle,
  Lock, LockOpen, Undo2, Printer, Eye,
  CalendarDays, ArrowRight, XCircle,
} from 'lucide-react';

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-success' },
  { value: 'pix', label: 'PIX', icon: QrCode, color: 'text-blue-500' },
  { value: 'credito', label: 'Crédito', icon: CreditCard, color: 'text-primary' },
  { value: 'debito', label: 'Débito', icon: CreditCard, color: 'text-orange-500' },
  { value: 'transferencia', label: 'Transferência', icon: Landmark, color: 'text-muted-foreground' },
];

interface BaixaForm {
  forma_pagamento: string;
  desconto: number;
  acrescimo: number;
  observacoes: string;
}

export default function CaixaDiario() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null);
  const [showBaixa, setShowBaixa] = useState(false);
  const [showEstorno, setShowEstorno] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tabFilter, setTabFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [caixaAberto, setCaixaAberto] = useState(true);
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [baixaForm, setBaixaForm] = useState<BaixaForm>({
    forma_pagamento: 'dinheiro',
    desconto: 0,
    acrescimo: 0,
    observacoes: '',
  });

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['caixa-diario', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('tipo', 'receita')
        .eq('data', selectedDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-caixa'],
    queryFn: async () => {
      const { data } = await supabase.from('pacientes').select('id, nome, telefone, cpf');
      return data || [];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('caixa-lancamentos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getPaciente = useCallback((id: string | null) => {
    if (!id) return { nome: 'Particular', telefone: '', cpf: '' };
    return pacientes.find((p: any) => p.id === id) || { nome: 'Paciente', telefone: '', cpf: '' };
  }, [pacientes]);

  const stats = useMemo(() => {
    const pendentes = lancamentos.filter((l: any) => l.status === 'pendente');
    const pagos = lancamentos.filter((l: any) => l.status === 'pago');
    const cancelados = lancamentos.filter((l: any) => l.status === 'cancelado');
    const totalPendente = pendentes.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    const totalRecebido = pagos.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);

    const porForma: Record<string, { total: number; count: number }> = {};
    pagos.forEach((l: any) => {
      const fp = l.forma_pagamento || 'outros';
      if (!porForma[fp]) porForma[fp] = { total: 0, count: 0 };
      porForma[fp].total += Number(l.valor || 0);
      porForma[fp].count += 1;
    });

    return {
      totalLancamentos: lancamentos.length,
      pendentes: pendentes.length,
      pagos: pagos.length,
      cancelados: cancelados.length,
      totalPendente,
      totalRecebido,
      totalDia: totalPendente + totalRecebido,
      porForma,
      ticketMedio: pagos.length > 0 ? totalRecebido / pagos.length : 0,
    };
  }, [lancamentos]);

  const filtered = useMemo(() => {
    return lancamentos.filter((l: any) => {
      const matchSearch = !search ||
        getPaciente(l.paciente_id).nome.toLowerCase().includes(search.toLowerCase()) ||
        (l.descricao || '').toLowerCase().includes(search.toLowerCase());
      const matchTab = tabFilter === 'todos' || l.status === tabFilter;
      return matchSearch && matchTab;
    });
  }, [lancamentos, search, getPaciente, tabFilter]);

  const pendentes = filtered.filter((l: any) => l.status === 'pendente');
  const pagos = filtered.filter((l: any) => l.status === 'pago');

  const openBaixa = (lancamento: any) => {
    if (!caixaAberto) {
      toast.error('Caixa fechado! Abra o caixa para receber pagamentos.');
      return;
    }
    setSelectedLancamento(lancamento);
    setBaixaForm({ forma_pagamento: 'dinheiro', desconto: 0, acrescimo: 0, observacoes: '' });
    setShowBaixa(true);
  };

  const openEstorno = (lancamento: any) => {
    setSelectedLancamento(lancamento);
    setMotivoEstorno('');
    setShowEstorno(true);
  };

  const openDetalhes = (lancamento: any) => {
    setSelectedLancamento(lancamento);
    setShowDetalhes(true);
  };

  const valorFinal = useMemo(() => {
    if (!selectedLancamento) return 0;
    return Math.max(0, Number(selectedLancamento.valor || 0) - baixaForm.desconto + baixaForm.acrescimo);
  }, [selectedLancamento, baixaForm.desconto, baixaForm.acrescimo]);

  const handleConfirmarBaixa = async () => {
    if (!selectedLancamento) return;
    setIsProcessing(true);
    try {
      const now = new Date();
      const { error } = await supabase
        .from('lancamentos')
        .update({
          status: 'pago' as any,
          forma_pagamento: baixaForm.forma_pagamento,
          observacoes: [
            selectedLancamento.observacoes,
            baixaForm.observacoes,
            baixaForm.desconto > 0 ? `Desconto: R$ ${baixaForm.desconto.toFixed(2)}` : null,
            baixaForm.acrescimo > 0 ? `Acréscimo: R$ ${baixaForm.acrescimo.toFixed(2)}` : null,
            `Recebido por: ${profile?.nome || 'Sistema'} em ${format(now, "dd/MM/yyyy 'às' HH:mm")}`,
          ].filter(Boolean).join(' | '),
        })
        .eq('id', selectedLancamento.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      const pac = getPaciente(selectedLancamento.paciente_id);
      toast.success(`Pagamento confirmado — ${pac.nome}`, {
        description: `${FORMAS_PAGAMENTO.find(f => f.value === baixaForm.forma_pagamento)?.label} • R$ ${valorFinal.toFixed(2)}`,
      });
      setShowBaixa(false);
      setSelectedLancamento(null);
    } catch (err: any) {
      toast.error('Erro ao confirmar: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEstorno = async () => {
    if (!selectedLancamento || !motivoEstorno.trim()) {
      toast.error('Informe o motivo do estorno.');
      return;
    }
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({
          status: 'pendente' as any,
          forma_pagamento: null,
          observacoes: [
            selectedLancamento.observacoes,
            `⚠️ ESTORNO em ${format(new Date(), "dd/MM/yyyy HH:mm")} por ${profile?.nome || 'Sistema'}: ${motivoEstorno}`,
          ].filter(Boolean).join(' | '),
        })
        .eq('id', selectedLancamento.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      toast.warning('Pagamento estornado — voltou para pendente.');
      setShowEstorno(false);
      setSelectedLancamento(null);
    } catch (err: any) {
      toast.error('Erro no estorno: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprimirRecibo = (l: any) => {
    const pac = getPaciente(l.paciente_id);
    const fp = FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento);
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Recibo</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 350px; margin: 20px auto; font-size: 13px; color: #333; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
        .header h2 { margin: 0; font-size: 18px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .row.total { border-top: 2px solid #333; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="header">
        <h2>RECIBO DE PAGAMENTO</h2>
        <p>${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
      </div>
      <div class="row"><span>Paciente:</span><strong>${pac.nome}</strong></div>
      ${pac.cpf ? `<div class="row"><span>CPF:</span><span>${pac.cpf}</span></div>` : ''}
      <div class="row"><span>Descrição:</span><span>${l.descricao || '—'}</span></div>
      <div class="row"><span>Categoria:</span><span>${l.categoria || '—'}</span></div>
      <div class="row"><span>Forma Pgto:</span><span>${fp?.label || l.forma_pagamento || '—'}</span></div>
      <div class="row total"><span>VALOR PAGO:</span><span>R$ ${Number(l.valor || 0).toFixed(2)}</span></div>
      <div class="footer">
        <p>Recebido por: ${profile?.nome || 'Sistema'}</p>
        <p>Documento sem valor fiscal</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>`);
    w.document.close();
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const navigateDate = (dir: number) => {
    const d = dir > 0
      ? addDays(new Date(selectedDate + 'T12:00:00'), 1)
      : subDays(new Date(selectedDate + 'T12:00:00'), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <CircleDollarSign className="h-7 w-7 text-primary" /> Caixa Diário
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Balcão de recebimentos — consultas finalizadas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Caixa toggle */}
          <Button
            variant={caixaAberto ? 'default' : 'destructive'}
            size="sm"
            className="gap-2 font-bold"
            onClick={() => {
              if (caixaAberto && stats.pendentes > 0) {
                setShowFechamento(true);
                return;
              }
              setCaixaAberto(!caixaAberto);
              toast.info(caixaAberto ? '🔒 Caixa fechado' : '🔓 Caixa aberto');
            }}
          >
            {caixaAberto ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
          </Button>

          {/* Date nav */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[140px] h-8 text-sm border-0 bg-transparent text-center"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isToday && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
              <CalendarDays className="h-3 w-3" /> Hoje
            </Button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={caixaAberto ? 'default' : 'destructive'} className="text-xs gap-1">
          {caixaAberto ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {caixaAberto ? 'Aberto' : 'Fechado'}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {isToday ? '📅 Hoje' : format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
        </Badge>
        {stats.pendentes > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs animate-pulse gap-1">
            <AlertCircle className="h-3 w-3" /> {stats.pendentes} pendente(s)
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Faturamento', value: stats.totalDia, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'A Receber', value: stats.totalPendente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', badge: stats.pendentes },
          { label: 'Recebido', value: stats.totalRecebido, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', badge: stats.pagos },
          { label: 'Ticket Médio', value: stats.ticketMedio, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Taxa Receb.', value: -1, icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={cn('border', s.border)}>
              <CardContent className="py-3.5 px-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{s.label}</p>
                    {s.value === -1 ? (
                      <p className={cn('text-xl font-black mt-0.5 tabular-nums', s.color)}>
                        {stats.totalLancamentos > 0 ? `${Math.round((stats.pagos / stats.totalLancamentos) * 100)}%` : '—'}
                      </p>
                    ) : (
                      <p className={cn('text-xl font-black mt-0.5 tabular-nums', s.color)}>
                        R$ {s.value.toFixed(2)}
                      </p>
                    )}
                    {s.badge !== undefined && s.badge > 0 && (
                      <p className="text-[10px] text-muted-foreground">{s.badge} item(s)</p>
                    )}
                  </div>
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                    <s.icon className={cn('h-4 w-4', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment breakdown */}
      {Object.keys(stats.porForma).length > 0 && (
        <Card className="border-success/10">
          <CardContent className="py-3 px-5">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Por forma:</span>
              {Object.entries(stats.porForma).map(([forma, { total, count }]) => {
                const fp = FORMAS_PAGAMENTO.find(f => f.value === forma);
                const Icon = fp?.icon || DollarSign;
                return (
                  <div key={forma} className="flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5', fp?.color || 'text-muted-foreground')} />
                    <span className="text-xs">{fp?.label || forma}</span>
                    <span className="text-xs font-bold tabular-nums">R$ {total.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground">({count})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Tabs value={tabFilter} onValueChange={(v) => setTabFilter(v as any)} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="todos" className="text-xs px-3">Todos ({lancamentos.length})</TabsTrigger>
            <TabsTrigger value="pendente" className="text-xs px-3 gap-1">
              <Clock className="h-3 w-3" /> Pendentes ({lancamentos.filter((l: any) => l.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="pago" className="text-xs px-3 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Recebidos ({lancamentos.filter((l: any) => l.status === 'pago').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pending */}
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-1.5 mb-2.5 px-1">
                <Clock className="h-3.5 w-3.5" /> Aguardando Pagamento
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {pendentes.map((l: any, i: number) => {
                    const pac = getPaciente(l.paciente_id);
                    return (
                      <motion.div
                        key={l.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="border-warning/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer"
                          onClick={() => openDetalhes(l)}
                        >
                          <CardContent className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="h-11 w-11 rounded-full bg-warning/10 flex items-center justify-center ring-2 ring-warning/20">
                                  <User className="h-5 w-5 text-warning" />
                                </div>
                                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-warning animate-pulse border-2 border-card" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{pac.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">{l.descricao}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {l.created_at && (
                                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {format(new Date(l.created_at), 'HH:mm')}
                                    </span>
                                  )}
                                  {l.categoria && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{l.categoria}</Badge>}
                                </div>
                              </div>
                              <p className="text-xl font-black tabular-nums shrink-0">
                                R$ {Number(l.valor || 0).toFixed(2)}
                              </p>
                              <Button
                                onClick={(e) => { e.stopPropagation(); openBaixa(l); }}
                                className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 font-bold text-sm px-5 shrink-0"
                              >
                                <Banknote className="h-4 w-4" /> Receber
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Paid */}
          {pagos.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5 mb-2.5 px-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recebidos
              </h2>
              <div className="space-y-1.5">
                {pagos.map((l: any) => {
                  const pac = getPaciente(l.paciente_id);
                  const fp = FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento);
                  const FpIcon = fp?.icon || DollarSign;
                  return (
                    <Card key={l.id} className="border-success/10 bg-success/[0.02] group cursor-pointer hover:bg-success/[0.04] transition-colors"
                      onClick={() => openDetalhes(l)}
                    >
                      <CardContent className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pac.nome}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{l.descricao}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FpIcon className={cn('h-3.5 w-3.5', fp?.color)} />
                              <span className="text-[11px]">{fp?.label || l.forma_pagamento || '—'}</span>
                            </div>
                            <p className="text-sm font-bold text-success tabular-nums">R$ {Number(l.valor || 0).toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); handleImprimirRecibo(l); }}
                              title="Imprimir recibo"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={(e) => { e.stopPropagation(); openEstorno(l); }}
                              title="Estornar"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty */}
          {pendentes.length === 0 && pagos.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <Receipt className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="font-bold text-base">Caixa vazio</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {search
                      ? 'Nenhum resultado para esta busca.'
                      : 'As cobranças aparecerão automaticamente ao finalizar consultas.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ===== Dialog: Receber ===== */}
      <Dialog open={showBaixa} onOpenChange={setShowBaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Banknote className="h-5 w-5" /> Confirmar Recebimento
            </DialogTitle>
            <DialogDescription>Registre o pagamento do paciente no caixa.</DialogDescription>
          </DialogHeader>
          {selectedLancamento && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{getPaciente(selectedLancamento.paciente_id).nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedLancamento.descricao}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <span className="text-lg font-black tabular-nums">R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAS_PAGAMENTO.map(fp => (
                    <button
                      key={fp.value}
                      type="button"
                      onClick={() => setBaixaForm(p => ({ ...p, forma_pagamento: fp.value }))}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                        baixaForm.forma_pagamento === fp.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50',
                      )}
                    >
                      <fp.icon className={cn('h-5 w-5', baixaForm.forma_pagamento === fp.value ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-[11px] font-medium', baixaForm.forma_pagamento === fp.value ? 'text-primary' : 'text-muted-foreground')}>
                        {fp.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Desconto (R$)</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={baixaForm.desconto || ''}
                    onChange={(e) => setBaixaForm(p => ({ ...p, desconto: Number(e.target.value) || 0 }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Acréscimo (R$)</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={baixaForm.acrescimo || ''}
                    onChange={(e) => setBaixaForm(p => ({ ...p, acrescimo: Number(e.target.value) || 0 }))}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  placeholder="Observações opcionais..."
                  value={baixaForm.observacoes}
                  onChange={(e) => setBaixaForm(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="rounded-xl bg-success/5 border border-success/20 p-4 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-success">Total</span>
                <span className="text-3xl font-black text-success tabular-nums">R$ {valorFinal.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBaixa(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarBaixa}
              disabled={isProcessing}
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/25"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Estorno ===== */}
      <Dialog open={showEstorno} onOpenChange={setShowEstorno}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Undo2 className="h-5 w-5" /> Estornar Pagamento
            </DialogTitle>
            <DialogDescription>O lançamento voltará para pendente.</DialogDescription>
          </DialogHeader>
          {selectedLancamento && (
            <div className="space-y-4">
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm">
                <p><strong>{getPaciente(selectedLancamento.paciente_id).nome}</strong></p>
                <p className="text-muted-foreground text-xs">{selectedLancamento.descricao} — R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motivo do estorno *</Label>
                <Textarea
                  placeholder="Informe o motivo..."
                  value={motivoEstorno}
                  onChange={(e) => setMotivoEstorno(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEstorno(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleEstorno}
              disabled={isProcessing || !motivoEstorno.trim()}
              className="gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Detalhes ===== */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Detalhes do Lançamento
            </DialogTitle>
            <DialogDescription>Informações completas do lançamento.</DialogDescription>
          </DialogHeader>
          {selectedLancamento && (() => {
            const pac = getPaciente(selectedLancamento.paciente_id);
            const fp = FORMAS_PAGAMENTO.find(f => f.value === selectedLancamento.forma_pagamento);
            return (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <span className="text-muted-foreground">Paciente</span>
                  <span className="font-medium">{pac.nome}</span>
                  {pac.cpf && <><span className="text-muted-foreground">CPF</span><span>{pac.cpf}</span></>}
                  {pac.telefone && <><span className="text-muted-foreground">Telefone</span><span>{pac.telefone}</span></>}
                  <span className="text-muted-foreground">Descrição</span>
                  <span>{selectedLancamento.descricao || '—'}</span>
                  <span className="text-muted-foreground">Categoria</span>
                  <span>{selectedLancamento.categoria || '—'}</span>
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold">R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</span>
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selectedLancamento.status === 'pago' ? 'default' : 'secondary'} className="w-fit">
                    {selectedLancamento.status === 'pago' ? 'Recebido' : 'Pendente'}
                  </Badge>
                  {fp && <><span className="text-muted-foreground">Forma Pgto</span><span className="flex items-center gap-1"><fp.icon className={cn('h-3.5 w-3.5', fp.color)} /> {fp.label}</span></>}
                  {selectedLancamento.created_at && (
                    <><span className="text-muted-foreground">Criado em</span><span>{format(new Date(selectedLancamento.created_at), "dd/MM/yyyy 'às' HH:mm")}</span></>
                  )}
                </div>
                {selectedLancamento.observacoes && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {selectedLancamento.observacoes}
                  </div>
                )}
                {selectedLancamento.status === 'pago' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { handleImprimirRecibo(selectedLancamento); }}>
                      <Printer className="h-3.5 w-3.5" /> Imprimir Recibo
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { setShowDetalhes(false); openEstorno(selectedLancamento); }}>
                      <Undo2 className="h-3.5 w-3.5" /> Estornar
                    </Button>
                  </div>
                )}
                {selectedLancamento.status === 'pendente' && (
                  <Button className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold" onClick={() => { setShowDetalhes(false); openBaixa(selectedLancamento); }}>
                    <Banknote className="h-4 w-4" /> Receber Pagamento
                  </Button>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Fechamento ===== */}
      <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" /> Fechar Caixa
            </DialogTitle>
            <DialogDescription>Ainda há {stats.pendentes} pagamento(s) pendente(s).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Deseja fechar o caixa mesmo com pagamentos pendentes?</p>
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
              <div className="flex justify-between"><span>Total pendente:</span><span className="font-bold text-warning">R$ {stats.totalPendente.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Total recebido:</span><span className="font-bold text-success">R$ {stats.totalRecebido.toFixed(2)}</span></div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFechamento(false)}>Voltar</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                setCaixaAberto(false);
                setShowFechamento(false);
                toast.info('🔒 Caixa fechado com pendências.');
              }}
            >
              <Lock className="h-4 w-4" /> Fechar Mesmo Assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
