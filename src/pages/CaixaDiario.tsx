import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn, sanitizeText } from '@/lib/utils';
import {
  Banknote, CreditCard, QrCode, Lock, LockOpen,
  Plus, Minus, Loader2, AlertCircle, Trash2, Edit2, TrendingUp, Search,
  DollarSign, ArrowUp, ArrowDown, Clock, Calendar,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function CaixaDiario({ onOpenCaixa }: { onOpenCaixa?: () => void } = {}) {
  const queryClient = useQueryClient();
  const { profile } = useSupabaseAuth();
  const hoje = format(new Date(), 'yyyy-MM-dd');

  // ─── States ─────────────────────────────────────
  const [showAbertura, setShowAbertura] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showLancamento, setShowLancamento] = useState(false);
  const [showSangria, setShowSangria] = useState(false);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [lancamentoForm, setLancamentoForm] = useState({
    tipo: 'receita' as 'receita' | 'despesa',
    valor: '',
    descricao: '',
    forma_pagamento: 'dinheiro',
  });
  const [sangriaForm, setSangriaForm] = useState({ valor: '', motivo: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────
  const { data: caixaHoje, isLoading: loadingCaixa, refetch: refetchCaixa } = useQuery({
    queryKey: ['caixa-hoje', hoje, profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return null;
      const { data } = await supabase
        .from('caixa_diario')
        .select('*')
        .eq('data', hoje)
        .eq('clinica_id', profile.clinica_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.clinica_id,
  });

  const { data: lancamentos = [], refetch: refetchLancamentos } = useQuery({
    queryKey: ['lancamentos-caixa', hoje, profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return [];
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('data', hoje)
        .eq('clinica_id', profile.clinica_id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.clinica_id,
  });

  // ─── Calculations ───────────────────────────────
  const totalReceita = lancamentos
    .filter((l: any) => l.tipo === 'receita')
    .reduce((sum, l: any) => sum + (l.valor || 0), 0);

  const totalDespesa = lancamentos
    .filter((l: any) => l.tipo === 'despesa')
    .reduce((sum, l: any) => sum + (l.valor || 0), 0);

  const totalSangria = lancamentos
    .filter((l: any) => l.tipo === 'sangria')
    .reduce((sum, l: any) => sum + (l.valor || 0), 0);

  const totalSuprimento = lancamentos
    .filter((l: any) => l.tipo === 'suprimento')
    .reduce((sum, l: any) => sum + (l.valor || 0), 0);

  const saldoTotal = totalReceita - totalDespesa - totalSangria + totalSuprimento;
  const diferenca = caixaHoje ? saldoTotal - caixaHoje.valor_abertura : 0;

  // ─── Mutations ──────────────────────────────────
  const abrirCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (valor <= 0) throw new Error('Valor deve ser maior que zero');

      const { data, error } = await supabase
        .from('caixa_diario')
        .insert([{
          data: hoje,
          aberto: true,
          valor_abertura: valor,
          operador: profile?.email,
          clinica_id: profile.clinica_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Caixa aberto com sucesso!');
      setShowAbertura(false);
      setValorAbertura('');
      refetchCaixa();
      onOpenCaixa?.();
    },
    onError: (error: any) => {
      console.error('Erro ao abrir caixa:', error);
      toast.error('❌ Erro: ' + (error?.message || 'Erro desconhecido'));
    },
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!caixaHoje) throw new Error('Caixa não encontrado');
      if (valor <= 0) throw new Error('Valor deve ser maior que zero');

      const { data, error } = await supabase
        .from('caixa_diario')
        .update({
          aberto: false,
          valor_fechamento: valor,
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
      refetchCaixa();
    },
    onError: (error: any) => {
      toast.error('❌ Erro: ' + (error?.message || 'Erro desconhecido'));
    },
  });

  const adicionarLancamentoMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (!lancamentoForm.valor || Number(lancamentoForm.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!lancamentoForm.descricao.trim()) {
        throw new Error('Descrição é obrigatória');
      }

      const { data, error } = await supabase
        .from('lancamentos')
        .insert([{
          tipo: lancamentoForm.tipo,
          valor: Number(lancamentoForm.valor),
          descricao: sanitizeText(lancamentoForm.descricao) || 'Sem descrição',
          forma_pagamento: lancamentoForm.forma_pagamento,
          data: hoje,
          clinica_id: profile.clinica_id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Lançamento registrado!');
      setShowLancamento(false);
      setLancamentoForm({ tipo: 'receita', valor: '', descricao: '', forma_pagamento: 'dinheiro' });
      refetchLancamentos();
    },
    onError: (error: any) => {
      toast.error('❌ Erro: ' + (error?.message || 'Erro desconhecido'));
    },
  });

  const adicionarSangriaMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');
      if (!sangriaForm.valor || Number(sangriaForm.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!sangriaForm.motivo.trim() || sangriaForm.motivo.trim().length < 3) {
        throw new Error('Informe o motivo (mínimo 3 caracteres)');
      }
      if (Number(sangriaForm.valor) > saldoTotal) {
        throw new Error(`Sangria não pode ser maior que o saldo (R$ ${saldoTotal.toFixed(2)})`);
      }

      const { data, error } = await supabase
        .from('lancamentos')
        .insert([{
          tipo: 'sangria',
          valor: Number(sangriaForm.valor),
          descricao: `Sangria - ${sanitizeText(sangriaForm.motivo)}`,
          forma_pagamento: 'dinheiro',
          data: hoje,
          clinica_id: profile.clinica_id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Sangria registrada!');
      setShowSangria(false);
      setSangriaForm({ valor: '', motivo: '' });
      refetchLancamentos();
    },
    onError: (error: any) => {
      toast.error('❌ Erro: ' + (error?.message || 'Erro desconhecido'));
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
      refetchLancamentos();
    },
    onError: (error: any) => {
      toast.error('❌ Erro: ' + (error?.message || 'Erro desconhecido'));
    },
  });

  // ─── Render ─────────────────────────────────────
  if (!profile?.clinica_id) {
    return <div className="p-8 text-center">Carregando clínica...</div>;
  }

  return (
    <motion.div
      className="space-y-6 p-4 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Banknote className="w-8 h-8" /> Caixa Diário
          </h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {caixaHoje?.aberto ? (
            <Badge className="bg-green-600 hover:bg-green-700 h-fit">
              🟢 ABERTO
            </Badge>
          ) : (
            <Badge variant="destructive" className="h-fit">
              🔴 FECHADO
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {!caixaHoje?.aberto ? (
          <Button
            onClick={() => setShowAbertura(true)}
            size="lg"
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <LockOpen className="w-4 h-4" /> Abrir Caixa
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setShowLancamento(true)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Lançamento
            </Button>
            <Button
              onClick={() => setShowSangria(true)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Minus className="w-4 h-4" /> Sangria
            </Button>
            <Button
              onClick={() => setShowFechamento(true)}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Lock className="w-4 h-4" /> Fechar Caixa
            </Button>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-600" /> Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalReceita.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-red-600" /> Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              R$ {totalDespesa.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Minus className="w-4 h-4 text-orange-600" /> Sangria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              R$ {totalSangria.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-2',
          saldoTotal >= 0 ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              'text-3xl font-bold',
              saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              R$ {saldoTotal.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Caixa Info */}
      {caixaHoje && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Abertura do Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Abertura</p>
                <p className="text-lg font-bold">R$ {caixaHoje.valor_abertura.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-lg font-bold">R$ {saldoTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diferença</p>
                <p className={cn('text-lg font-bold', diferenca >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {diferenca >= 0 ? '+' : ''}R$ {diferenca.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lançamentos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-left py-2 px-2">Descrição</th>
                  <th className="text-left py-2 px-2">Forma Pgto</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-center py-2 px-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhum lançamento hoje
                    </td>
                  </tr>
                ) : (
                  lancamentos.map((l: any) => (
                    <tr key={l.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">
                        <Badge variant={
                          l.tipo === 'receita' ? 'default' :
                          l.tipo === 'despesa' ? 'destructive' :
                          l.tipo === 'sangria' ? 'secondary' : 'outline'
                        }>
                          {l.tipo === 'receita' ? '➕' : l.tipo === 'despesa' ? '➖' : l.tipo === 'sangria' ? '💸' : '➕'} {l.tipo}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{l.descricao}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{l.forma_pagamento}</td>
                      <td className={cn('py-2 px-2 text-right font-bold',
                        l.tipo === 'receita' || l.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                      )}>
                        R$ {l.valor.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(l.id)}
                          disabled={deletarLancamentoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Abrir Caixa */}
      <Dialog open={showAbertura} onOpenChange={setShowAbertura}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockOpen className="w-5 h-5 text-green-600" /> Abrir Caixa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="valor-abertura">Valor de Abertura (R$)</Label>
              <Input
                id="valor-abertura"
                type="number"
                step="0.01"
                min="0"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbertura(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => abrirCaixaMutation.mutate(Number(valorAbertura))}
              disabled={abrirCaixaMutation.isPending || !valorAbertura}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {abrirCaixaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Abrindo...
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" /> Abrir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Fechar Caixa */}
      <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" /> Fechar Caixa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 bg-muted p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Saldo Total:</span>
              <span className="font-bold">R$ {saldoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diferença:</span>
              <span className={cn('font-bold', diferenca >= 0 ? 'text-green-600' : 'text-red-600')}>
                {diferenca >= 0 ? '+' : ''}R$ {diferenca.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="valor-fechamento">Valor Contado (R$)</Label>
            <Input
              id="valor-fechamento"
              type="number"
              step="0.01"
              min="0"
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFechamento(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => fecharCaixaMutation.mutate(Number(valorFechamento))}
              disabled={fecharCaixaMutation.isPending || !valorFechamento}
              variant="destructive"
              className="gap-2"
            >
              {fecharCaixaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Fechando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Fechar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo Lançamento */}
      <Dialog open={showLancamento} onOpenChange={setShowLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Novo Lançamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-2">
                {(['receita', 'despesa'] as const).map((tipo) => (
                  <Button
                    key={tipo}
                    variant={lancamentoForm.tipo === tipo ? 'default' : 'outline'}
                    onClick={() => setLancamentoForm({ ...lancamentoForm, tipo })}
                    className="flex-1"
                  >
                    {tipo === 'receita' ? '➕ Receita' : '➖ Despesa'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={lancamentoForm.descricao}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })}
                placeholder="Ex: Consulta, Medicamento..."
              />
            </div>

            <div>
              <Label htmlFor="valor-lancamento">Valor (R$)</Label>
              <Input
                id="valor-lancamento"
                type="number"
                step="0.01"
                min="0"
                value={lancamentoForm.valor}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="forma-pgto">Forma de Pagamento</Label>
              <select
                id="forma-pgto"
                value={lancamentoForm.forma_pagamento}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, forma_pagamento: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="pix">🔷 PIX</option>
                <option value="credito">💳 Crédito</option>
                <option value="debito">💳 Débito</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLancamento(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => adicionarLancamentoMutation.mutate()}
              disabled={adicionarLancamentoMutation.isPending}
              className="gap-2"
            >
              {adicionarLancamentoMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Sangria */}
      <Dialog open={showSangria} onOpenChange={setShowSangria}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-orange-600" /> Sangria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm"><strong>Saldo Disponível:</strong> R$ {saldoTotal.toFixed(2)}</p>
            </div>

            <div>
              <Label htmlFor="valor-sangria">Valor (R$)</Label>
              <Input
                id="valor-sangria"
                type="number"
                step="0.01"
                min="0"
                value={sangriaForm.valor}
                onChange={(e) => setSangriaForm({ ...sangriaForm, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="motivo-sangria">Motivo</Label>
              <Input
                id="motivo-sangria"
                value={sangriaForm.motivo}
                onChange={(e) => setSangriaForm({ ...sangriaForm, motivo: e.target.value })}
                placeholder="Ex: Retirada operacional, Adiantamento..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSangria(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => adicionarSangriaMutation.mutate()}
              disabled={adicionarSangriaMutation.isPending}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {adicionarSangriaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4" /> Registrar Sangria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert: Confirmar Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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
    </motion.div>
  );
}
