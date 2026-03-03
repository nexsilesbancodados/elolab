import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CreditCard, Link2, RefreshCw, Ban, ExternalLink, DollarSign, Repeat, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  aprovado: 'bg-green-500/10 text-green-700 border-green-300',
  rejeitado: 'bg-red-500/10 text-red-700 border-red-300',
  cancelado: 'bg-muted text-muted-foreground',
  reembolsado: 'bg-blue-500/10 text-blue-700 border-blue-300',
  em_processo: 'bg-orange-500/10 text-orange-700 border-orange-300',
  ativa: 'bg-green-500/10 text-green-700 border-green-300',
  pausada: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  finalizada: 'bg-muted text-muted-foreground',
};

export default function Pagamentos() {
  const queryClient = useQueryClient();
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showNewSubscription, setShowNewSubscription] = useState(false);

  // Fetch pagamentos
  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery({
    queryKey: ['pagamentos_mercadopago'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos_mercadopago' as any)
        .select('*, pacientes(nome)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch assinaturas
  const { data: assinaturas, isLoading: loadingAssinaturas } = useQuery({
    queryKey: ['assinaturas_mercadopago'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinaturas_mercadopago' as any)
        .select('*, pacientes(nome)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch pacientes for selectors
  const { data: pacientes } = useQuery({
    queryKey: ['pacientes_select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Create payment
  const createPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { action: 'create_preference', ...payload },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos_mercadopago'] });
      setShowNewPayment(false);
      toast.success('Link de pagamento gerado!');
      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  // Create subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { action: 'create_subscription', ...payload },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assinaturas_mercadopago'] });
      setShowNewSubscription(false);
      toast.success('Assinatura criada!');
      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  // Cancel subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ assinatura_id, mp_preapproval_id }: any) => {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
        body: { action: 'cancel_subscription', assinatura_id, mp_preapproval_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assinaturas_mercadopago'] });
      toast.success('Assinatura cancelada');
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const totalAprovado = pagamentos?.filter((p: any) => p.status === 'aprovado').reduce((acc: number, p: any) => acc + Number(p.valor_pago || p.valor), 0) || 0;
  const totalPendente = pagamentos?.filter((p: any) => p.status === 'pendente').reduce((acc: number, p: any) => acc + Number(p.valor), 0) || 0;
  const assinaturasAtivas = assinaturas?.filter((a: any) => a.status === 'ativa').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">Mercado Pago — Cobranças e Assinaturas</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAprovado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assinaturasAtivas}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pagamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pagamentos">
            <CreditCard className="h-4 w-4 mr-2" />
            Cobranças
          </TabsTrigger>
          <TabsTrigger value="assinaturas">
            <Repeat className="h-4 w-4 mr-2" />
            Assinaturas
          </TabsTrigger>
        </TabsList>

        {/* Cobranças Tab */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
              <DialogTrigger asChild>
                <Button>
                  <Link2 className="h-4 w-4 mr-2" />
                  Nova Cobrança
                </Button>
              </DialogTrigger>
              <DialogContent>
                <NewPaymentForm
                  pacientes={pacientes || []}
                  onSubmit={(data) => createPaymentMutation.mutate(data)}
                  loading={createPaymentMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loadingPagamentos ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : !pagamentos?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma cobrança encontrada</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {pagamentos.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{p.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.pacientes?.nome || 'Sem paciente'} • {p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                        </p>
                        <Badge variant="outline" className={statusColors[p.status] || ''}>
                          {p.status}
                        </Badge>
                      </div>
                      {p.checkout_url && p.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => window.open(p.checkout_url, '_blank')}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assinaturas Tab */}
        <TabsContent value="assinaturas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showNewSubscription} onOpenChange={setShowNewSubscription}>
              <DialogTrigger asChild>
                <Button>
                  <Repeat className="h-4 w-4 mr-2" />
                  Nova Assinatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <NewSubscriptionForm
                  pacientes={pacientes || []}
                  onSubmit={(data) => createSubscriptionMutation.mutate(data)}
                  loading={createSubscriptionMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loadingAssinaturas ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : !assinaturas?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma assinatura encontrada</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {assinaturas.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{a.nome_plano}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.pacientes?.nome || 'Sem paciente'} • {a.frequencia}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.valor)}
                          <span className="text-xs text-muted-foreground">/{a.frequencia === 'mensal' ? 'mês' : a.frequencia}</span>
                        </p>
                        <Badge variant="outline" className={statusColors[a.status] || ''}>
                          {a.status}
                        </Badge>
                      </div>
                      {a.status === 'ativa' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelSubscriptionMutation.mutate({ assinatura_id: a.id, mp_preapproval_id: a.mp_preapproval_id })}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                      {a.checkout_url && a.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => window.open(a.checkout_url, '_blank')}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewPaymentForm({ pacientes, onSubmit, loading }: { pacientes: any[]; onSubmit: (data: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ paciente_id: '', descricao: '', valor: '', parcelas_max: '12' });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Cobrança</DialogTitle>
        <DialogDescription>Gere um link de pagamento via Mercado Pago</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Paciente</Label>
          <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {pacientes.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Descrição</Label>
          <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Consulta médica" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150.00" />
          </div>
          <div>
            <Label>Parcelas máx.</Label>
            <Input type="number" value={form.parcelas_max} onChange={(e) => setForm({ ...form, parcelas_max: e.target.value })} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(form)} disabled={loading || !form.valor || !form.descricao}>
          {loading ? 'Gerando...' : 'Gerar Link de Pagamento'}
        </Button>
      </DialogFooter>
    </>
  );
}

function NewSubscriptionForm({ pacientes, onSubmit, loading }: { pacientes: any[]; onSubmit: (data: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ paciente_id: '', nome_plano: '', descricao: '', valor: '', frequencia: 'mensal' });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Assinatura</DialogTitle>
        <DialogDescription>Crie um plano recorrente via Mercado Pago</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Paciente</Label>
          <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {pacientes.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nome do Plano</Label>
          <Input value={form.nome_plano} onChange={(e) => setForm({ ...form, nome_plano: e.target.value })} placeholder="Ex: Plano Mensal Premium" />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do plano..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="199.90" />
          </div>
          <div>
            <Label>Frequência</Label>
            <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(form)} disabled={loading || !form.valor || !form.nome_plano}>
          {loading ? 'Criando...' : 'Criar Assinatura'}
        </Button>
      </DialogFooter>
    </>
  );
}
