import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Lock, Unlock, Plus, Minus, Loader2, AlertCircle, Trash2, Search, ArrowUp, ArrowDown, Clock, Calendar, Printer, Download,
} from 'lucide-react';
import { printReceiptPdf, downloadReceiptPdf, type ReceiptData } from '@/lib/pdfReceipt';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LancamentoTipo = 'receita' | 'despesa' | 'sangria' | 'suprimento';
type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'cartao_credito' | 'cartao_debito' | 'cheque' | 'transferencia';

interface Lancamento {
  id: string;
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  categoria: string;
  caixa_diario_id: string | null;
  created_at: string;
}

interface CaixaDiario {
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

export default function CaixaDiario() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // ─── States ─────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [showAbertura, setShowAbertura] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showLancamento, setShowLancamento] = useState(false);
  const [showSangria, setShowSangria] = useState(false);
  const [showSuprimento, setShowSuprimento] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');

  const [lancamentoForm, setLancamentoForm] = useState({
    tipo: 'receita' as LancamentoTipo,
    valor: '',
    descricao: '',
    forma_pagamento: 'dinheiro' as FormaPagamento,
  });

  const [sangriaForm, setSangriaForm] = useState({ valor: '', motivo: '' });
  const [suprimentoForm, setSuprimentoForm] = useState({ valor: '', descricao: '' });

  // ─── Queries ────────────────────────────────────
  const { data: caixaHoje, refetch: refetchCaixa } = useQuery({
    queryKey: ['caixa-hoje', today, profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return null;
      const { data } = await supabase
        .from('caixa_diario')
        .select('*')
        .eq('data', today)
        .eq('clinica_id', profile.clinica_id)
        .maybeSingle();
      return data as CaixaDiario | null;
    },
    enabled: !!profile?.clinica_id,
  });

  const { data: lancamentos = [], refetch: refetchLancamentos } = useQuery({
    queryKey: ['lancamentos-caixa', caixaHoje?.id, profile?.clinica_id],
    queryFn: async () => {
      if (!caixaHoje?.id) return [];
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('caixa_diario_id', caixaHoje.id)
        .in('tipo', ['receita', 'despesa', 'sangria', 'suprimento'])
        .order('created_at', { ascending: false });
      return (data || []) as Lancamento[];
    },
    enabled: !!caixaHoje?.id,
  });

  // ─── Calculations ───────────────────────────────
  const totalReceita = lancamentos
    .filter((l) => l.tipo === 'receita')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const totalDespesa = lancamentos
    .filter((l) => l.tipo === 'despesa')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const totalSangria = lancamentos
    .filter((l) => l.tipo === 'sangria')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const totalSuprimento = lancamentos
    .filter((l) => l.tipo === 'suprimento')
    .reduce((sum, l) => sum + (l.valor || 0), 0);

  const saldoLiquido = totalReceita - totalDespesa - totalSangria - totalSuprimento;
  const saldoFinal = (caixaHoje?.valor_abertura || 0) + saldoLiquido;

  // Breakdown por forma de pagamento
  const breakdownFormas = {
    dinheiro: lancamentos
      .filter((l) => l.tipo === 'receita' && l.forma_pagamento === 'dinheiro')
      .reduce((sum, l) => sum + (l.valor || 0), 0),
    pix: lancamentos
      .filter((l) => l.tipo === 'receita' && l.forma_pagamento === 'pix')
      .reduce((sum, l) => sum + (l.valor || 0), 0),
    credito: lancamentos
      .filter(
        (l) =>
          l.tipo === 'receita' &&
          (l.forma_pagamento === 'credito' || l.forma_pagamento === 'cartao_credito')
      )
      .reduce((sum, l) => sum + (l.valor || 0), 0),
    debito: lancamentos
      .filter(
        (l) =>
          l.tipo === 'receita' &&
          (l.forma_pagamento === 'debito' || l.forma_pagamento === 'cartao_debito')
      )
      .reduce((sum, l) => sum + (l.valor || 0), 0),
  };

