import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
  CheckCircle2, Clock, Search, User, Stethoscope,
  Receipt, CircleDollarSign, ArrowDownCircle, TrendingUp,
  Loader2, Calendar,
} from 'lucide-react';

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'credito', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'debito', label: 'Cartão Débito', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Landmark },
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
  const [baixaForm, setBaixaForm] = useState<BaixaForm>({
    forma_pagamento: 'dinheiro',
    desconto: 0,
    acrescimo: 0,
    observacoes: '',
  });

  // Fetch lancamentos for the selected date (from auto_billing trigger)
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
  });

  // Fetch pacientes for names
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-caixa'],
    queryFn: async () => {
      const { data } = await supabase.from('pacientes').select('id, nome');
      return data || [];
    },
    staleTime: 60000,
  });

  const getPacienteNome = (id: string | null) => {
    if (!id) return 'Não informado';
    return pacientes.find((p: any) => p.id === id)?.nome || 'Paciente';
  };

  // Stats
  const stats = useMemo(() => {
    const pendentes = lancamentos.filter((l: any) => l.status === 'pendente');
    const pagos = lancamentos.filter((l: any) => l.status === 'pago');
    const totalPendente = pendentes.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    const totalRecebido = pagos.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    return {
      totalLancamentos: lancamentos.length,
      pendentes: pendentes.length,
      pagos: pagos.length,
      totalPendente,
      totalRecebido,
    };
  }, [lancamentos]);

  // Filtered list
  const filtered = useMemo(() => {
    return lancamentos.filter((l: any) => {
      if (!search) return true;
      const nome = getPacienteNome(l.paciente_id).toLowerCase();
      const desc = (l.descricao || '').toLowerCase();
      return nome.includes(search.toLowerCase()) || desc.includes(search.toLowerCase());
    });
  }, [lancamentos, search, pacientes]);

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
            `Recebido por: ${profile?.nome || 'Sistema'}`,
          ].filter(Boolean).join(' | '),
        })
        .eq('id', selectedLancamento.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['caixa-diario'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success(`Pagamento confirmado — ${getPacienteNome(selectedLancamento.paciente_id)}`);
      setShowBaixa(false);
      setSelectedLancamento(null);
    } catch (err: any) {
      toast.error('Erro ao confirmar pagamento: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-primary" /> Caixa Diário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recebimentos de consultas finalizadas —{' '}
            {isToday ? 'Hoje' : format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[160px]"
          />
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
              Hoje
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total do Dia', value: `R$ ${(stats.totalPendente + stats.totalRecebido).toFixed(2)}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'A Receber', value: `R$ ${stats.totalPendente.toFixed(2)}`, sub: `${stats.pendentes} consulta(s)`, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Recebido', value: `R$ ${stats.totalRecebido.toFixed(2)}`, sub: `${stats.pagos} consulta(s)`, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Taxa Recebimento', value: stats.totalLancamentos > 0 ? `${Math.round((stats.pagos / stats.totalLancamentos) * 100)}%` : '—', icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                  <s.icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <p className={cn('text-lg font-bold tabular-nums', s.color)}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="py-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending payments */}
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-warning flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" /> Aguardando Pagamento ({pendentes.length})
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {pendentes.map((l: any) => (
                    <motion.div key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Card className="border-warning/30 hover:shadow-md transition-all">
                        <CardContent className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{getPacienteNome(l.paciente_id)}</p>
                              <p className="text-xs text-muted-foreground">{l.descricao}</p>
                              {l.created_at && (
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                  {format(new Date(l.created_at), 'HH:mm', { locale: ptBR })}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-foreground tabular-nums">
                                R$ {Number(l.valor || 0).toFixed(2)}
                              </p>
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">
                                Pendente
                              </Badge>
                            </div>
                            <Button
                              onClick={() => openBaixa(l)}
                              className="gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20"
                            >
                              <Banknote className="h-4 w-4" /> Receber
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
              <h2 className="text-sm font-semibold text-success flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" /> Recebidos ({pagos.length})
              </h2>
              <div className="space-y-2">
                {pagos.map((l: any) => (
                  <Card key={l.id} className="opacity-70">
                    <CardContent className="py-3 px-5">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{getPacienteNome(l.paciente_id)}</p>
                          <p className="text-[11px] text-muted-foreground">{l.descricao}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-success tabular-nums">
                            R$ {Number(l.valor || 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {l.forma_pagamento || '—'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {pendentes.length === 0 && pagos.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="h-14 w-14 text-muted-foreground/20 mb-4" />
                <p className="font-semibold text-lg">Nenhum lançamento para esta data</p>
                <p className="text-sm text-muted-foreground mt-1">
                  As cobranças aparecerão aqui ao finalizar consultas na agenda ou fila
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog Dar Baixa */}
      <Dialog open={showBaixa} onOpenChange={setShowBaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" /> Confirmar Recebimento
            </DialogTitle>
          </DialogHeader>
          {selectedLancamento && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paciente</span>
                  <span className="font-semibold text-sm">{getPacienteNome(selectedLancamento.paciente_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Serviço</span>
                  <span className="text-sm">{selectedLancamento.descricao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor original</span>
                  <span className="font-bold">R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={baixaForm.forma_pagamento} onValueChange={(v) => setBaixaForm(p => ({ ...p, forma_pagamento: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map(fp => (
                      <SelectItem key={fp.value} value={fp.value}>
                        <span className="flex items-center gap-2">
                          <fp.icon className="h-3.5 w-3.5" /> {fp.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={baixaForm.desconto || ''}
                    onChange={(e) => setBaixaForm(p => ({ ...p, desconto: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Acréscimo (R$)</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={baixaForm.acrescimo || ''}
                    onChange={(e) => setBaixaForm(p => ({ ...p, acrescimo: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações opcionais..."
                  value={baixaForm.observacoes}
                  onChange={(e) => setBaixaForm(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Valor Final</span>
                <span className="text-2xl font-bold text-success">R$ {valorFinal.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBaixa(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarBaixa}
              disabled={isProcessing}
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
