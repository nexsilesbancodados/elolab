import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Check, Send, DollarSign, AlertCircle, Receipt, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePacientes } from '@/hooks/useSupabaseData';
import { Database } from '@/integrations/supabase/types';

type StatusPagamento = Database['public']['Enums']['status_pagamento'];

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  atrasado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelado: 'bg-muted text-muted-foreground',
  estornado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'convenio', label: 'Convênio' },
  { value: 'transferencia', label: 'Transferência Bancária' },
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

const initialFormData: FormData = {
  paciente_id: '',
  categoria: 'consulta',
  descricao: '',
  valor: 0,
  data_vencimento: format(new Date(), 'yyyy-MM-dd'),
  forma_pagamento: 'pix',
};

const initialBaixaData: BaixaData = {
  forma_pagamento: 'pix',
  data_recebimento: format(new Date(), 'yyyy-MM-dd'),
  desconto: 0,
  acrescimo: 0,
  observacoes: '',
};

export default function ContasReceber() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [baixaData, setBaixaData] = useState<BaixaData>(initialBaixaData);
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
    total: contas.filter(c => c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0),
    pendente: contas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0),
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + c.valor, 0),
    pago: contas.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0),
  }), [contas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPacienteNome = (conta: any) => {
    return conta.pacientes?.nome || 'Desconhecido';
  };

  const handleNew = () => {
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        tipo: 'receita',
        categoria: formData.categoria,
        descricao: formData.descricao,
        valor: formData.valor,
        data: new Date().toISOString().split('T')[0],
        data_vencimento: formData.data_vencimento,
        status: 'pendente' as StatusPagamento,
        paciente_id: formData.paciente_id,
        forma_pagamento: formData.forma_pagamento || null,
      };

      const { error } = await supabase.from('lancamentos').insert(dataToSave);
      if (error) throw error;
      
      toast.success('Conta cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDarBaixa = (conta: any) => {
    setSelectedConta(conta);
    setBaixaData({
      ...initialBaixaData,
      forma_pagamento: conta.forma_pagamento || 'pix',
    });
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
      const { error } = await supabase
        .from('lancamentos')
        .update({ 
          status: 'pago' as StatusPagamento,
          forma_pagamento: baixaData.forma_pagamento,
          observacoes: baixaData.observacoes || null,
        })
        .eq('id', selectedConta.id);

      if (error) throw error;
      
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <div>
            <p className="font-semibold">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">
              {getPacienteNome(selectedConta)} — {formatCurrency(valorFinal)}
            </p>
          </div>
        </div>
      );
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsPagamentoOpen(false);
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error(error.message || 'Erro ao confirmar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e recebimentos</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendente)}</p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.atrasado)}</p>
                <p className="text-sm text-muted-foreground">Atrasado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.pago)}</p>
                <p className="text-sm text-muted-foreground">Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Contas ({filteredContas.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conta encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{getPacienteNome(conta)}</TableCell>
                      <TableCell>
                        <div>
                          <span>{conta.descricao}</span>
                          {conta.forma_pagamento && conta.status === 'pago' && (
                            <p className="text-xs text-muted-foreground">
                              {FORMAS_PAGAMENTO.find(f => f.value === conta.forma_pagamento)?.label || conta.forma_pagamento}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {conta.data_vencimento && format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[conta.status || 'pendente'])}>
                          {STATUS_LABELS[conta.status || 'pendente']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(conta.status === 'pendente' || conta.status === 'atrasado') && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleDarBaixa(conta)}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Dar Baixa
                          </Button>
                        )}
                        {conta.status === 'pago' && (
                          <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                            <Check className="h-3.5 w-3.5" /> Pago
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Nova Conta Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id}
                onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(v) => setFormData({ ...formData, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do serviço..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              Salvar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DAR BAIXA Dialog */}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Dar Baixa — Confirmar Recebimento
            </DialogTitle>
          </DialogHeader>
          
          {selectedConta && (
            <div className="space-y-4 py-2">
              {/* Resumo da conta */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="font-semibold text-foreground">{getPacienteNome(selectedConta)}</p>
                <p className="text-sm text-muted-foreground">{selectedConta.descricao}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">
                    Venc.: {selectedConta.data_vencimento ? format(new Date(selectedConta.data_vencimento), 'dd/MM/yyyy') : '—'}
                  </span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(selectedConta.valor)}</span>
                </div>
              </div>

              <Separator />

              {/* Forma de pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select
                  value={baixaData.forma_pagamento}
                  onValueChange={(v) => setBaixaData({ ...baixaData, forma_pagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data recebimento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Data do Recebimento
                </Label>
                <Input
                  type="date"
                  value={baixaData.data_recebimento}
                  onChange={(e) => setBaixaData({ ...baixaData, data_recebimento: e.target.value })}
                />
              </div>

              {/* Desconto / Acréscimo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-green-600">Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baixaData.desconto || ''}
                    onChange={(e) => setBaixaData({ ...baixaData, desconto: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-destructive">Acréscimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baixaData.acrescimo || ''}
                    onChange={(e) => setBaixaData({ ...baixaData, acrescimo: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Valor final */}
              <div className="rounded-lg border-2 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Valor Final a Receber</span>
                <span className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(valorFinal)}</span>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={baixaData.observacoes}
                  onChange={(e) => setBaixaData({ ...baixaData, observacoes: e.target.value })}
                  placeholder="Ex: Pagou com PIX na hora da consulta..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton 
              onClick={handleConfirmarBaixa} 
              isLoading={isSubmitting} 
              loadingText="Confirmando..."
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <Check className="h-4 w-4" />
              Confirmar Recebimento
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