  const lancamentosFiltrados = lancamentos.filter(
    (l) =>
      l.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Mutations ──────────────────────────────────
  const abrirCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (valor < 0) throw new Error('Valor não pode ser negativo');

      const { data, error } = await supabase
        .from('caixa_diario')
        .insert({
          data: today,
          aberto: true,
          valor_abertura: valor,
          operador_abertura: profile?.nome,
          clinica_id: profile.clinica_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Caixa aberto com sucesso!');
      setShowAbertura(false);
      setValorAbertura('');
      queryClient.invalidateQueries({ queryKey: ['caixa-hoje'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!caixaHoje) throw new Error('Caixa não encontrado');
      if (valor < 0) throw new Error('Valor não pode ser negativo');

      const { data, error } = await supabase
        .from('caixa_diario')
        .update({
          aberto: false,
          valor_fechamento: valor,
          operador_fechamento: profile?.nome,
        })
        .eq('id', caixaHoje.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Caixa fechado com sucesso!');
      setShowFechamento(false);
      setValorFechamento('');
      queryClient.invalidateQueries({ queryKey: ['caixa-hoje'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const adicionarLancamentoMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (!caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!lancamentoForm.valor || Number(lancamentoForm.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!lancamentoForm.descricao.trim()) {
        throw new Error('Descrição é obrigatória');
      }

      const { error } = await supabase.from('lancamentos').insert({
        tipo: lancamentoForm.tipo,
        valor: Number(lancamentoForm.valor),
        descricao: lancamentoForm.descricao,
        forma_pagamento: lancamentoForm.forma_pagamento,
        categoria: 'geral',
        caixa_diario_id: caixaHoje.id,
        clinica_id: profile.clinica_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Lançamento registrado!');
      setShowLancamento(false);
      setLancamentoForm({ tipo: 'receita', valor: '', descricao: '', forma_pagamento: 'dinheiro' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const adicionarSangriaMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (!caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!sangriaForm.valor || Number(sangriaForm.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!sangriaForm.motivo.trim()) {
        throw new Error('Informe o motivo');
      }

      const { error } = await supabase.from('lancamentos').insert({
        tipo: 'sangria',
        valor: Number(sangriaForm.valor),
        descricao: `Sangria - ${sangriaForm.motivo}`,
        forma_pagamento: 'dinheiro',
        categoria: 'sangria',
        caixa_diario_id: caixaHoje.id,
        clinica_id: profile.clinica_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Sangria registrada!');
      setShowSangria(false);
      setSangriaForm({ valor: '', motivo: '' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const adicionarSuprimentoMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (!caixaHoje?.id) throw new Error('Caixa não está aberto');
      if (!suprimentoForm.valor || Number(suprimentoForm.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const { error } = await supabase.from('lancamentos').insert({
        tipo: 'suprimento',
        valor: Number(suprimentoForm.valor),
        descricao: suprimentoForm.descricao || 'Suprimento',
        forma_pagamento: 'dinheiro',
        categoria: 'suprimento',
        caixa_diario_id: caixaHoje.id,
        clinica_id: profile.clinica_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Suprimento adicionado!');
      setShowSuprimento(false);
      setSuprimentoForm({ valor: '', descricao: '' });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const deletarLancamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Lançamento deletado!');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['lancamentos-caixa'] });
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  // ─── Helpers ────────────────────────────────────
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTipoBadge = (tipo: LancamentoTipo) => {
    const styles = {
      receita: 'bg-green-100 text-green-800',
      despesa: 'bg-red-100 text-red-800',
      sangria: 'bg-orange-100 text-orange-800',
      suprimento: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      receita: '💰 Receita',
      despesa: '💸 Despesa',
      sangria: '🔴 Sangria',
      suprimento: '📦 Suprimento',
    };
    return (
      <Badge className={styles[tipo]}>
        {labels[tipo]}
      </Badge>
    );
  };

  const buildReceiptData = (lancamento: Lancamento): ReceiptData => ({
    titulo: 'COMPROVANTE DE PAGAMENTO',
    dataHora: formatTime(lancamento.created_at),
    docId: lancamento.id.slice(0, 8).toUpperCase(),
    paciente: 'Paciente',
    descricao: lancamento.descricao || 'Serviço/Consulta',
    formaPagamento: lancamento.forma_pagamento.replace('cartao_', ''),
    valorOriginal: lancamento.valor,
    valorFinal: lancamento.valor,
  });

  const handlePrintRecibo = async (lancamento: Lancamento) => {
    try {
      const receiptData = buildReceiptData(lancamento);
      printReceiptPdf(receiptData);
    } catch (err: any) {
      toast.error('Erro ao imprimir recibo');
    }
  };

  const handleDownloadRecibo = async (lancamento: Lancamento) => {
    try {
      const receiptData = buildReceiptData(lancamento);
      downloadReceiptPdf(receiptData);
    } catch (err: any) {
      toast.error('Erro ao baixar recibo');
    }
  };

  // ─── Render ─────────────────────────────────────
  if (!profile?.clinica_id) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Caixa Diário</h1>
        <div className="flex items-center gap-2">
          {caixaHoje?.aberto ? (
            <Badge className="bg-green-100 text-green-800 gap-1">
              <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
              Aberto
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-600" />
              Fechado
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!caixaHoje?.aberto ? (
          <Dialog open={showAbertura} onOpenChange={setShowAbertura}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abrir Caixa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder="Valor inicial"
                  value={valorAbertura}
                  onChange={(e) => setValorAbertura(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    const valor = parseFloat(valorAbertura) || 0;
                    abrirCaixaMutation.mutate(valor);
                  }}
                  disabled={abrirCaixaMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {abrirCaixaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Abrir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Button
              onClick={() => setShowAbertura(false) || setShowLancamento(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>

            <Button
              onClick={() => setShowSangria(true)}
              variant="outline"
              className="gap-2 text-orange-600"
            >
              Sangria
            </Button>

            <Button
              onClick={() => setShowSuprimento(true)}
              variant="outline"
              className="gap-2 text-blue-600"
            >
              Suprimento
            </Button>

            <Button
              onClick={() => setShowFechamento(true)}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              <Lock className="h-4 w-4" />
              Fechar Caixa
            </Button>
          </>
        )}
      </div>

      {/* Summary Cards */}
      {caixaHoje?.aberto && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceita)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesa)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sangrias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSangria)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Suprimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSuprimento)}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Líquido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldoLiquido)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Method Breakdown */}
      {caixaHoje?.aberto && totalReceita > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Dinheiro</p>
                <p className="text-xl font-semibold">{formatCurrency(breakdownFormas.dinheiro)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PIX</p>
                <p className="text-xl font-semibold">{formatCurrency(breakdownFormas.pix)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Crédito</p>
                <p className="text-xl font-semibold">{formatCurrency(breakdownFormas.credito)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Débito</p>
                <p className="text-xl font-semibold">{formatCurrency(breakdownFormas.debito)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Caixa Info */}
      {caixaHoje && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data</p>
                <p className="font-semibold">{new Date(caixaHoje.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-gray-600">Abertura</p>
                <p className="font-semibold">{formatCurrency(caixaHoje.valor_abertura)}</p>
              </div>
              <div>
                <p className="text-gray-600">Saldo Final (Teórico)</p>
                <p className="font-semibold">{formatCurrency(saldoFinal)}</p>
              </div>
              {caixaHoje.operador_fechamento && (
                <div>
                  <p className="text-gray-600">Operador Fechamento</p>
                  <p className="font-semibold">{caixaHoje.operador_fechamento}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lançamentos Table */}
      {caixaHoje?.aberto && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lançamentos</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-8 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lancamentosFiltrados.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum lançamento</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentosFiltrados.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell>{getTipoBadge(lancamento.tipo)}</TableCell>
                      <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {lancamento.forma_pagamento.replace('cartao_', '')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatTime(lancamento.created_at)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {lancamento.tipo === 'receita' || lancamento.tipo === 'suprimento' ? '+' : '−'}
                        {formatCurrency(lancamento.valor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {lancamento.tipo === 'receita' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Imprimir recibo"
                                onClick={() => handlePrintRecibo(lancamento)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Baixar recibo"
                                onClick={() => handleDownloadRecibo(lancamento)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <AlertDialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setConfirmDelete(lancamento.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Novo Lançamento */}
      <Dialog open={showLancamento} onOpenChange={setShowLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={lancamentoForm.tipo} onValueChange={(val) =>
              setLancamentoForm({ ...lancamentoForm, tipo: val as LancamentoTipo })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Descrição"
              value={lancamentoForm.descricao}
              onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Valor"
              value={lancamentoForm.valor}
              onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })}
              step="0.01"
              min="0"
            />
            <Select value={lancamentoForm.forma_pagamento} onValueChange={(val) =>
              setLancamentoForm({ ...lancamentoForm, forma_pagamento: val as FormaPagamento })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credito">Cartão de Crédito</SelectItem>
                <SelectItem value="debito">Cartão de Débito</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => adicionarLancamentoMutation.mutate()} disabled={adicionarLancamentoMutation.isPending}>
              {adicionarLancamentoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Sangria */}
      <Dialog open={showSangria} onOpenChange={setShowSangria}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Sangria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Valor"
              value={sangriaForm.valor}
              onChange={(e) => setSangriaForm({ ...sangriaForm, valor: e.target.value })}
              step="0.01"
              min="0"
            />
            <Input
              placeholder="Motivo (obrigatório)"
              value={sangriaForm.motivo}
              onChange={(e) => setSangriaForm({ ...sangriaForm, motivo: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => adicionarSangriaMutation.mutate()} disabled={adicionarSangriaMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
              {adicionarSangriaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Suprimento */}
      <Dialog open={showSuprimento} onOpenChange={setShowSuprimento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Suprimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Valor"
              value={suprimentoForm.valor}
              onChange={(e) => setSuprimentoForm({ ...suprimentoForm, valor: e.target.value })}
              step="0.01"
              min="0"
            />
            <Input
              placeholder="Descrição"
              value={suprimentoForm.descricao}
              onChange={(e) => setSuprimentoForm({ ...suprimentoForm, descricao: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => adicionarSuprimentoMutation.mutate()} disabled={adicionarSuprimentoMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {adicionarSuprimentoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Fechar Caixa */}
      <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Valor de Abertura</p>
                <p className="text-lg font-semibold">{formatCurrency(caixaHoje?.valor_abertura || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-lg font-semibold text-green-600">+{formatCurrency(totalReceita)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-lg font-semibold text-red-600">−{formatCurrency(totalDespesa)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sangrias</p>
                <p className="text-lg font-semibold text-orange-600">−{formatCurrency(totalSangria)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Suprimentos</p>
                <p className="text-lg font-semibold text-blue-600">−{formatCurrency(totalSuprimento)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Final (Teórico)</p>
                <p className="text-lg font-bold">{formatCurrency(saldoFinal)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Valor Contado no Caixa</label>
              <Input
                type="number"
                placeholder="Digite o valor contado"
                value={valorFechamento}
                onChange={(e) => setValorFechamento(e.target.value)}
                step="0.01"
                min="0"
              />
              {valorFechamento && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Diferença</p>
                  <p className={`text-lg font-semibold ${parseFloat(valorFechamento) === saldoFinal ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(parseFloat(valorFechamento) - saldoFinal)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => fecharCaixaMutation.mutate(parseFloat(valorFechamento))} disabled={fecharCaixaMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {fecharCaixaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Fechar Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert: Confirmar Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deletarLancamentoMutation.mutate(confirmDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
