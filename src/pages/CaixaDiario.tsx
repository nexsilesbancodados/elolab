import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  CalendarDays, History, FileText,
  BarChart3, Calendar,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

type ViewMode = 'caixa' | 'historico';

const PERIODOS_PRESET = [
  { label: 'Hoje', key: 'hoje' },
  { label: 'Esta Semana', key: 'semana' },
  { label: 'Este Mês', key: 'mes' },
  { label: 'Personalizado', key: 'custom' },
] as const;

export default function CaixaDiario() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('caixa');

  // Caixa state
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null);
  const [showBaixa, setShowBaixa] = useState(false);
  const [showEstorno, setShowEstorno] = useState(false);
  const [showResumo, setShowResumo] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tabFilter, setTabFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [valorAbertura, setValorAbertura] = useState(0);

  // Load caixa state from Supabase
  useEffect(() => {
    if (!profile) return;
    const loadCaixaState = async () => {
      const { data } = await supabase
        .from('configuracoes_clinica')
        .select('valor')
        .eq('chave', 'caixa_estado')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (data?.valor) {
        const estado = data.valor as any;
        if (estado.data === format(new Date(), 'yyyy-MM-dd') && estado.aberto) {
          setCaixaAberto(true);
          setValorAbertura(estado.valorAbertura || 0);
        }
      }
    };
    loadCaixaState();
  }, [profile]);
  const [showAbertura, setShowAbertura] = useState(false);
  const [baixaForm, setBaixaForm] = useState<BaixaForm>({
    forma_pagamento: 'dinheiro',
    desconto: 0,
    acrescimo: 0,
    observacoes: '',
  });

  // Histórico state
  const [periodoKey, setPeriodoKey] = useState<string>('semana');
  const [customDe, setCustomDe] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customAte, setCustomAte] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Compute date range for histórico
  const periodoRange = useMemo(() => {
    const today = new Date();
    switch (periodoKey) {
      case 'hoje':
        return { de: format(today, 'yyyy-MM-dd'), ate: format(today, 'yyyy-MM-dd') };
      case 'semana':
        return { de: format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'), ate: format(endOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd') };
      case 'mes':
        return { de: format(startOfMonth(today), 'yyyy-MM-dd'), ate: format(endOfMonth(today), 'yyyy-MM-dd') };
      case 'custom':
        return { de: customDe, ate: customAte };
      default:
        return { de: format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'), ate: format(today, 'yyyy-MM-dd') };
    }
  }, [periodoKey, customDe, customAte]);

  // ===== Queries =====
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

  const { data: historicoLancamentos = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['caixa-historico', periodoRange.de, periodoRange.ate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('tipo', 'receita')
        .gte('data', periodoRange.de)
        .lte('data', periodoRange.ate)
        .order('data', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: viewMode === 'historico',
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
        queryClient.invalidateQueries({ queryKey: ['caixa-historico'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getPaciente = useCallback((id: string | null) => {
    if (!id) return { nome: 'Particular', telefone: '', cpf: '' };
    return pacientes.find((p: any) => p.id === id) || { nome: 'Paciente', telefone: '', cpf: '' };
  }, [pacientes]);

  // ===== Stats (today) =====
  const stats = useMemo(() => {
    const pend = lancamentos.filter((l: any) => l.status === 'pendente');
    const paid = lancamentos.filter((l: any) => l.status === 'pago');
    const totalPendente = pend.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    const totalRecebido = paid.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);

    const porForma: Record<string, { total: number; count: number }> = {};
    paid.forEach((l: any) => {
      const fp = l.forma_pagamento || 'outros';
      if (!porForma[fp]) porForma[fp] = { total: 0, count: 0 };
      porForma[fp].total += Number(l.valor || 0);
      porForma[fp].count += 1;
    });

    return {
      total: lancamentos.length,
      pendentes: pend.length,
      pagos: paid.length,
      totalPendente,
      totalRecebido,
      totalDia: totalPendente + totalRecebido,
      porForma,
      ticketMedio: paid.length > 0 ? totalRecebido / paid.length : 0,
      saldoCaixa: valorAbertura + totalRecebido,
    };
  }, [lancamentos, valorAbertura]);

  // ===== Histórico stats =====
  const historicoStats = useMemo(() => {
    const paid = historicoLancamentos.filter((l: any) => l.status === 'pago');
    const pend = historicoLancamentos.filter((l: any) => l.status === 'pendente');
    const totalRecebido = paid.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
    const totalPendente = pend.reduce((s: number, l: any) => s + Number(l.valor || 0), 0);

    const porForma: Record<string, { total: number; count: number }> = {};
    paid.forEach((l: any) => {
      const fp = l.forma_pagamento || 'outros';
      if (!porForma[fp]) porForma[fp] = { total: 0, count: 0 };
      porForma[fp].total += Number(l.valor || 0);
      porForma[fp].count += 1;
    });

    // Daily chart data
    const porDia: Record<string, { recebido: number; pendente: number }> = {};
    historicoLancamentos.forEach((l: any) => {
      if (!porDia[l.data]) porDia[l.data] = { recebido: 0, pendente: 0 };
      if (l.status === 'pago') porDia[l.data].recebido += Number(l.valor || 0);
      else if (l.status === 'pendente') porDia[l.data].pendente += Number(l.valor || 0);
    });
    const chartData = Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, vals]) => ({
        data: format(new Date(data + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
        dataFull: data,
        recebido: vals.recebido,
        pendente: vals.pendente,
      }));

    return {
      total: historicoLancamentos.length,
      pagos: paid.length,
      pendentes: pend.length,
      totalRecebido,
      totalPendente,
      porForma,
      chartData,
      ticketMedio: paid.length > 0 ? totalRecebido / paid.length : 0,
    };
  }, [historicoLancamentos]);

  // ===== Filtered list =====
  const filtered = useMemo(() => {
    return lancamentos.filter((l: any) => {
      const matchSearch = !search ||
        getPaciente(l.paciente_id).nome.toLowerCase().includes(search.toLowerCase()) ||
        (l.descricao || '').toLowerCase().includes(search.toLowerCase());
      const matchTab = tabFilter === 'todos' || l.status === tabFilter;
      return matchSearch && matchTab;
    });
  }, [lancamentos, search, getPaciente, tabFilter]);

  const pendentesFiltered = filtered.filter((l: any) => l.status === 'pendente');
  const pagosFiltered = filtered.filter((l: any) => l.status === 'pago');

  // ===== Actions =====
  const handleAbrirCaixa = () => {
    setCaixaAberto(true);
    setShowAbertura(false);
    localStorage.setItem('caixa_estado', JSON.stringify({
      aberto: true, valorAbertura, data: format(new Date(), 'yyyy-MM-dd'), operador: profile?.nome || 'Sistema',
    }));
    toast.success(`Caixa aberto com troco de R$ ${valorAbertura.toFixed(2)}`);
  };

  const handleFecharCaixa = () => {
    setShowResumo(true);
  };

  const confirmarFechamento = () => {
    setCaixaAberto(false);
    setShowResumo(false);
    localStorage.setItem('caixa_estado', JSON.stringify({
      aberto: false, valorAbertura: 0, data: format(new Date(), 'yyyy-MM-dd'), operador: profile?.nome || 'Sistema',
    }));
    toast.info('Caixa fechado. Resumo registrado.');
  };

  const handleImprimirResumo = () => {
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return;
    const formasHtml = Object.entries(stats.porForma).map(([forma, { total, count }]) => {
      const fp = FORMAS_PAGAMENTO.find(f => f.value === forma);
      return `<div class="row"><span>${fp?.label || forma} (${count}x)</span><span>R$ ${total.toFixed(2)}</span></div>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Fechamento de Caixa</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 380px; margin: 20px auto; font-size: 13px; color: #333; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 16px; }
        .header h2 { margin: 0 0 4px; font-size: 18px; }
        .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .row.total { border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 16px; }
        .section { margin-top: 16px; }
        .section-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="header">
        <h2>FECHAMENTO DE CAIXA</h2>
        <p>${format(new Date(selectedDate + 'T12:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</p>
      </div>
      <div class="row"><span>Operador:</span><strong>${profile?.nome || 'Sistema'}</strong></div>
      <div class="row"><span>Troco inicial:</span><span>R$ ${valorAbertura.toFixed(2)}</span></div>
      <div class="section">
        <div class="section-title">Resumo</div>
        <div class="row"><span>Total de atendimentos:</span><span>${stats.total}</span></div>
        <div class="row"><span>Recebidos:</span><span>${stats.pagos}</span></div>
        <div class="row"><span>Pendentes:</span><span>${stats.pendentes}</span></div>
      </div>
      <div class="section">
        <div class="section-title">Por Forma de Pagamento</div>
        ${formasHtml || '<div class="row"><span>Nenhum recebimento</span></div>'}
      </div>
      <div class="row total"><span>TOTAL RECEBIDO:</span><span>R$ ${stats.totalRecebido.toFixed(2)}</span></div>
      <div class="row"><span>Total pendente:</span><span style="color:#c00">R$ ${stats.totalPendente.toFixed(2)}</span></div>
      <div class="row total"><span>SALDO EM CAIXA:</span><span>R$ ${stats.saldoCaixa.toFixed(2)}</span></div>
      <div class="footer">
        <p>Fechamento em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body></html>`);
    w.document.close();
  };

  const openBaixa = (lancamento: any) => {
    if (!caixaAberto) {
      toast.error('Abra o caixa primeiro para receber pagamentos.');
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
      toast.success(`Pagamento confirmado — ${getPaciente(selectedLancamento.paciente_id).nome}`, {
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
      toast.warning('Pagamento estornado.');
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
      <div class="header"><h2>RECIBO DE PAGAMENTO</h2><p>${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p></div>
      <div class="row"><span>Paciente:</span><strong>${pac.nome}</strong></div>
      ${pac.cpf ? `<div class="row"><span>CPF:</span><span>${pac.cpf}</span></div>` : ''}
      <div class="row"><span>Descrição:</span><span>${l.descricao || '—'}</span></div>
      <div class="row"><span>Forma Pgto:</span><span>${fp?.label || l.forma_pagamento || '—'}</span></div>
      <div class="row total"><span>VALOR PAGO:</span><span>R$ ${Number(l.valor || 0).toFixed(2)}</span></div>
      <div class="footer"><p>Recebido por: ${profile?.nome || 'Sistema'}</p><p>Documento sem valor fiscal</p></div>
      <script>window.onload = function() { window.print(); }</script>
    </body></html>`);
    w.document.close();
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const navigateDate = (dir: number) => {
    const d = dir > 0 ? addDays(new Date(selectedDate + 'T12:00:00'), 1) : subDays(new Date(selectedDate + 'T12:00:00'), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  // ===== RENDER =====
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

        {/* View mode tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
          <TabsList>
            <TabsTrigger value="caixa" className="gap-1.5 text-sm">
              <Receipt className="h-4 w-4" /> Caixa
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-sm">
              <History className="h-4 w-4" /> Histórico
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ==================== CAIXA VIEW ==================== */}
      {viewMode === 'caixa' && (
        <div className="space-y-5">
          {/* Caixa controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {!caixaAberto ? (
              <Button className="gap-2 font-bold" onClick={() => setShowAbertura(true)}>
                <LockOpen className="h-4 w-4" /> Abrir Caixa
              </Button>
            ) : (
              <Button variant="destructive" className="gap-2 font-bold" onClick={handleFecharCaixa}>
                <Lock className="h-4 w-4" /> Fechar Caixa
              </Button>
            )}

            <Badge variant={caixaAberto ? 'default' : 'secondary'} className="text-xs gap-1">
              {caixaAberto ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {caixaAberto ? 'Aberto' : 'Fechado'}
            </Badge>

            {/* Date nav */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5 ml-auto">
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

          {/* Date + pending badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {isToday ? '📅 Hoje' : format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
            </Badge>
            {stats.pendentes > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs animate-pulse gap-1">
                <AlertCircle className="h-3 w-3" /> {stats.pendentes} pendente(s)
              </Badge>
            )}
            {caixaAberto && (
              <Badge variant="outline" className="text-xs gap-1">
                Troco: R$ {valorAbertura.toFixed(2)}
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
              { label: 'Saldo Caixa', value: stats.saldoCaixa, icon: Banknote, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn('border', s.border)}>
                  <CardContent className="py-3.5 px-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{s.label}</p>
                        <p className={cn('text-xl font-black mt-0.5 tabular-nums', s.color)}>R$ {s.value.toFixed(2)}</p>
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
                  <Clock className="h-3 w-3" /> Pendentes
                </TabsTrigger>
                <TabsTrigger value="pago" className="text-xs px-3 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Recebidos
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (
            <div className="space-y-5">
              {pendentesFiltered.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-1.5 mb-2.5 px-1">
                    <Clock className="h-3.5 w-3.5" /> Aguardando Pagamento
                  </h2>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {pendentesFiltered.map((l: any, i: number) => {
                        const pac = getPaciente(l.paciente_id);
                        return (
                          <motion.div key={l.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                            <Card className="border-warning/30 hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer" onClick={() => openDetalhes(l)}>
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
                                      {l.created_at && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(l.created_at), 'HH:mm')}</span>}
                                      {l.categoria && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{l.categoria}</Badge>}
                                    </div>
                                  </div>
                                  <p className="text-xl font-black tabular-nums shrink-0">R$ {Number(l.valor || 0).toFixed(2)}</p>
                                  <Button onClick={(e) => { e.stopPropagation(); openBaixa(l); }} className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground shadow-lg shadow-success/20 font-bold text-sm px-5 shrink-0">
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

              {pagosFiltered.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5 mb-2.5 px-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Recebidos
                  </h2>
                  <div className="space-y-1.5">
                    {pagosFiltered.map((l: any) => {
                      const pac = getPaciente(l.paciente_id);
                      const fp = FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento);
                      const FpIcon = fp?.icon || DollarSign;
                      return (
                        <Card key={l.id} className="border-success/10 bg-success/[0.02] group cursor-pointer hover:bg-success/[0.04] transition-colors" onClick={() => openDetalhes(l)}>
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleImprimirRecibo(l); }} title="Recibo">
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={(e) => { e.stopPropagation(); openEstorno(l); }} title="Estornar">
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

              {pendentesFiltered.length === 0 && pagosFiltered.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                      <Receipt className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-base">Caixa vazio</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {search ? 'Nenhum resultado.' : 'As cobranças aparecerão ao finalizar consultas.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== HISTÓRICO VIEW ==================== */}
      {viewMode === 'historico' && (
        <div className="space-y-5">
          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {PERIODOS_PRESET.map(p => (
              <Button
                key={p.key}
                variant={periodoKey === p.key ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setPeriodoKey(p.key)}
              >
                {p.label}
              </Button>
            ))}
            {periodoKey === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <Input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)} className="h-8 w-[140px] text-xs" />
                <span className="text-xs text-muted-foreground">até</span>
                <Input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)} className="h-8 w-[140px] text-xs" />
              </div>
            )}
          </div>

          <Badge variant="secondary" className="text-xs">
            {format(new Date(periodoRange.de + 'T12:00:00'), 'dd/MM/yyyy')} — {format(new Date(periodoRange.ate + 'T12:00:00'), 'dd/MM/yyyy')}
          </Badge>

          {isLoadingHistorico ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Recebido', value: historicoStats.totalRecebido, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
                  { label: 'Total Pendente', value: historicoStats.totalPendente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
                  { label: 'Ticket Médio', value: historicoStats.ticketMedio, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Atendimentos', value: -1, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', countVal: historicoStats.total },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className={cn('border', s.border)}>
                      <CardContent className="py-3.5 px-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                            {s.countVal !== undefined ? (
                              <p className={cn('text-xl font-black mt-0.5', s.color)}>{s.countVal}</p>
                            ) : (
                              <p className={cn('text-xl font-black mt-0.5 tabular-nums', s.color)}>R$ {s.value.toFixed(2)}</p>
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

              {/* Chart */}
              {historicoStats.chartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Recebimentos por Dia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicoStats.chartData} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="data" className="text-xs" tick={{ fontSize: 11 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name === 'recebido' ? 'Recebido' : 'Pendente']}
                            labelFormatter={(label) => `Dia ${label}`}
                            contentStyle={{ borderRadius: 12, fontSize: 12 }}
                          />
                          <Bar dataKey="recebido" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Recebido" />
                          <Bar dataKey="pendente" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Pendente" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment method breakdown */}
              {Object.keys(historicoStats.porForma).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recebido por Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(historicoStats.porForma)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([forma, { total, count }]) => {
                          const fp = FORMAS_PAGAMENTO.find(f => f.value === forma);
                          const Icon = fp?.icon || DollarSign;
                          const pct = historicoStats.totalRecebido > 0 ? (total / historicoStats.totalRecebido) * 100 : 0;
                          return (
                            <div key={forma} className="flex items-center gap-3">
                              <Icon className={cn('h-4 w-4 shrink-0', fp?.color || 'text-muted-foreground')} />
                              <span className="text-sm font-medium w-28 shrink-0">{fp?.label || forma}</span>
                              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-bold tabular-nums shrink-0 w-28 text-right">R$ {total.toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">({count}x)</span>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lancamentos list */}
              {historicoLancamentos.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Lançamentos ({historicoLancamentos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-y-auto space-y-1">
                    {historicoLancamentos.map((l: any) => {
                      const pac = getPaciente(l.paciente_id);
                      const fp = FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento);
                      return (
                        <div key={l.id} className="flex items-center gap-3 py-2 px-1 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer" onClick={() => openDetalhes(l)}>
                          <Badge variant={l.status === 'pago' ? 'default' : 'secondary'} className="text-[9px] w-16 justify-center shrink-0">
                            {l.status === 'pago' ? 'Pago' : 'Pendente'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground shrink-0 w-16">{format(new Date(l.data + 'T12:00:00'), 'dd/MM')}</span>
                          <span className="text-sm font-medium truncate flex-1">{pac.nome}</span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">{l.descricao}</span>
                          {fp && <fp.icon className={cn('h-3.5 w-3.5 shrink-0', fp.color)} />}
                          <span className={cn('text-sm font-bold tabular-nums shrink-0', l.status === 'pago' ? 'text-success' : 'text-warning')}>
                            R$ {Number(l.valor || 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {historicoLancamentos.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="font-bold">Sem lançamentos no período</p>
                    <p className="text-sm text-muted-foreground mt-1">Selecione outro período para visualizar o histórico.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== Dialog: Abertura de Caixa ===== */}
      <Dialog open={showAbertura} onOpenChange={setShowAbertura}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockOpen className="h-5 w-5 text-primary" /> Abrir Caixa
            </DialogTitle>
            <DialogDescription>Informe o valor de troco inicial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor de Abertura / Troco (R$)</Label>
              <Input
                type="number" min={0} step={0.01}
                value={valorAbertura || ''}
                onChange={(e) => setValorAbertura(Number(e.target.value) || 0)}
                className="h-10 text-lg font-bold"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <p><strong>Operador:</strong> {profile?.nome || '—'}</p>
              <p><strong>Data:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbertura(false)}>Cancelar</Button>
            <Button onClick={handleAbrirCaixa} className="gap-2 font-bold">
              <LockOpen className="h-4 w-4" /> Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Resumo de Fechamento ===== */}
      <Dialog open={showResumo} onOpenChange={setShowResumo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" /> Fechamento de Caixa
            </DialogTitle>
            <DialogDescription>Resumo do dia antes de fechar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Operador</span><span className="font-bold">{profile?.nome || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{format(new Date(selectedDate + 'T12:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Troco Inicial</span><span className="tabular-nums">R$ {valorAbertura.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Atendimentos</span><span>{stats.total}</span></div>
            </div>

            {/* Breakdown by payment method */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recebido por forma</p>
              {Object.keys(stats.porForma).length > 0 ? (
                Object.entries(stats.porForma).map(([forma, { total, count }]) => {
                  const fp = FORMAS_PAGAMENTO.find(f => f.value === forma);
                  const Icon = fp?.icon || DollarSign;
                  return (
                    <div key={forma} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', fp?.color)} />
                        <span className="text-sm">{fp?.label || forma}</span>
                        <span className="text-[10px] text-muted-foreground">({count}x)</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">R$ {total.toFixed(2)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum recebimento registrado.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-success font-medium">Total Recebido</span>
                <span className="font-bold text-success tabular-nums">R$ {stats.totalRecebido.toFixed(2)}</span>
              </div>
              {stats.totalPendente > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warning font-medium">Pendente ({stats.pendentes})</span>
                  <span className="font-bold text-warning tabular-nums">R$ {stats.totalPendente.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-primary">Saldo em Caixa</span>
              <span className="text-3xl font-black text-primary tabular-nums">R$ {stats.saldoCaixa.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleImprimirResumo}>
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
            <Button variant="outline" onClick={() => setShowResumo(false)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmarFechamento} className="gap-2 font-bold">
              <Lock className="h-4 w-4" /> Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Receber ===== */}
      <Dialog open={showBaixa} onOpenChange={setShowBaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Banknote className="h-5 w-5" /> Confirmar Recebimento
            </DialogTitle>
            <DialogDescription>Registre o pagamento do paciente.</DialogDescription>
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
                    <button key={fp.value} type="button" onClick={() => setBaixaForm(p => ({ ...p, forma_pagamento: fp.value }))}
                      className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                        baixaForm.forma_pagamento === fp.value ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30 hover:bg-muted/50')}>
                      <fp.icon className={cn('h-5 w-5', baixaForm.forma_pagamento === fp.value ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-[11px] font-medium', baixaForm.forma_pagamento === fp.value ? 'text-primary' : 'text-muted-foreground')}>{fp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Desconto (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={baixaForm.desconto || ''} onChange={(e) => setBaixaForm(p => ({ ...p, desconto: Number(e.target.value) || 0 }))} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Acréscimo (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={baixaForm.acrescimo || ''} onChange={(e) => setBaixaForm(p => ({ ...p, acrescimo: Number(e.target.value) || 0 }))} className="h-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea placeholder="Observações opcionais..." value={baixaForm.observacoes} onChange={(e) => setBaixaForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="resize-none" />
              </div>

              <div className="rounded-xl bg-success/5 border border-success/20 p-4 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-success">Total</span>
                <span className="text-3xl font-black text-success tabular-nums">R$ {valorFinal.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBaixa(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarBaixa} disabled={isProcessing} className="gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/25">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Estorno ===== */}
      <Dialog open={showEstorno} onOpenChange={setShowEstorno}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Undo2 className="h-5 w-5" /> Estornar Pagamento</DialogTitle>
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
                <Textarea placeholder="Informe o motivo..." value={motivoEstorno} onChange={(e) => setMotivoEstorno(e.target.value)} rows={2} className="resize-none" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEstorno(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEstorno} disabled={isProcessing || !motivoEstorno.trim()} className="gap-2">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Detalhes ===== */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Detalhes</DialogTitle>
            <DialogDescription>Informações do lançamento.</DialogDescription>
          </DialogHeader>
          {selectedLancamento && (() => {
            const pac = getPaciente(selectedLancamento.paciente_id);
            const fp = FORMAS_PAGAMENTO.find(f => f.value === selectedLancamento.forma_pagamento);
            return (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <span className="text-muted-foreground">Paciente</span><span className="font-medium">{pac.nome}</span>
                  {pac.cpf && <><span className="text-muted-foreground">CPF</span><span>{pac.cpf}</span></>}
                  {pac.telefone && <><span className="text-muted-foreground">Telefone</span><span>{pac.telefone}</span></>}
                  <span className="text-muted-foreground">Descrição</span><span>{selectedLancamento.descricao || '—'}</span>
                  <span className="text-muted-foreground">Categoria</span><span>{selectedLancamento.categoria || '—'}</span>
                  <span className="text-muted-foreground">Valor</span><span className="font-bold">R$ {Number(selectedLancamento.valor || 0).toFixed(2)}</span>
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selectedLancamento.status === 'pago' ? 'default' : 'secondary'} className="w-fit">{selectedLancamento.status === 'pago' ? 'Recebido' : 'Pendente'}</Badge>
                  {fp && <><span className="text-muted-foreground">Forma Pgto</span><span className="flex items-center gap-1"><fp.icon className={cn('h-3.5 w-3.5', fp.color)} /> {fp.label}</span></>}
                  {selectedLancamento.created_at && <><span className="text-muted-foreground">Criado em</span><span>{format(new Date(selectedLancamento.created_at), "dd/MM/yyyy 'às' HH:mm")}</span></>}
                </div>
                {selectedLancamento.observacoes && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{selectedLancamento.observacoes}</div>
                )}
                {selectedLancamento.status === 'pago' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleImprimirRecibo(selectedLancamento)}><Printer className="h-3.5 w-3.5" /> Recibo</Button>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { setShowDetalhes(false); openEstorno(selectedLancamento); }}><Undo2 className="h-3.5 w-3.5" /> Estornar</Button>
                  </div>
                )}
                {selectedLancamento.status === 'pendente' && (
                  <Button className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold" onClick={() => { setShowDetalhes(false); openBaixa(selectedLancamento); }}>
                    <Banknote className="h-4 w-4" /> Receber
                  </Button>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
