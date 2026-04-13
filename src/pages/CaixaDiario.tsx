import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Banknote, CreditCard, QrCode, Lock, LockOpen,
  Plus, Minus, Loader2, AlertCircle, Trash2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
];

interface Caixa {
  id: string;
  data: string;
  aberto: boolean;
  valor_abertura: number;
  valor_fechamento?: number;
  operador: string;
}

interface Lancamento {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  forma_pagamento: string;
  data: string;
}

export default function CaixaDiario() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [showAbertura, setShowAbertura] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showLancamento, setShowLancamento] = useState(false);
  const [viewMode, setViewMode] = useState<'resumo' | 'detalhes' | 'historico'>('resumo');
  const [valorAbertura, setValorAbertura] = useState(0);
  const [valorFechamento, setValorFechamento] = useState(0);
  const [lancamentoForm, setLancamentoForm] = useState({
    tipo: 'receita',
    valor: 0,
    descricao: '',
    forma_pagamento: 'dinheiro',
  });
  const [periodoBuscando, setPeriodoBuscando] = useState('mes');

  const { data: caixaHoje, isLoading: loadingCaixa, refetch: refetchCaixa } = useQuery({
    queryKey: ['caixa-hoje', hoje],
    queryFn: async () => {
      const { data } = await supabase
        .from('caixa_diario')
        .select('*')
        .eq('data', hoje)
        .eq('clinica_id', profile?.clinica_id)
        .maybeSingle();
      return data as Caixa | null;
    },
  });

  const { data: lancamentos = [], isLoading: loadingLancamentos, refetch: refetchLancamentos } = useQuery({
    queryKey: ['lancamentos-caixa', hoje],
    queryFn: async () => {
      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('data', hoje)
        .eq('clinica_id', profile?.clinica_id)
        .order('created_at', { ascending: false });
      return (data || []) as Lancamento[];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['caixa-historico', periodoBuscando],
    queryFn: async () => {
      let de = hoje;
      const agora = new Date();

      if (periodoBuscando === 'semana') {
        de = format(subDays(agora, 7), 'yyyy-MM-dd');
      } else if (periodoBuscando === 'mes') {
        de = format(startOfMonth(agora), 'yyyy-MM-dd');
      }

      const { data } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('clinica_id', profile?.clinica_id)
        .gte('data', de)
        .lte('data', hoje)
        .order('data', { ascending: false });

      return (data || []) as Lancamento[];
    },
  });

  const abrirCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      const { data, error } = await supabase
        .from('caixa_diario')
        .insert([{
          data: hoje,
          aberto: true,
          valor_abertura: valor,
          operador: profile?.email,
          clinica_id: profile?.clinica_id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Caixa aberto com sucesso!');
      setShowAbertura(false);
      setValorAbertura(0);
      refetchCaixa();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!caixaHoje) throw new Error('Caixa não encontrado');
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
      toast.success('Caixa fechado com sucesso!');
      setShowFechamento(false);
      setValorFechamento(0);
      refetchCaixa();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const adicionarLancamentoMutation = useMutation({
    mutationFn: async () => {
      if (lancamentoForm.valor <= 0) throw new Error('Valor deve ser maior que zero');
      const { data, error } = await supabase
        .from('lancamentos')
        .insert([{
          tipo: lancamentoForm.tipo,
          valor: lancamentoForm.valor,
          descricao: lancamentoForm.descricao,
          forma_pagamento: lancamentoForm.forma_pagamento,
          data: hoje,
          clinica_id: profile?.clinica_id,
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lançamento registrado!');
      setShowLancamento(false);
      setLancamentoForm({ tipo: 'receita', valor: 0, descricao: '', forma_pagamento: 'dinheiro' });
      refetchLancamentos();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
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
      toast.success('Lançamento deletado!');
      refetchLancamentos();
    },
  });

  const totaisPorForma = useMemo(() => {
    return FORMAS_PAGAMENTO.map(forma => ({
      ...forma,
      total: lancamentos
        .filter(l => l.forma_pagamento === forma.value && l.tipo === 'receita')
        .reduce((sum, l) => sum + l.valor, 0),
    }));
  }, [lancamentos]);

  const totalReceita = lancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesa = lancamentos
    .filter(l => l.tipo === 'despesa')
    .reduce((sum, l) => sum + l.valor, 0);

  const saldoTotal = totalReceita - totalDespesa;
  const diferenca = caixaHoje ? saldoTotal - caixaHoje.valor_abertura : 0;

  const dadosGrafico = useMemo(() => {
    const grupos: any = {};
    historico.forEach(l => {
      if (!grupos[l.data]) {
        grupos[l.data] = { data: format(new Date(l.data), 'dd/MM'), receita: 0, despesa: 0 };
      }
      if (l.tipo === 'receita') grupos[l.data].receita += l.valor;
      if (l.tipo === 'despesa') grupos[l.data].despesa += l.valor;
    });
    return Object.values(grupos).sort((a: any, b: any) => a.data.localeCompare(b.data));
  }, [historico]);

  if (!profile?.clinica_id) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caixa Diário</h1>
          <p className="text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex gap-2">
          {!caixaHoje?.aberto ? (
            <Button onClick={() => setShowAbertura(true)} className="gap-2">
              <LockOpen className="w-4 h-4" /> Abrir Caixa
            </Button>
          ) : (
            <Button onClick={() => setShowFechamento(true)} variant="destructive" className="gap-2">
              <Lock className="w-4 h-4" /> Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status do Caixa</span>
            <Badge variant={caixaHoje?.aberto ? 'default' : 'secondary'}>
              {caixaHoje?.aberto ? 'Aberto' : 'Fechado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Abertura</p>
              <p className="text-xl font-bold">R$ {(caixaHoje?.valor_abertura || 0).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Receita</p>
              <p className="text-xl font-bold text-green-600">+R$ {totalReceita.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Despesa</p>
              <p className="text-xl font-bold text-red-600">-R$ {totalDespesa.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {saldoTotal.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diferença</p>
              <p className={`text-xl font-bold ${diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diferenca >= 0 ? '+' : ''}R$ {diferenca.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="detalhes">Lançamentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totaisPorForma.map(forma => (
              <Card key={forma.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <forma.icon className="w-4 h-4" /> {forma.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">R$ {forma.total.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Períodos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['hoje', 'semana', 'mes'].map(p => (
                    <Button
                      key={p}
                      variant={periodoBuscando === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPeriodoBuscando(p)}
                    >
                      {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
                    </Button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="receita" fill="#22c55e" name="Receita" />
                    <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lançamentos de Hoje</h3>
            <Button onClick={() => setShowLancamento(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </Button>
          </div>

          {loadingLancamentos ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : lancamentos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-2" />
                Nenhum lançamento registrado hoje
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {lancamentos.map(l => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <p className="font-medium">{l.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {FORMAS_PAGAMENTO.find(f => f.value === l.forma_pagamento)?.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`text-lg font-bold ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {l.tipo === 'receita' ? '+' : '-'}R$ {l.valor.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletarLancamentoMutation.mutate(l.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="flex gap-2">
            {['hoje', 'semana', 'mes'].map(p => (
              <Button
                key={p}
                variant={periodoBuscando === p ? 'default' : 'outline'}
                onClick={() => setPeriodoBuscando(p)}
              >
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7 dias' : 'Mês'}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {historico.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum lançamento</p>
                ) : (
                  historico.map(l => (
                    <div key={l.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{l.descricao}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(l.data), 'dd/MM/yyyy')}</p>
                      </div>
                      <p className={`font-bold ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {l.tipo === 'receita' ? '+' : '-'}R$ {l.valor.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAbertura} onOpenChange={setShowAbertura}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="valor-abertura">Valor de Abertura (R$)</Label>
              <Input
                id="valor-abertura"
                type="number"
                step="0.01"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbertura(false)}>Cancelar</Button>
            <Button onClick={() => abrirCaixaMutation.mutate(valorAbertura)} disabled={abrirCaixaMutation.isPending}>
              {abrirCaixaMutation.isPending ? 'Abrindo...' : 'Abrir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFechamento} onOpenChange={setShowFechamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 bg-muted p-4 rounded">
            <div className="flex justify-between">
              <span>Saldo Total:</span>
              <span className="font-bold">R$ {saldoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diferença:</span>
              <span className={`font-bold ${diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              value={valorFechamento}
              onChange={(e) => setValorFechamento(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFechamento(false)}>Cancelar</Button>
            <Button onClick={() => fecharCaixaMutation.mutate(valorFechamento)} disabled={fecharCaixaMutation.isPending}>
              {fecharCaixaMutation.isPending ? 'Fechando...' : 'Fechar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLancamento} onOpenChange={setShowLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-2">
                {['receita', 'despesa'].map(tipo => (
                  <Button
                    key={tipo}
                    variant={lancamentoForm.tipo === tipo ? 'default' : 'outline'}
                    onClick={() => setLancamentoForm({ ...lancamentoForm, tipo })}
                    className="flex-1"
                  >
                    {tipo === 'receita' ? <Plus className="w-4 h-4 mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
                    {tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {FORMAS_PAGAMENTO.map(forma => (
                  <Button
                    key={forma.value}
                    variant={lancamentoForm.forma_pagamento === forma.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLancamentoForm({ ...lancamentoForm, forma_pagamento: forma.value })}
                    className="flex-col gap-1"
                  >
                    <forma.icon className="w-4 h-4" />
                    {forma.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={lancamentoForm.valor}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={lancamentoForm.descricao}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })}
                placeholder="Ex: Consulta, Taxa, etc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLancamento(false)}>Cancelar</Button>
            <Button onClick={() => adicionarLancamentoMutation.mutate()} disabled={adicionarLancamentoMutation.isPending}>
              {adicionarLancamentoMutation.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
