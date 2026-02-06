import { useState, useMemo } from 'react';
import { Plus, Search, Check, Send, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

interface FormData {
  paciente_id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento: string;
}

const initialFormData: FormData = {
  paciente_id: '',
  categoria: 'consulta',
  descricao: '',
  valor: 0,
  data_vencimento: format(new Date(), 'yyyy-MM-dd'),
  forma_pagamento: 'pix',
};

export default function ContasReceber() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [pagamentoData, setPagamentoData] = useState({ forma_pagamento: 'pix' });
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
      
      // Check for overdue
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
    setSelectedId(null);
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

  const handlePagamento = (id: string) => {
    setSelectedId(id);
    setPagamentoData({ forma_pagamento: 'pix' });
    setIsPagamentoOpen(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({ 
          status: 'pago' as StatusPagamento,
          forma_pagamento: pagamentoData.forma_pagamento,
        })
        .eq('id', selectedId);

      if (error) throw error;
      
      toast.success('Pagamento registrado!');
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
                      <TableCell>{conta.descricao}</TableCell>
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
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePagamento(conta.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Receber
                          </Button>
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

      {/* Form Dialog */}
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

      {/* Payment Dialog */}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={pagamentoData.forma_pagamento}
                onValueChange={(v) => setPagamentoData({ ...pagamentoData, forma_pagamento: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleConfirmarPagamento} isLoading={isSubmitting} loadingText="Confirmando...">
              Confirmar Recebimento
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
