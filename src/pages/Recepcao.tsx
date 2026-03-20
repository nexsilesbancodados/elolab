import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgendamentos, usePacientes, useMedicos, useSalas } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  UserCheck, Clock, Play, Check, Banknote, QrCode, CreditCard,
  Landmark, Search, Bell, ChevronRight, Users, Stethoscope,
  DollarSign, ArrowRight, Loader2, CheckCircle2, AlertTriangle,
  Timer, Phone, XCircle, Receipt, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Constants ──────────────────────────────────────────
const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600' },
  { value: 'pix', label: 'PIX', icon: QrCode, color: 'text-sky-500' },
  { value: 'credito', label: 'Crédito', icon: CreditCard, color: 'text-primary' },
  { value: 'debito', label: 'Débito', icon: CreditCard, color: 'text-amber-500' },
  { value: 'transferencia', label: 'Transferência', icon: Landmark, color: 'text-muted-foreground' },
];

const STEP_LABELS = ['Check-in', 'Fila', 'Atendimento', 'Pagamento', 'Concluído'] as const;

function calcEspera(ts: string | null): string {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h${mins % 60}min`;
}

function corEspera(ts: string | null): string {
  if (!ts) return 'text-muted-foreground';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 15) return 'text-emerald-600';
  if (mins < 30) return 'text-amber-500';
  return 'text-destructive';
}

// Which step is the patient on?
function patientStep(ag: any, filaItem: any, lancamento: any): number {
  if (lancamento?.status === 'pago') return 4;
  if (lancamento?.status === 'pendente' && ag.status === 'finalizado') return 3;
  if (ag.status === 'finalizado') return 3;
  if (ag.status === 'em_atendimento') return 2;
  if (filaItem) return 1;
  if (ag.status === 'confirmado' || ag.status === 'aguardando') return 0;
  return -1;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── Main Component ─────────────────────────────────────
export default function Recepcao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPagamento, setShowPagamento] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [obsPagamento, setObsPagamento] = useState('');
  const [now, setNow] = useState(Date.now());

  // Refresh timer every 30s
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // Data
  const { data: agendamentos = [], isLoading: loadingAg } = useAgendamentos();
  const { data: pacientes = [] } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  const { data: salas = [] } = useSalas();

  const { data: filaItems = [] } = useQuery({
    queryKey: ['fila_atendimento'],
    queryFn: async () => {
      const { data } = await supabase.from('fila_atendimento').select('*').order('posicao');
      return data || [];
    },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['lancamentos_hoje'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('data', today)
        .eq('tipo', 'receita');
      return data || [];
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase
      .channel('recepcao-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fila_atendimento' }, () => {
        queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['lancamentos_hoje'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  // Build unified patient list for today
  const todayAgendamentos = useMemo(() =>
    agendamentos
      .filter((a: any) => a.data === today && a.status !== 'cancelado')
      .sort((a: any, b: any) => a.hora_inicio.localeCompare(b.hora_inicio)),
    [agendamentos, today]
  );

  const enriched = useMemo(() =>
    todayAgendamentos.map((ag: any) => {
      const pac = pacientes.find((p: any) => p.id === ag.paciente_id);
      const med = medicos.find((m: any) => m.id === ag.medico_id);
      const sala = ag.sala_id ? salas.find((s: any) => s.id === ag.sala_id) : null;
      const fila = filaItems.find((f: any) => f.agendamento_id === ag.id);
      const lanc = lancamentos.find((l: any) => l.agendamento_id === ag.id);
      const step = patientStep(ag, fila, lanc);
      return { ag, pac, med, sala, fila, lanc, step };
    }),
    [todayAgendamentos, pacientes, medicos, salas, filaItems, lancamentos]
  );

  // Filter
  const filtered = useMemo(() => {
    let list = enriched;
    if (activeTab === 'checkin') list = list.filter(e => e.step === 0);
    if (activeTab === 'fila') list = list.filter(e => e.step === 1 || e.step === 2);
    if (activeTab === 'pagamento') list = list.filter(e => e.step === 3);
    if (activeTab === 'concluido') list = list.filter(e => e.step === 4);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.pac?.nome?.toLowerCase().includes(q) ||
        e.med?.nome?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enriched, activeTab, search]);

  // Stats
  const stats = useMemo(() => ({
    aguardando: enriched.filter(e => e.step === 0).length,
    naFila: enriched.filter(e => e.step === 1 || e.step === 2).length,
    pagamento: enriched.filter(e => e.step === 3).length,
    concluido: enriched.filter(e => e.step === 4).length,
  }), [enriched]);

  // ─── Actions ──────────────────────────────────────────
  async function handleCheckin(agId: string) {
    setIsProcessing(true);
    try {
      // Update status to aguardando
      await supabase.from('agendamentos').update({ status: 'aguardando' }).eq('id', agId);

      // Get next position
      const { data: lastFila } = await supabase
        .from('fila_atendimento')
        .select('posicao')
        .order('posicao', { ascending: false })
        .limit(1);
      const nextPos = (lastFila?.[0]?.posicao || 0) + 1;

      await supabase.from('fila_atendimento').insert({
        agendamento_id: agId,
        posicao: nextPos,
        status: 'aguardando',
        horario_chegada: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      toast.success('Check-in realizado! Paciente na fila.');
    } catch (err) {
      toast.error('Erro ao realizar check-in');
    }
    setIsProcessing(false);
  }

  async function handleChamar(filaId: string) {
    setIsProcessing(true);
    try {
      await supabase.from('fila_atendimento').update({ status: 'chamado' }).eq('id', filaId);
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      toast.success('Paciente chamado!');
    } catch { toast.error('Erro ao chamar'); }
    setIsProcessing(false);
  }

  async function handleIniciarAtendimento(agId: string, filaId: string) {
    setIsProcessing(true);
    try {
      await supabase.from('agendamentos').update({ status: 'em_atendimento' }).eq('id', agId);
      await supabase.from('fila_atendimento').update({ status: 'em_atendimento' }).eq('id', filaId);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      toast.success('Atendimento iniciado!');
    } catch { toast.error('Erro'); }
    setIsProcessing(false);
  }

  async function handleFinalizarAtendimento(agId: string, filaId: string) {
    setIsProcessing(true);
    try {
      // Find the appointment to get patient / doctor info
      const item = enriched.find(e => e.ag.id === agId);
      if (!item) throw new Error('Agendamento não encontrado');

      // Update statuses
      await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', agId);
      await supabase.from('fila_atendimento').update({ status: 'finalizado' }).eq('id', filaId);

      // Auto-create lancamento (billing) if none exists yet
      const existingLanc = lancamentos.find((l: any) => l.agendamento_id === agId);
      if (!existingLanc) {
        // Try to find the consultation price from tipos_consulta
        let valor = 0;
        let descricao = 'Consulta';
        if (item.ag.tipo) {
          const { data: tipoConsulta } = await supabase
            .from('tipos_consulta')
            .select('id, nome, valor_particular')
            .eq('nome', item.ag.tipo)
            .eq('ativo', true)
            .limit(1)
            .maybeSingle();

          if (tipoConsulta) {
            valor = tipoConsulta.valor_particular || 0;
            descricao = tipoConsulta.nome;
          }

          // Check for convenio-specific price
          if (item.pac?.convenio_id && tipoConsulta) {
            const { data: precoConv } = await supabase
              .from('precos_consulta_convenio')
              .select('valor')
              .eq('convenio_id', item.pac.convenio_id)
              .eq('tipo_consulta_id', (tipoConsulta as any).id || '')
              .eq('ativo', true)
              .maybeSingle();
            if (precoConv) valor = precoConv.valor;
          }
        }

        // Fallback: use convenio default value
        if (valor === 0 && item.pac?.convenio_id) {
          const conv = (await supabase.from('convenios').select('valor_consulta').eq('id', item.pac.convenio_id).maybeSingle()).data;
          if (conv?.valor_consulta) valor = conv.valor_consulta;
        }

        await supabase.from('lancamentos').insert({
          tipo: 'receita',
          categoria: 'consulta',
          descricao: `${descricao} — ${item.pac?.nome || 'Paciente'}`,
          valor: valor,
          data: today,
          data_vencimento: today,
          status: 'pendente',
          paciente_id: item.ag.paciente_id,
          agendamento_id: agId,
          forma_pagamento: null,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_hoje'] });
      toast.success('Atendimento finalizado! Cobrança gerada.');
    } catch (err: any) {
      console.error('Erro ao finalizar:', err);
      toast.error('Erro ao finalizar atendimento');
    }
    setIsProcessing(false);
  }

  function openPagamento(lanc: any) {
    setSelectedLancamento(lanc);
    setFormaPagamento('');
    setDesconto(0);
    setAcrescimo(0);
    setObsPagamento('');
    setShowPagamento(true);
  }

  async function handleConfirmarPagamento() {
    if (!formaPagamento || !selectedLancamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }
    setIsProcessing(true);
    try {
      const valorFinal = selectedLancamento.valor - desconto + acrescimo;
      await supabase.from('lancamentos').update({
        status: 'pago',
        forma_pagamento: formaPagamento,
        observacoes: obsPagamento || null,
      }).eq('id', selectedLancamento.id);

      queryClient.invalidateQueries({ queryKey: ['lancamentos_hoje'] });
      setShowPagamento(false);
      toast.success(`Pagamento de R$ ${valorFinal.toFixed(2)} confirmado!`);
    } catch { toast.error('Erro ao confirmar pagamento'); }
    setIsProcessing(false);
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Painel de Recepção</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })} — Fluxo completo do paciente
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Aguardando Check-in', value: stats.aguardando, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Na Fila', value: stats.naFila, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Aguardando Pgto', value: stats.pagamento, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Concluídos', value: stats.concluido, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp}>
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl', s.bg)}>
                  <s.icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search + Tabs */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente ou médico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-muted/50 p-1 gap-1">
          <TabsTrigger value="todos" className="data-[state=active]:bg-background">
            Todos ({enriched.length})
          </TabsTrigger>
          <TabsTrigger value="checkin" className="data-[state=active]:bg-background">
            <Clock className="h-3.5 w-3.5 mr-1" /> Check-in ({stats.aguardando})
          </TabsTrigger>
          <TabsTrigger value="fila" className="data-[state=active]:bg-background">
            <Users className="h-3.5 w-3.5 mr-1" /> Fila ({stats.naFila})
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="data-[state=active]:bg-background">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Pagamento ({stats.pagamento})
          </TabsTrigger>
          <TabsTrigger value="concluido" className="data-[state=active]:bg-background">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluído ({stats.concluido})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {loadingAg ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum paciente nesta etapa</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Os pacientes aparecerão aqui conforme chegarem</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.map(({ ag, pac, med, sala, fila, lanc, step }) => (
                  <motion.div
                    key={ag.id}
                    variants={fadeUp}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    layout
                  >
                    <Card className={cn(
                      'border transition-all duration-200 overflow-hidden',
                      step === 2 && 'border-primary/30 shadow-md shadow-primary/5',
                      step === 3 && 'border-amber-400/30 shadow-md shadow-amber-400/5',
                      step === 4 && 'opacity-60',
                    )}>
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Step indicator */}
                          <div className={cn(
                            'w-1.5 shrink-0',
                            step === 0 && 'bg-amber-400',
                            step === 1 && 'bg-sky-400',
                            step === 2 && 'bg-primary',
                            step === 3 && 'bg-orange-400',
                            step === 4 && 'bg-emerald-500',
                          )} />

                          <div className="flex-1 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {/* Patient info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">
                                    {(pac as any)?.nome_social || pac?.nome || 'Paciente'}
                                  </h3>
                                  {pac?.alergias && pac.alergias.length > 0 && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Alergia
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {ag.hora_inicio?.slice(0, 5)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" /> {med?.nome || 'Médico'}
                                  </span>
                                  {sala && (
                                    <span className="flex items-center gap-1">
                                      🚪 {sala.nome}
                                    </span>
                                  )}
                                  {ag.tipo && (
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      {ag.tipo}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Step progress pills */}
                              <div className="hidden lg:flex items-center gap-1">
                                {STEP_LABELS.map((label, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <div className={cn(
                                      'h-6 px-2.5 rounded-full flex items-center text-[10px] font-medium transition-colors',
                                      i < step && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                      i === step && 'bg-primary/10 text-primary ring-1 ring-primary/20',
                                      i > step && 'bg-muted text-muted-foreground/50',
                                    )}>
                                      {i < step ? <Check className="h-3 w-3" /> : label}
                                    </div>
                                    {i < STEP_LABELS.length - 1 && (
                                      <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Wait time */}
                              {fila?.horario_chegada && step < 3 && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Timer className="h-3.5 w-3.5" />
                                  <span className={corEspera(fila.horario_chegada)}>
                                    {calcEspera(fila.horario_chegada)}
                                  </span>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {step === 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckin(ag.id)}
                                    disabled={isProcessing}
                                    className="gap-1.5"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" /> Check-in
                                  </Button>
                                )}

                                {step === 1 && fila && (
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleChamar(fila.id)}
                                      disabled={isProcessing}
                                      className="gap-1"
                                    >
                                      <Bell className="h-3.5 w-3.5" /> Chamar
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleIniciarAtendimento(ag.id, fila.id)}
                                      disabled={isProcessing}
                                      className="gap-1"
                                    >
                                      <Play className="h-3.5 w-3.5" /> Atender
                                    </Button>
                                  </div>
                                )}

                                {step === 2 && fila && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleFinalizarAtendimento(ag.id, fila.id)}
                                    disabled={isProcessing}
                                    className="gap-1"
                                  >
                                    <Check className="h-3.5 w-3.5" /> Finalizar
                                  </Button>
                                )}

                                {step === 3 && lanc && (
                                  <Button
                                    size="sm"
                                    onClick={() => openPagamento(lanc)}
                                    disabled={isProcessing}
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <DollarSign className="h-3.5 w-3.5" />
                                    Receber R$ {lanc.valor?.toFixed(2)}
                                  </Button>
                                )}

                                {step === 4 && lanc && (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Pago — {lanc.forma_pagamento}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPagamento} onOpenChange={setShowPagamento}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>

          {selectedLancamento && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">{selectedLancamento.descricao}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold text-lg">
                    R$ {((selectedLancamento.valor || 0) - desconto + acrescimo).toFixed(2)}
                  </span>
                </div>
                {(desconto > 0 || acrescimo > 0) && (
                  <div className="text-xs text-muted-foreground">
                    Original: R$ {selectedLancamento.valor?.toFixed(2)}
                    {desconto > 0 && ` • Desc: -R$ ${desconto.toFixed(2)}`}
                    {acrescimo > 0 && ` • Acrés: +R$ ${acrescimo.toFixed(2)}`}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAS_PAGAMENTO.map(fp => (
                    <button
                      key={fp.value}
                      onClick={() => setFormaPagamento(fp.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                        formaPagamento === fp.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30 text-muted-foreground'
                      )}
                    >
                      <fp.icon className={cn('h-5 w-5', formaPagamento === fp.value ? 'text-primary' : fp.color)} />
                      {fp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Desconto (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={desconto || ''}
                    onChange={e => setDesconto(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acréscimo (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={acrescimo || ''}
                    onChange={e => setAcrescimo(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  placeholder="Opcional..."
                  value={obsPagamento}
                  onChange={e => setObsPagamento(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagamento(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarPagamento}
              disabled={!formaPagamento || isProcessing}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
