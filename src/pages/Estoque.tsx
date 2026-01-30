import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAll, generateId, setCollection } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  precoCusto: number;
  precoVenda: number;
  validade?: string;
  localizacao: string;
  criadoEm: string;
}

interface Movimentacao {
  id: string;
  produtoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  data: string;
  responsavel: string;
}

const CATEGORIAS = ['Medicamentos', 'Materiais Hospitalares', 'EPIs', 'Escritório', 'Limpeza', 'Outros'];
const UNIDADES = ['Unidade', 'Caixa', 'Frasco', 'Ampola', 'Pacote', 'Litro', 'Kg'];

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [formData, setFormData] = useState<Partial<Produto>>({});
  const [movimentacaoData, setMovimentacaoData] = useState<Partial<Movimentacao>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getAll<Produto>('estoque');
    if (data.length === 0) {
      // Seed demo data
      const demoProdutos: Produto[] = [
        { id: '1', nome: 'Dipirona 500mg', categoria: 'Medicamentos', unidade: 'Caixa', estoqueAtual: 50, estoqueMinimo: 20, estoqueMaximo: 100, precoCusto: 8, precoVenda: 15, localizacao: 'Prateleira A1', criadoEm: new Date().toISOString() },
        { id: '2', nome: 'Paracetamol 750mg', categoria: 'Medicamentos', unidade: 'Caixa', estoqueAtual: 15, estoqueMinimo: 25, estoqueMaximo: 80, precoCusto: 6, precoVenda: 12, localizacao: 'Prateleira A2', criadoEm: new Date().toISOString() },
        { id: '3', nome: 'Luvas Descartáveis M', categoria: 'EPIs', unidade: 'Caixa', estoqueAtual: 30, estoqueMinimo: 10, estoqueMaximo: 50, precoCusto: 25, precoVenda: 40, localizacao: 'Prateleira B1', criadoEm: new Date().toISOString() },
        { id: '4', nome: 'Álcool 70%', categoria: 'Limpeza', unidade: 'Litro', estoqueAtual: 8, estoqueMinimo: 10, estoqueMaximo: 30, precoCusto: 12, precoVenda: 20, localizacao: 'Prateleira C1', criadoEm: new Date().toISOString() },
        { id: '5', nome: 'Seringa 10ml', categoria: 'Materiais Hospitalares', unidade: 'Unidade', estoqueAtual: 200, estoqueMinimo: 100, estoqueMaximo: 500, precoCusto: 0.5, precoVenda: 1.5, localizacao: 'Prateleira B2', criadoEm: new Date().toISOString() },
      ];
      setCollection('estoque', demoProdutos);
      setProdutos(demoProdutos);
    } else {
      setProdutos(data);
    }
  };

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = filterCategoria === 'todos' || p.categoria === filterCategoria;
    return matchSearch && matchCategoria;
  });

  const getStatus = (produto: Produto) => {
    if (produto.estoqueAtual <= 0) return { label: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (produto.estoqueAtual < produto.estoqueMinimo) return { label: 'Crítico', color: 'bg-red-100 text-red-800' };
    if (produto.estoqueAtual <= produto.estoqueMinimo * 1.5) return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'OK', color: 'bg-green-100 text-green-800' };
  };

  const stats = {
    total: produtos.length,
    critico: produtos.filter(p => p.estoqueAtual < p.estoqueMinimo).length,
    valorTotal: produtos.reduce((acc, p) => acc + (p.estoqueAtual * p.precoCusto), 0),
  };

  const handleNew = () => {
    setSelectedProduto(null);
    setFormData({
      categoria: 'Medicamentos',
      unidade: 'Unidade',
      estoqueAtual: 0,
      estoqueMinimo: 10,
      estoqueMaximo: 100,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setFormData(produto);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }

    const allProdutos = getAll<Produto>('estoque');
    
    if (selectedProduto) {
      const index = allProdutos.findIndex(p => p.id === selectedProduto.id);
      if (index !== -1) {
        allProdutos[index] = { ...allProdutos[index], ...formData } as Produto;
      }
    } else {
      allProdutos.push({
        ...formData,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as Produto);
    }

    setCollection('estoque', allProdutos);
    loadData();
    setIsFormOpen(false);
    toast({ title: 'Sucesso', description: 'Produto salvo com sucesso.' });
  };

  const handleMovimentacao = (produto: Produto, tipo: 'entrada' | 'saida') => {
    setSelectedProduto(produto);
    setMovimentacaoData({
      produtoId: produto.id,
      tipo,
      quantidade: 0,
      data: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsMovimentacaoOpen(true);
  };

  const handleSaveMovimentacao = () => {
    if (!movimentacaoData.quantidade || movimentacaoData.quantidade <= 0) {
      toast({ title: 'Erro', description: 'Quantidade inválida.', variant: 'destructive' });
      return;
    }

    const allProdutos = getAll<Produto>('estoque');
    const index = allProdutos.findIndex(p => p.id === selectedProduto?.id);
    
    if (index !== -1) {
      if (movimentacaoData.tipo === 'entrada') {
        allProdutos[index].estoqueAtual += movimentacaoData.quantidade;
      } else {
        if (allProdutos[index].estoqueAtual < movimentacaoData.quantidade) {
          toast({ title: 'Erro', description: 'Estoque insuficiente.', variant: 'destructive' });
          return;
        }
        allProdutos[index].estoqueAtual -= movimentacaoData.quantidade;
      }
      setCollection('estoque', allProdutos);
      loadData();
      setIsMovimentacaoOpen(false);
      toast({ 
        title: 'Sucesso', 
        description: `${movimentacaoData.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso.` 
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Controle de materiais e medicamentos</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl font-bold text-red-600">{stats.critico}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Produtos</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
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
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="hidden sm:table-cell">Mín/Máx</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum produto encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto) => {
                    const status = getStatus(produto);
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">{produto.localizacao}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{produto.categoria}</TableCell>
                        <TableCell>
                          <span className="font-medium">{produto.estoqueAtual}</span>
                          <span className="text-muted-foreground"> {produto.unidade}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {produto.estoqueMinimo} / {produto.estoqueMaximo}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(status.color)}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleMovimentacao(produto, 'entrada')} title="Entrada">
                              <ArrowDown className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleMovimentacao(produto, 'saida')} title="Saída">
                              <ArrowUp className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            <DialogTitle>{selectedProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(v) => setFormData({ ...formData, unidade: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map(un => (
                      <SelectItem key={un} value={un}>{un}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estoque Atual</Label>
                <Input
                  type="number"
                  value={formData.estoqueAtual || 0}
                  onChange={(e) => setFormData({ ...formData, estoqueAtual: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  value={formData.estoqueMinimo || 0}
                  onChange={(e) => setFormData({ ...formData, estoqueMinimo: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo</Label>
                <Input
                  type="number"
                  value={formData.estoqueMaximo || 0}
                  onChange={(e) => setFormData({ ...formData, estoqueMaximo: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precoCusto || 0}
                  onChange={(e) => setFormData({ ...formData, precoCusto: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precoVenda || 0}
                  onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                value={formData.localizacao || ''}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Prateleira A1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movimentação Dialog */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movimentacaoData.tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedProduto?.nome}</p>
              <p className="text-sm text-muted-foreground">
                Estoque atual: {selectedProduto?.estoqueAtual} {selectedProduto?.unidade}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min={1}
                value={movimentacaoData.quantidade || ''}
                onChange={(e) => setMovimentacaoData({ ...movimentacaoData, quantidade: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={movimentacaoData.motivo || ''}
                onChange={(e) => setMovimentacaoData({ ...movimentacaoData, motivo: e.target.value })}
                placeholder={movimentacaoData.tipo === 'entrada' ? 'Ex: Compra' : 'Ex: Uso em procedimento'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovimentacaoOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMovimentacao}>
              Confirmar {movimentacaoData.tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
