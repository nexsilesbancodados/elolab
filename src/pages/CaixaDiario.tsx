import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Banknote, CreditCard, QrCode, Landmark, DollarSign,
  CheckCircle2, Clock, Search, User, Receipt,
  CircleDollarSign, TrendingUp, Loader2,
  ChevronLeft, ChevronRight, Printer, AlertCircle,
  ArrowUpDown, Filter,
} from 'lucide-react';

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-success' },
  { value: 'pix', label: 'PIX', icon: QrCode, color: 'text-info' },
  { value: 'credito', label: 'Cartão Crédito', icon: CreditCard, color: 'text-primary' },
  { value: 'debito', label: 'Cartão Débito', icon: CreditCard, color: 'text-accent-foreground' },
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [tabFilter, setTabFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [baixaForm, setBaixaForm] = useState<BaixaForm>({
    forma_pagamento: 'dinheiro',
    desconto: 0,
    acrescimo: 0,
    observacoes: '',
  });

  // Auto-refresh every 15s for real-time feel
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
      const { data } = await supabase.from('pacientes').select('id, nome, telefone');
      return data || [];
    },
    staleTime: 60000,
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('caixa-lancamentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getPacienteNome = (id: string | null) => {
    if (!id) return 'Particular';
    return pacientes.find((p: any) => p.id === id)?.nome || 'Paciente';
  };

  // Stats
  const stats = useMemo(() => {
    const pendentes = lancamentos.filter((l: any) => l.status === 'pendente');
    const pagos = lancamentos.filter((l: any) => l.status === 'pago');
    const totalPendente = pendentes.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    const totalRecebido = pagos.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);

    // Payment method breakdown
    const porForma: Record<string, number> = {};
    pagos.forEach((l: any) => {
      const fp = l.forma_pagamento || 'outros';
      porForma[fp] = (porForma[fp] || 0) + Number(l.valor || 0);
    });

    return {
      totalLancamentos: lancamentos.length,
      pendentes: pendentes.length,
      pagos: pagos.length,
      totalPendente,
      totalRecebido,
      totalDia: totalPendente + totalRecebido,
      porForma,
    };
  }, [lancamentos]);

  // Filtered & sorted list
  const filtered = useMemo(() => {
    return lancamentos.filter((l: any) => {
      const matchSearch = !search ||
        getPacienteNome(l.paciente_id).toLowerCase().includes(search.toLowerCase()) ||
        (l.descricao || '').toLowerCase().includes(search.toLowerCase());
      const matchTab = tabFilter === 'todos' || l.status === tabFilter;
      return matchSearch && matchTab;
    });
  }, [lancamentos, search, pacientes, tabFilter]);

  const pendentes = filtered.filter((l: any) => l.status === 'pendente');
  const pagos = filtered.filter((l: any) => l.status === 'pago');

  const openBaixa = (lancamento: any) => {
    setSelectedLancamento(lancamento);
    setBaixaForm({ forma_pagamento: 'dinheiro', desconto: 0, acrescimo: 0, observacoes: '' });
    setShowBaixa(true);
  };

  const valorFinal = useMemo(() => {
    if (!selectedLancamento) return 0;
    return Math.max(0, Number(selectedLancamento.valor || 0) - baixaForm.desconto + baixaForm.acrescimo);
  }, [selectedLancamento, baixaForm.desconto, baixaForm.acrescimo]);

  const handleConfirmarBaixa = async () => {
    if (!selectedLancamento) return;
    setIsProcessing(true);
    try {
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
            `Recebido por: ${profile?.nome || 'Sistema'} às ${format(new Date(), 'HH:mm')}`,
          ].filter(Boolean).join(' | '),
        })
        .eq('id', selectedLancamento.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success(`✅ Pagamento confirmado — ${getPacienteNome(selectedLancamento.paciente_id)}`, {
        description: `${FORMAS_PAGAMENTO.find(f => f.value === baixaForm.forma_pagamento)?.label} • R$ ${valorFinal.toFixed(2)}`,
      });
      setShowBaixa(false);
      setSelectedLancamento(null);
    } catch (err: any) {
      toast.error('Erro ao confirmar pagamento: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const navigateDate = (dir: number) => {
    const d = dir > 0 ? addDays(new Date(selectedDate + 'T12:00:00'), 1) : subDays(new Date(selectedDate + 'T12:00:00'), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <CircleDollarSign className="h-7 w-7 text-primary" /> Caixa Diário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Balcão de recebimentos — consultas finalizadas
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[150px] h-8 text-sm"
            />
            {!isToday && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
                Hoje
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date label */}
      <div className="flex items-center gap-2">
        <Badge variant={isToday ? 'default' : 'secondary'} className="text-xs px-3 py-1">
          {isToday ? '📅 Hoje' : format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Badge>
        {stats.pendentes > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs animate-pulse">
            <AlertCircle className="h-3 w-3 mr-1" /> {stats.pendentes} pendente(s)
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Faturamento do Dia', value: stats.totalDia, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'A Receber', value: stats.totalPendente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', count: stats.pendentes },
          { label: 'Recebido', value: stats.totalRecebido, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', count: stats.pagos },
          { label: 'Taxa Recebimento', value: -1, icon: TrendingUp, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('border', s.border)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                    {s.value === -1 ? (
                      <p className={cn('text-2xl font-bold mt-1 tabular-nums', s.color)}>
                        {stats.totalLancamentos > 0 ? `${Math.round((stats.pagos / stats.totalLancamentos) * 100)}%` : '—'}
                      </p>
                    ) : (
                      <p className={cn('text-2xl font-bold mt-1 tabular-nums', s.color)}>
                        R$ {s.value.toFixed(2)}
                      </p>
                    )}
                    {s.count !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.count} lançamento(s)</p>
                    )}
                  </div>
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.bg)}>
                    <s.icon className={cn('h-5 w-5', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment method breakdown (only when there are payments) */}
      {Object.keys(stats.porForma).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="py-3 px-5">
              <div className="flex items-center gap-6 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recebido por:</span>
                {Object.entries(stats.porForma).map(([forma, valor]) => {
                  const fp = FORMAS_PAGAMENTO.find(f => f.value === forma);
                  const Icon = fp?.icon || DollarSign;
                  return (
                    <div key={forma} className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', fp?.color || 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{fp?.label || forma}</span>
                      <span className="text-sm font-bold tabular-nums">R$ {valor.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Tabs value={tabFilter} onValueChange={(v) => setTabFilter(v as any)} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="todos" className="text-xs px-3">Todos ({lancamentos.length})</TabsTrigger>
            <TabsTrigger value="pendente" className="text-xs px-3">
              <Clock className="h-3 w-3 mr-1" /> Pendentes ({lancamentos.filter((l: any) => l.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="pago" className="text-xs px-3">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Recebidos ({lancamentos.filter((l: any) => l.status === 'pago').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="py-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pending */}
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-2 mb-3 px-1">
                <Clock className="h-3.5 w-3.5" /> Aguardando Pagamento
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {pendentes.map((l: any, i: number) => (
                    <motion.div
                      key={l.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="border-warning/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                        <CardContent className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0 ring-2 ring-warning/20">
                                <User className="h-6 w-6 text-warning" />
                              </div>
                              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning animate-pulse border-2 border-card" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{getPacienteNome(l.paciente_id)}</p>
                              <p className="text-xs text-muted-foreground truncate">{l.descricao}</p>
                              <div className="flex items-center gap-3 mt-1">
                                {l.created_at && (
                                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(new Date(l.created_at), 'HH:mm')}
                                  </span>
                                )}
                                {l.categoria && (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{l.categoria}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 mr-2">
                              <p className="text-xl font-black text-foreground tabular-nums">
                                R$ {Number(l.valor || 0).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              onClick={() => openBaixa(l)}
                              size="lg"
                              className="gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/25 font-bold text-sm px-6"
                            >
                              <Banknote className="h-5 w-5" /> Receber
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Paid */}
          {pagos.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-2 mb-3 px-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recebidos
              </h2>
              <div className="space-y-1.5">
                {pagos.map((l: any) => {
                  const fp = FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento);
                  const FpIcon = fp?.icon || DollarSign;
                  return (
                    <Card key={l.id} className="border-success/10 bg-success/[0.02]">
                      <CardContent className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{getPacienteNome(l.paciente_id)}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{l.descricao}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <FpIcon className={cn('h-3.5 w-3.5', fp?.color)} />
                              <span className="text-[11px]">{fp?.label || l.forma_pagamento || '—'}</span>
                            </div>
                            <p className="text-sm font-bold text-success tabular-nums">
                              R$ {Number(l.valor || 0).toFixed(2)}
                            </p>
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
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="font-bold text-lg">Caixa vazio</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {search ? 'Nenhum resultado para esta busca.' :
                      'As cobranças aparecerão aqui automaticamente ao finalizar consultas na Agenda ou Fila de Atendimento.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Dialog Receber */}
      <Dialog open={showBaixa} onOpenChange={setShowBaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Banknote className="h-5 w-5" /> Confirmar Recebimento
            </DialogTitle>
          </DialogHeader>
          {selectedLancamento && (
            <div className="space-y-4">
              {/* Patient info */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{getPacienteNome(selectedLancamento.paciente_id)}</p>
                    <p className="text-xs text-muted-foreground">{selectedLancamento.descricao}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor da Consulta</span>
                  <span className="text-lg font-black tabular-nums">R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment method - grid with visual buttons */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAS_PAGAMENTO.map(fp => (
                    <button
                      key={fp.value}
                      type="button"
                      onClick={() => setBaixaForm(p => ({ ...p, forma_pagamento: fp.value }))}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
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

              {/* Discount / surcharge */}
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

              {/* Notes */}
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

              <Separator />

              {/* Final value - prominent */}
              <div className="rounded-xl bg-success/5 border border-success/20 p-4 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-success">Valor a Cobrar</span>
                <span className="text-3xl font-black text-success tabular-nums">
                  R$ {valorFinal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBaixa(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarBaixa}
              disabled={isProcessing}
              size="lg"
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/25"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
