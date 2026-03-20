import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Check, DollarSign, AlertCircle, Receipt, Calendar, Download, Clock, TrendingUp, User, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes } from '@/hooks/useSupabaseData';
import { Database } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type StatusPagamento = Database['public']['Enums']['status_pagamento'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pendente: { label: 'Pendente', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  pago: { label: 'Recebido', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  atrasado: { label: 'Atrasado', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  cancelado: { label: 'Cancelado', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
  estornado: { label: 'Estornado', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
];

interface FormData {
  paciente_id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento: string;
}

interface BaixaData {
  forma_pagamento: string;
  data_recebimento: string;
  desconto: number;
  acrescimo: number;
  observacoes: string;
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ContasReceber() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    paciente_id: '', categoria: 'consulta', descricao: '', valor: 0,
    data_vencimento: format(new Date(), 'yyyy-MM-dd'), forma_pagamento: 'pix',
  });
  const [baixaData, setBaixaData] = useState<BaixaData>({
    forma_pagamento: 'pix', data_recebimento: format(new Date(), 'yyyy-MM-dd'),
    desconto: 0, acrescimo: 0, observacoes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();

  const { data: contas = [], isLoading: loadingContas } = useQuery({
    queryKey: ['lancamentos', 'receita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*, pacientes(nome)')
        .eq('tipo', 'receita')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      const today = new Date().toISOString().split('T')[0];
      return data.map(conta => {
        if (conta.status === 'pendente' && conta.data_vencimento && conta.data_vencimento < today) {
          return { ...conta, status: 'atrasado' as StatusPagamento };
        }
        return conta;
      });
    },
    enabled: !!user,
  });

  const isLoading = loadingContas || loadingPacientes;

  const filteredContas = useMemo(() => {
    return contas.filter(c => {
      const paciente = (c as any).pacientes;
      const matchSearch =
        paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contas, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: contas.filter(c => c.status !== 'cancelado').reduce((a, c) => a + c.valor, 0),
    pendente: contas.filter(c => c.status === 'pendente').reduce((a, c) => a + c.valor, 0),
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((a, c) => a + c.valor, 0),
    pago: contas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0),
    countPendente: contas.filter(c => c.status === 'pendente').length,
    countAtrasado: contas.filter(c => c.status === 'atrasado').length,
    countPago: contas.filter(c => c.status === 'pago').length,
  }), [contas]);

  const getPacienteNome = (conta: any) => conta.pacientes?.nome || 'Particular';

  const handleNew = () => {
    setFormData({ paciente_id: '', categoria: 'consulta', descricao: '', valor: 0,
      data_vencimento: format(new Date(), 'yyyy-MM-dd'), forma_pagamento: 'pix' });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lancamentos').insert({
        tipo: 'receita', categoria: formData.categoria, descricao: formData.descricao,
        valor: formData.valor, data: new Date().toISOString().split('T')[0],
        data_vencimento: formData.data_vencimento, status: 'pendente' as StatusPagamento,
        paciente_id: formData.paciente_id, forma_pagamento: formData.forma_pagamento || null,
      });
      if (error) throw error;
      toast.success('Conta cadastrada!');
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally { setIsSubmitting(false); }
  };

  const handleDarBaixa = (conta: any) => {
    setSelectedConta(conta);
    setBaixaData({ forma_pagamento: conta.forma_pagamento || 'pix',
      data_recebimento: format(new Date(), 'yyyy-MM-dd'), desconto: 0, acrescimo: 0, observacoes: '' });
    setIsPagamentoOpen(true);
  };

  const valorFinal = useMemo(() => {
    if (!selectedConta) return 0;
    return selectedConta.valor - baixaData.desconto + baixaData.acrescimo;
  }, [selectedConta, baixaData.desconto, baixaData.acrescimo]);

  const handleConfirmarBaixa = async () => {
    if (!selectedConta) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lancamentos').update({
        status: 'pago' as StatusPagamento,
        forma_pagamento: baixaData.forma_pagamento,
        observacoes: baixaData.observacoes || null,
      }).eq('id', selectedConta.id);
      if (error) throw error;
      toast.success(`Pagamento confirmado — ${getPacienteNome(selectedConta)}`);
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsPagamentoOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao confirmar');
    } finally { setIsSubmitting(false); }
  };

  const exportarExcel = () => {
    const rows = filteredContas.map(c => ({
      Paciente: getPacienteNome(c), Descrição: c.descricao, Categoria: c.categoria,
      Valor: c.valor, Vencimento: c.data_vencimento || '', Status: c.status,
      'Forma Pgto': c.forma_pagamento || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');
    XLSX.writeFile(wb, `contas_receber_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Exportado!');
  };

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-success" /> Contas a Receber
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receitas, consultas e recebimentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportarExcel}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Conta
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Pendente', value: stats.pendente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', count: stats.countPendente },
          { label: 'Atrasado', value: stats.atrasado, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', count: stats.countAtrasado },
          { label: 'Recebido', value: stats.pago, icon: Check, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', count: stats.countPago },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('border', s.border)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                    <p className={cn('text-xl font-black mt-0.5 tabular-nums', s.color)}>{fmt(s.value)}</p>
                    {s.count !== undefined && s.count > 0 && (
                      <p className="text-[10px] text-muted-foreground">{s.count} conta(s)</p>
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="todos" className="text-xs px-3">Todos ({contas.length})</TabsTrigger>
            <TabsTrigger value="pendente" className="text-xs px-3 gap-1"><Clock className="h-3 w-3" /> Pendentes</TabsTrigger>
            <TabsTrigger value="atrasado" className="text-xs px-3 gap-1"><AlertCircle className="h-3 w-3" /> Atrasados</TabsTrigger>
            <TabsTrigger value="pago" className="text-xs px-3 gap-1"><Check className="h-3 w-3" /> Recebidos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredContas.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="font-bold">Nenhuma conta encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">Crie uma nova conta ou ajuste os filtros.</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredContas.map((conta, i) => {
              const status = STATUS_CONFIG[conta.status || 'pendente'];
              const diasVenc = conta.data_vencimento ? differenceInDays(new Date(conta.data_vencimento), new Date()) : null;
              return (
                <motion.div key={conta.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}>
                  <Card className={cn('hover:shadow-md hover:-translate-y-0.5 transition-all group border', status?.border)}>
                    <CardContent className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', status?.bg)}>
                          <User className={cn('h-5 w-5', status?.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{getPacienteNome(conta)}</p>
                          <p className="text-xs text-muted-foreground truncate">{conta.descricao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {conta.data_vencimento && (
                              <span className={cn('text-[10px] flex items-center gap-0.5',
                                diasVenc !== null && diasVenc < 0 ? 'text-destructive' : 'text-muted-foreground/60'
                              )}>
                                <Calendar className="h-2.5 w-2.5" />
                                Venc: {format(new Date(conta.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy')}
                                {diasVenc !== null && diasVenc < 0 && ` (${Math.abs(diasVenc)}d atrás)`}
                              </span>
                            )}
                            {conta.categoria && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{conta.categoria}</Badge>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn('text-lg font-black tabular-nums', status?.color)}>{fmt(conta.valor)}</p>
                          <Badge className={cn('text-[10px]', status?.bg, status?.color, 'border-0')}>{status?.label}</Badge>
                        </div>
                        {(conta.status === 'pendente' || conta.status === 'atrasado') && (
                          <Button onClick={() => handleDarBaixa(conta)}
                            className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground font-bold text-xs px-4 shrink-0 shadow-lg shadow-success/20">
                            <Receipt className="h-3.5 w-3.5" /> Receber
                          </Button>
                        )}
                        {conta.status === 'pago' && conta.forma_pagamento && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {FORMAS_PAGAMENTO.find(f => f.value === conta.forma_pagamento)?.label}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Nova Conta Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
            <DialogDescription>Cadastre uma nova receita ou recebimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Paciente *</Label>
              <Select value={formData.paciente_id} onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                    <SelectItem value="procedimento">Procedimento</SelectItem>
                    <SelectItem value="exame">Exame</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição do serviço..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input type="number" step="0.01" value={formData.valor || ''} onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vencimento *</Label>
                <Input type="date" value={formData.data_vencimento} onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dar Baixa Dialog */}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Receipt className="h-5 w-5" /> Confirmar Recebimento
            </DialogTitle>
            <DialogDescription>Registre o pagamento desta conta.</DialogDescription>
          </DialogHeader>
          {selectedConta && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{getPacienteNome(selectedConta)}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedConta.descricao}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <span className="text-lg font-black tabular-nums">{fmt(selectedConta.valor)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider">Forma de Pagamento</Label>
                <Select value={baixaData.forma_pagamento} onValueChange={(v) => setBaixaData({ ...baixaData, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Desconto (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={baixaData.desconto || ''} onChange={(e) => setBaixaData({ ...baixaData, desconto: parseFloat(e.target.value) || 0 })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Acréscimo (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={baixaData.acrescimo || ''} onChange={(e) => setBaixaData({ ...baixaData, acrescimo: parseFloat(e.target.value) || 0 })} className="h-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea value={baixaData.observacoes} onChange={(e) => setBaixaData({ ...baixaData, observacoes: e.target.value })} placeholder="Observações opcionais..." rows={2} className="resize-none" />
              </div>

              <div className="rounded-xl bg-success/5 border border-success/20 p-4 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider text-success">Total</span>
                <span className="text-2xl font-black text-success tabular-nums">{fmt(valorFinal)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleConfirmarBaixa} disabled={isSubmitting}
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/25">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}