import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Check, Send, DollarSign, AlertCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

interface ContaReceber {
  id: string;
  pacienteId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  formaPagamento?: string;
  observacoes: string;
  criadoEm: string;
}

export default function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaReceber | null>(null);
  const [formData, setFormData] = useState<Partial<ContaReceber>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getAll<ContaReceber>('contas_receber');
    const pacientesData = getAll<Paciente>('pacientes');
    setPacientes(pacientesData);
    
    // Check for overdue accounts
    const today = new Date().toISOString().split('T')[0];
    const updatedData = data.map(conta => {
      if (conta.status === 'pendente' && conta.dataVencimento < today) {
        return { ...conta, status: 'vencido' as const };
      }
      return conta;
    });
    
    if (JSON.stringify(data) !== JSON.stringify(updatedData)) {
      setCollection('contas_receber', updatedData);
    }
    
    setContas(updatedData);
  };

  const filteredContas = contas.filter(c => {
    const paciente = pacientes.find(p => p.id === c.pacienteId);
    const matchSearch = paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  const stats = {
    total: contas.filter(c => c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0),
    pendente: contas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0),
    vencido: contas.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0),
    pago: contas.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0),
  };

  const handleNew = () => {
    setSelectedConta(null);
    setFormData({
      dataVencimento: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.descricao || !formData.valor) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const allContas = getAll<ContaReceber>('contas_receber');
    
    if (selectedConta) {
      const index = allContas.findIndex(c => c.id === selectedConta.id);
      if (index !== -1) {
        allContas[index] = { ...allContas[index], ...formData } as ContaReceber;
      }
    } else {
      allContas.push({
        ...formData,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as ContaReceber);
    }

    setCollection('contas_receber', allContas);
    loadData();
    setIsFormOpen(false);
    toast({ title: 'Sucesso', description: 'Conta salva com sucesso.' });
  };

  const handlePagamento = (conta: ContaReceber) => {
    setSelectedConta(conta);
    setFormData({
      ...conta,
      dataPagamento: format(new Date(), 'yyyy-MM-dd'),
      formaPagamento: 'pix',
    });
    setIsPagamentoOpen(true);
  };

  const handleConfirmarPagamento = () => {
    if (!selectedConta) return;

    const allContas = getAll<ContaReceber>('contas_receber');
    const index = allContas.findIndex(c => c.id === selectedConta.id);
    
    if (index !== -1) {
      allContas[index] = {
        ...allContas[index],
        status: 'pago',
        dataPagamento: formData.dataPagamento,
        formaPagamento: formData.formaPagamento,
      };
      setCollection('contas_receber', allContas);
      loadData();
      setIsPagamentoOpen(false);
      toast({ title: 'Sucesso', description: 'Pagamento registrado com sucesso.' });
    }
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      pago: 'bg-green-100 text-green-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.pendente;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie os valores a receber de pacientes</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.vencido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.pago)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Contas</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
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
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell>{format(new Date(conta.dataVencimento), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(conta.pacienteId)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{conta.descricao}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>
                        <Badge className={cn(getStatusBadge(conta.status))}>
                          {conta.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {conta.status !== 'pago' && conta.status !== 'cancelado' && (
                            <Button variant="ghost" size="icon" onClick={() => handlePagamento(conta)} title="Registrar Pagamento">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Enviar Cobrança">
                            <Send className="h-4 w-4" />
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
            <DialogTitle>Nova Conta a Receber</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.pacienteId}
                onValueChange={(v) => setFormData({ ...formData, pacienteId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Consulta particular"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagamento Dialog */}
      <Dialog open={isPagamentoOpen} onOpenChange={setIsPagamentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{getPacienteNome(selectedConta?.pacienteId || '')}</p>
              <p className="text-sm text-muted-foreground">{selectedConta?.descricao}</p>
              <p className="text-lg font-bold mt-2">{formatCurrency(selectedConta?.valor || 0)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={formData.dataPagamento}
                  onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={formData.formaPagamento}
                  onValueChange={(v) => setFormData({ ...formData, formaPagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPagamentoOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarPagamento} className="bg-green-600 hover:bg-green-700">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
