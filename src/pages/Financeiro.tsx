import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Lancamento, StatusPagamento } from '@/types';
import { getAll, generateId, remove } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_COLORS: Record<StatusPagamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  estornado: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

const CATEGORIAS_RECEITA = ['Consulta', 'Exame', 'Procedimento', 'Retorno', 'Outros'];
const CATEGORIAS_DESPESA = [
  'Aluguel',
  'Salários',
  'Material',
  'Equipamentos',
  'Serviços',
  'Impostos',
  'Outros',
];

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [formData, setFormData] = useState<Partial<Lancamento>>({});
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('mes_atual');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLancamentos(getAll<Lancamento>('lancamentos'));
  };

  const filteredLancamentos = useMemo(() => {
    let filtered = [...lancamentos];

    // Filter by type
    if (filterTipo !== 'todos') {
      filtered = filtered.filter((l) => l.tipo === filterTipo);
    }

    // Filter by period
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
      .reduce((acc, l) => acc + l.valor, 0);
    const despesas = filteredLancamentos
      .filter((l) => l.tipo === 'despesa' && l.status === 'pago')
      .reduce((acc, l) => acc + l.valor, 0);
    const pendentes = filteredLancamentos
      .filter((l) => l.status === 'pendente')
      .reduce((acc, l) => acc + l.valor, 0);

    return { receitas, despesas, saldo: receitas - despesas, pendentes };
  }, [filteredLancamentos]);

  const handleNew = (tipo: 'receita' | 'despesa') => {
    setSelectedLancamento(null);
    setFormData({
      tipo,
      data: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
      categoria: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setFormData(lancamento);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedLancamento) {
      remove('lancamentos', selectedLancamento.id);
      loadData();
      toast({
        title: 'Lançamento excluído',
        description: 'O lançamento foi removido com sucesso.',
      });
    }
    setIsDeleteOpen(false);
  };

  const handleSave = () => {
    if (!formData.categoria || !formData.descricao || !formData.valor) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const allLancamentos = getAll<Lancamento>('lancamentos');

    if (selectedLancamento) {
      const index = allLancamentos.findIndex((l) => l.id === selectedLancamento.id);
      if (index !== -1) {
        allLancamentos[index] = { ...allLancamentos[index], ...formData } as Lancamento;
      }
    } else {
      const newLancamento: Lancamento = {
        ...formData,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as Lancamento;
      allLancamentos.push(newLancamento);
    }

    localStorage.setItem('elolab_clinic_lancamentos', JSON.stringify(allLancamentos));
    loadData();
    setIsFormOpen(false);
    toast({
      title: selectedLancamento ? 'Lançamento atualizado' : 'Lançamento criado',
      description: 'O lançamento foi salvo com sucesso.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totais.receitas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
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
                    totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'
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
              <div className="p-3 rounded-full bg-yellow-100">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
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
                      <TableCell>{lancamento.categoria}</TableCell>
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
                        {formatCurrency(lancamento.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[lancamento.status])}>
                          {STATUS_LABELS[lancamento.status]}
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
                            onClick={() => handleDeleteClick(lancamento)}
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
              {selectedLancamento
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
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
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
                        {cat}
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
                  value={formData.formaPagamento}
                  onValueChange={(v) => setFormData({ ...formData, formaPagamento: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
