import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLancamentos } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { DeleteConfirmDialog } from '@/components/ConfirmDialog';
import { Database } from '@/integrations/supabase/types';

type StatusPagamento = Database['public']['Enums']['status_pagamento'];

const STATUS_COLORS: Record<StatusPagamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  estornado: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  atrasado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const STATUS_LABELS: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
  atrasado: 'Atrasado',
};

const CATEGORIAS_RECEITA = ['consulta', 'exame', 'procedimento', 'retorno', 'outros'];
const CATEGORIAS_DESPESA = ['aluguel', 'salarios', 'material', 'equipamentos', 'servicos', 'impostos', 'outros'];

interface FormData {
  id?: string;
  tipo: 'receita' | 'despesa';
  data: string;
  valor: number;
  categoria: string;
  descricao: string;
  status: StatusPagamento;
  forma_pagamento?: string;
}

export default function Financeiro() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    tipo: 'receita',
    data: format(new Date(), 'yyyy-MM-dd'),
    valor: 0,
    categoria: '',
    descricao: '',
    status: 'pendente',
  });
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('mes_atual');
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const { data: lancamentos = [], isLoading } = useLancamentos();

  const filteredLancamentos = useMemo(() => {
    let filtered = [...lancamentos];

    if (filterTipo !== 'todos') {
      filtered = filtered.filter((l) => l.tipo === filterTipo);
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfMonth(now);

    switch (filterPeriodo) {
      case 'mes_atual':
        startDate = startOfMonth(now);
        break;
      case 'mes_anterior':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'ultimos_3_meses':
        startDate = startOfMonth(subMonths(now, 2));
        break;
      default:
        startDate = startOfMonth(now);
    }

    filtered = filtered.filter((l) => {
      const data = new Date(l.data);
      return data >= startDate && data <= endDate;
    });

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [lancamentos, filterTipo, filterPeriodo]);

  const totais = useMemo(() => {
    const receitas = filteredLancamentos
      .filter((l) => l.tipo === 'receita' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const despesas = filteredLancamentos
      .filter((l) => l.tipo === 'despesa' && l.status === 'pago')
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const pendentes = filteredLancamentos
      .filter((l) => l.status === 'pendente')
      .reduce((acc, l) => acc + Number(l.valor), 0);

    return { receitas, despesas, saldo: receitas - despesas, pendentes };
  }, [filteredLancamentos]);

  const handleNew = (tipo: 'receita' | 'despesa') => {
    setSelectedId(null);
    setFormData({
      tipo,
      data: format(new Date(), 'yyyy-MM-dd'),
      valor: 0,
      categoria: '',
      descricao: '',
      status: 'pendente',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (lancamento: typeof lancamentos[0]) => {
    setSelectedId(lancamento.id);
    setFormData({
      id: lancamento.id,
      tipo: lancamento.tipo as 'receita' | 'despesa',
      data: lancamento.data,
      valor: Number(lancamento.valor),
      categoria: lancamento.categoria,
      descricao: lancamento.descricao,
      status: (lancamento.status || 'pendente') as StatusPagamento,
      forma_pagamento: lancamento.forma_pagamento || undefined,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', selectedId);

      if (error) throw error;

      toast.success('Lançamento excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir lançamento.');
    } finally {
      setIsSaving(false);
      setIsDeleteOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.categoria || !formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedId) {
        const { error } = await supabase
          .from('lancamentos')
          .update({
            tipo: formData.tipo,
            data: formData.data,
            valor: formData.valor,
            categoria: formData.categoria,
            descricao: formData.descricao,
            status: formData.status,
            forma_pagamento: formData.forma_pagamento,
          })
          .eq('id', selectedId);

        if (error) throw error;
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('lancamentos')
          .insert({
            tipo: formData.tipo,
            data: formData.data,
            valor: formData.valor,
            categoria: formData.categoria,
            descricao: formData.descricao,
            status: formData.status,
            forma_pagamento: formData.forma_pagamento,
          });

        if (error) throw error;
        toast.success('Lançamento criado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar lançamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle de receitas e despesas</p>
          </div>
        </div>
        <CardGridSkeleton count={4} />
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} cols={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleNew('despesa')} className="gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Nova Despesa
          </Button>
          <Button onClick={() => handleNew('receita')} className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totais.receitas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totais.despesas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    totais.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatCurrency(totais.saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(totais.pendentes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lançamentos</CardTitle>
            <div className="flex gap-2">
              <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as any)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLancamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum lançamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLancamentos.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell>{format(new Date(lancamento.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {lancamento.tipo === 'receita' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{lancamento.categoria}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {lancamento.descricao}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'font-medium',
                          lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {lancamento.tipo === 'despesa' && '-'}
                        {formatCurrency(Number(lancamento.valor))}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[lancamento.status || 'pendente'])}>
                          {STATUS_LABELS[lancamento.status || 'pendente']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lancamento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(lancamento.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedId
                ? 'Editar Lançamento'
                : `Nova ${formData.tipo === 'receita' ? 'Receita' : 'Despesa'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data || ''}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(v) => setFormData({ ...formData, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(
                    (cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o lançamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={formData.forma_pagamento || ''}
                  onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as StatusPagamento })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        itemName="este lançamento"
        onConfirm={handleDelete}
        isLoading={isSaving}
      />
    </div>
  );
}
