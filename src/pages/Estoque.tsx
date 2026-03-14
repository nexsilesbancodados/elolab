import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Package, AlertTriangle, ArrowDown, ArrowUp, Loader2 , TrendingDown, RefreshCw} from 'lucide-react';
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
import { toast } from 'sonner';
import { useEstoque } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyEstoque } from '@/components/EmptyState';

const CATEGORIAS = ['medicamentos', 'materiais_hospitalares', 'epis', 'escritorio', 'limpeza', 'outros'];
const UNIDADES = ['unidade', 'caixa', 'frasco', 'ampola', 'pacote', 'litro', 'kg'];

interface FormData {
  id?: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
  localizacao: string;
  lote?: string;
  validade?: string;
  fornecedor?: string;
  descricao?: string;
}

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    categoria: 'medicamentos',
    unidade: 'unidade',
    quantidade: 0,
    quantidade_minima: 10,
    valor_unitario: 0,
    localizacao: '',
  });
  const [movimentacao, setMovimentacao] = useState<{ tipo: 'entrada' | 'saida'; quantidade: number; motivo: string }>({
    tipo: 'entrada',
    quantidade: 0,
    motivo: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const { data: estoque = [], isLoading } = useEstoque();

  const filteredProdutos = useMemo(() => {
    return estoque.filter(p => {
      const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = filterCategoria === 'todos' || p.categoria === filterCategoria;
      return matchSearch && matchCategoria;
    });
  }, [estoque, searchTerm, filterCategoria]);

  const getStatus = (produto: typeof estoque[0]) => {
    if (produto.quantidade <= 0) return { label: 'Sem estoque', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    if (produto.quantidade < (produto.quantidade_minima || 0)) return { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    if (produto.quantidade <= (produto.quantidade_minima || 0) * 1.5) return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    return { label: 'OK', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  const stats = useMemo(() => ({
    total: estoque.length,
    critico: estoque.filter(p => p.quantidade < (p.quantidade_minima || 0)).length,
    valorTotal: estoque.reduce((acc, p) => acc + (p.quantidade * (p.valor_unitario || 0)), 0),
  }), [estoque]);

  const handleNew = () => {
    setSelectedId(null);
    setFormData({
      nome: '',
      categoria: 'medicamentos',
      unidade: 'unidade',
      quantidade: 0,
      quantidade_minima: 10,
      valor_unitario: 0,
      localizacao: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (produto: typeof estoque[0]) => {
    setSelectedId(produto.id);
    setFormData({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      unidade: produto.unidade || 'unidade',
      quantidade: produto.quantidade,
      quantidade_minima: produto.quantidade_minima || 10,
      valor_unitario: produto.valor_unitario || 0,
      localizacao: produto.localizacao || '',
      lote: produto.lote || undefined,
      validade: produto.validade || undefined,
      fornecedor: produto.fornecedor || undefined,
      descricao: produto.descricao || undefined,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Nome é obrigatório.');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedId) {
        const { error } = await supabase
          .from('estoque')
          .update({
            nome: formData.nome,
            categoria: formData.categoria,
            unidade: formData.unidade,
            quantidade: formData.quantidade,
            quantidade_minima: formData.quantidade_minima,
            valor_unitario: formData.valor_unitario,
            localizacao: formData.localizacao,
            lote: formData.lote,
            validade: formData.validade,
            fornecedor: formData.fornecedor,
            descricao: formData.descricao,
          })
          .eq('id', selectedId);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('estoque')
          .insert({
            nome: formData.nome,
            categoria: formData.categoria,
            unidade: formData.unidade,
            quantidade: formData.quantidade,
            quantidade_minima: formData.quantidade_minima,
            valor_unitario: formData.valor_unitario,
            localizacao: formData.localizacao,
            lote: formData.lote,
            validade: formData.validade,
            fornecedor: formData.fornecedor,
            descricao: formData.descricao,
          });

        if (error) throw error;
        toast.success('Produto cadastrado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar produto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMovimentacao = (produto: typeof estoque[0], tipo: 'entrada' | 'saida') => {
    setSelectedId(produto.id);
    setMovimentacao({ tipo, quantidade: 0, motivo: '' });
    setIsMovimentacaoOpen(true);
  };

  const handleSaveMovimentacao = async () => {
    if (!movimentacao.quantidade || movimentacao.quantidade <= 0) {
      toast.error('Quantidade inválida.');
      return;
    }

    const produto = estoque.find(p => p.id === selectedId);
    if (!produto) return;

    const novaQuantidade = movimentacao.tipo === 'entrada'
      ? produto.quantidade + movimentacao.quantidade
      : produto.quantidade - movimentacao.quantidade;

    if (novaQuantidade < 0) {
      toast.error('Estoque insuficiente.');
      return;
    }

    setIsSaving(true);

    try {
      // Update stock quantity
      const { error: estoqueError } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', selectedId);

      if (estoqueError) throw estoqueError;

      // Log the movement
      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          item_id: selectedId!,
          tipo: movimentacao.tipo,
          quantidade: movimentacao.quantidade,
          motivo: movimentacao.motivo || null,
        });

      if (movError) console.error('Error logging movement:', movError);

      toast.success(`${movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setIsMovimentacaoOpen(false);
    } catch (error) {
      console.error('Error saving movement:', error);
      toast.error('Erro ao registrar movimentação.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatCategoria = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
            <p className="text-muted-foreground">Controle de materiais e medicamentos</p>
          </div>
        </div>
        <CardGridSkeleton count={3} />
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} cols={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
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
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critico}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {estoque.length === 0 ? (
        <EmptyEstoque onAdd={handleNew} />
      ) : (
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
                      <SelectItem key={cat} value={cat}>{formatCategoria(cat)}</SelectItem>
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
                    <TableHead className="hidden sm:table-cell">Mínimo</TableHead>
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
                              {produto.localizacao && (
                                <p className="text-xs text-muted-foreground">{produto.localizacao}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatCategoria(produto.categoria)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{produto.quantidade}</span>
                            <span className="text-muted-foreground"> {produto.unidade}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {produto.quantidade_minima}
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
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
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
                      <SelectItem key={cat} value={cat}>{formatCategoria(cat)}</SelectItem>
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
                      <SelectItem key={un} value={un}>{formatCategoria(un)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  value={formData.quantidade_minima}
                  onChange={(e) => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Unit.</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Prateleira A1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lote</Label>
                <Input
                  value={formData.lote || ''}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={formData.validade || ''}
                  onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                />
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

      {/* Movimentacao Dialog */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movimentacao.tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={movimentacao.quantidade || ''}
                onChange={(e) => setMovimentacao({ ...movimentacao, quantidade: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={movimentacao.motivo}
                onChange={(e) => setMovimentacao({ ...movimentacao, motivo: e.target.value })}
                placeholder="Motivo da movimentação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovimentacaoOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMovimentacao} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
