import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit, Package, AlertTriangle, ArrowDown, ArrowUp, Loader2,
  Barcode, Calendar, Clock, Pill, Building2, ShieldAlert, TrendingDown,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useEstoque } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyEstoque } from '@/components/EmptyState';

const CATEGORIAS = ['medicamentos', 'materiais_hospitalares', 'epis', 'escritorio', 'limpeza', 'outros'];
const UNIDADES = ['unidade', 'comprimido', 'caixa', 'frasco', 'ampola', 'pacote', 'litro', 'kg', 'ml'];

interface FormData {
  id?: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  quantidade_minima: number;
  quantidade_maxima?: number;
  ponto_pedido?: number;
  valor_unitario: number;
  valor_venda?: number;
  localizacao: string;
  lote?: string;
  validade?: string;
  fornecedor?: string;
  descricao?: string;
  codigo_ean?: string;
  fabricante?: string;
  principio_ativo?: string;
  dosagem?: string;
}

const initialForm: FormData = {
  nome: '', categoria: 'medicamentos', unidade: 'unidade',
  quantidade: 0, quantidade_minima: 10, valor_unitario: 0, localizacao: '',
};

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [filterAlerta, setFilterAlerta] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [movimentacao, setMovimentacao] = useState<{ tipo: 'entrada' | 'saida'; quantidade: number; motivo: string }>({
    tipo: 'entrada', quantidade: 0, motivo: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const { data: estoque = [], isLoading } = useEstoque();

  const getValidadeInfo = (validade: string | null) => {
    if (!validade) return null;
    const dias = differenceInDays(new Date(validade), new Date());
    if (dias < 0) return { label: 'Vencido', color: 'destructive' as const, dias };
    if (dias <= 30) return { label: `${dias}d`, color: 'destructive' as const, dias };
    if (dias <= 60) return { label: `${dias}d`, color: 'secondary' as const, dias };
    return null;
  };

  const filteredProdutos = useMemo(() => {
    return (estoque as any[]).filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || p.nome.toLowerCase().includes(q) ||
        (p.codigo_ean || '').toLowerCase().includes(q) ||
        (p.principio_ativo || '').toLowerCase().includes(q) ||
        (p.fabricante || '').toLowerCase().includes(q);
      const matchCategoria = filterCategoria === 'todos' || p.categoria === filterCategoria;
      if (filterAlerta === 'critico') return matchSearch && matchCategoria && p.quantidade < (p.quantidade_minima || 0);
      if (filterAlerta === 'validade') {
        const info = getValidadeInfo(p.validade);
        return matchSearch && matchCategoria && info !== null;
      }
      if (filterAlerta === 'ponto_pedido') return matchSearch && matchCategoria && p.ponto_pedido && p.quantidade <= p.ponto_pedido;
      return matchSearch && matchCategoria;
    });
  }, [estoque, searchTerm, filterCategoria, filterAlerta]);

  const getStatus = (produto: any) => {
    if (produto.quantidade <= 0) return { label: 'Sem estoque', variant: 'destructive' as const };
    if (produto.quantidade < (produto.quantidade_minima || 0)) return { label: 'Crítico', variant: 'destructive' as const };
    if (produto.ponto_pedido && produto.quantidade <= produto.ponto_pedido) return { label: 'Pedir', variant: 'secondary' as const };
    if (produto.quantidade <= (produto.quantidade_minima || 0) * 1.5) return { label: 'Baixo', variant: 'secondary' as const };
    return { label: 'OK', variant: 'outline' as const };
  };

  const stats = useMemo(() => {
    const items = estoque as any[];
    return {
      total: items.length,
      critico: items.filter(p => p.quantidade < (p.quantidade_minima || 0)).length,
      valorTotal: items.reduce((acc, p) => acc + (p.quantidade * (p.valor_unitario || 0)), 0),
      vencendo: items.filter(p => { const i = getValidadeInfo(p.validade); return i && i.dias >= 0 && i.dias <= 60; }).length,
    };
  }, [estoque]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatCategoria = (cat: string) => cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const handleNew = () => { setSelectedId(null); setFormData(initialForm); setIsFormOpen(true); };

  const handleEdit = (p: any) => {
    setSelectedId(p.id);
    setFormData({
      id: p.id, nome: p.nome, categoria: p.categoria, unidade: p.unidade || 'unidade',
      quantidade: p.quantidade, quantidade_minima: p.quantidade_minima || 10,
      quantidade_maxima: p.quantidade_maxima || undefined, ponto_pedido: p.ponto_pedido || undefined,
      valor_unitario: p.valor_unitario || 0, valor_venda: p.valor_venda || undefined,
      localizacao: p.localizacao || '', lote: p.lote || undefined, validade: p.validade || undefined,
      fornecedor: p.fornecedor || undefined, descricao: p.descricao || undefined,
      codigo_ean: p.codigo_ean || undefined, fabricante: p.fabricante || undefined,
      principio_ativo: p.principio_ativo || undefined, dosagem: p.dosagem || undefined,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) { toast.error('Nome é obrigatório.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        nome: formData.nome, categoria: formData.categoria, unidade: formData.unidade,
        quantidade: formData.quantidade, quantidade_minima: formData.quantidade_minima,
        quantidade_maxima: formData.quantidade_maxima || null, ponto_pedido: formData.ponto_pedido || null,
        valor_unitario: formData.valor_unitario, valor_venda: formData.valor_venda || null,
        localizacao: formData.localizacao || null, lote: formData.lote || null,
        validade: formData.validade || null, fornecedor: formData.fornecedor || null,
        descricao: formData.descricao || null, codigo_ean: formData.codigo_ean || null,
        fabricante: formData.fabricante || null, principio_ativo: formData.principio_ativo || null,
        dosagem: formData.dosagem || null,
      };

      if (selectedId) {
        const { error } = await supabase.from('estoque').update(payload).eq('id', selectedId);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('estoque').insert(payload);
        if (error) throw error;
        toast.success('Produto cadastrado!');
      }
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar.');
    } finally { setIsSaving(false); }
  };

  const handleMovimentacao = (produto: any, tipo: 'entrada' | 'saida') => {
    setSelectedId(produto.id);
    setMovimentacao({ tipo, quantidade: 0, motivo: '' });
    setIsMovimentacaoOpen(true);
  };

  const handleSaveMovimentacao = async () => {
    if (!movimentacao.quantidade || movimentacao.quantidade <= 0) { toast.error('Quantidade inválida.'); return; }
    const produto = (estoque as any[]).find(p => p.id === selectedId);
    if (!produto) return;
    const novaQtd = movimentacao.tipo === 'entrada' ? produto.quantidade + movimentacao.quantidade : produto.quantidade - movimentacao.quantidade;
    if (novaQtd < 0) { toast.error('Estoque insuficiente.'); return; }
    if (produto.quantidade_maxima && novaQtd > produto.quantidade_maxima) {
      toast.error(`Estoque máximo (${produto.quantidade_maxima}) seria ultrapassado.`); return;
    }
    setIsSaving(true);
    try {
      const { error: e1 } = await supabase.from('estoque').update({ quantidade: novaQtd }).eq('id', selectedId);
      if (e1) throw e1;
      await supabase.from('movimentacoes_estoque').insert({
        item_id: selectedId!, tipo: movimentacao.tipo,
        quantidade: movimentacao.quantidade, motivo: movimentacao.motivo || null,
      });
      toast.success(`${movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      setIsMovimentacaoOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar.');
    } finally { setIsSaving(false); }
  };

  const isMedicamento = formData.categoria === 'medicamentos';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Controle de materiais e medicamentos</p></div>
        </div>
        <CardGridSkeleton count={4} /><Card><CardHeader><CardTitle>Produtos</CardTitle></CardHeader>
        <CardContent><TableSkeleton rows={6} cols={6} /></CardContent></Card>
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
        <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" />Novo Produto</Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total de Itens</p>
            <p className="text-2xl font-bold">{stats.total}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Estoque Crítico</p>
            <p className="text-2xl font-bold text-destructive">{stats.critico}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-accent"><Calendar className="h-6 w-6 text-accent-foreground" /></div>
            <div><p className="text-sm text-muted-foreground">Vencendo ≤60d</p>
            <p className="text-2xl font-bold">{stats.vencendo}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {(estoque as any[]).length === 0 ? (
        <EmptyEstoque onAdd={handleNew} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Produtos</CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nome, EAN, princípio ativo..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{formatCategoria(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterAlerta} onValueChange={setFilterAlerta}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="critico">Estoque Crítico</SelectItem>
                    <SelectItem value="validade">Vencendo</SelectItem>
                    <SelectItem value="ponto_pedido">Ponto de Pedido</SelectItem>
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
                    <TableHead className="hidden lg:table-cell">EAN / Fabricante</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="hidden sm:table-cell">Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum produto encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProdutos.map((produto: any) => {
                      const status = getStatus(produto);
                      const validadeInfo = getValidadeInfo(produto.validade);
                      return (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{produto.nome}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {produto.principio_ativo && (
                                  <span className="flex items-center gap-0.5"><Pill className="h-3 w-3" />{produto.principio_ativo}</span>
                                )}
                                {produto.dosagem && <span>{produto.dosagem}</span>}
                                {produto.localizacao && <span>· {produto.localizacao}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-xs space-y-0.5">
                              {produto.codigo_ean && (
                                <p className="flex items-center gap-1 font-mono"><Barcode className="h-3 w-3" />{produto.codigo_ean}</p>
                              )}
                              {produto.fabricante && (
                                <p className="flex items-center gap-1 text-muted-foreground"><Building2 className="h-3 w-3" />{produto.fabricante}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {formatCategoria(produto.categoria)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium tabular-nums">{produto.quantidade}</span>
                            <span className="text-muted-foreground text-xs"> {produto.unidade}</span>
                            {produto.ponto_pedido && produto.quantidade <= produto.ponto_pedido && (
                              <p className="text-[10px] text-destructive flex items-center gap-0.5 mt-0.5">
                                <TrendingDown className="h-3 w-3" />Ponto de pedido
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {produto.validade ? (
                              <div className="text-xs">
                                <p>{format(new Date(produto.validade), 'dd/MM/yyyy')}</p>
                                {validadeInfo && (
                                  <Badge variant={validadeInfo.color} className="text-[9px] mt-0.5">
                                    {validadeInfo.label}
                                  </Badge>
                                )}
                              </div>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleMovimentacao(produto, 'entrada')} title="Entrada">
                                <ArrowDown className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleMovimentacao(produto, 'saida')} title="Saída">
                                <ArrowUp className="h-4 w-4 text-destructive" />
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

      {/* ── Form Dialog (Enhanced) ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {/* Identificação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Código EAN / Barras</Label>
                <Input value={formData.codigo_ean || ''} onChange={e => setFormData({ ...formData, codigo_ean: e.target.value })}
                  placeholder="7891234567890" className="font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{formatCategoria(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade</Label>
                <Select value={formData.unidade} onValueChange={v => setFormData({ ...formData, unidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map(u => <SelectItem key={u} value={u}>{formatCategoria(u)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fabricante / Marca</Label>
                <Input value={formData.fabricante || ''} onChange={e => setFormData({ ...formData, fabricante: e.target.value })}
                  placeholder="Ex: Medley, 3M..." />
              </div>
            </div>

            {/* Medicamento-specific */}
            {isMedicamento && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Pill className="h-4 w-4" /> Dados do Medicamento
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Princípio Ativo</Label>
                      <Input value={formData.principio_ativo || ''} onChange={e => setFormData({ ...formData, principio_ativo: e.target.value })}
                        placeholder="Ex: Paracetamol" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dosagem / Concentração</Label>
                      <Input value={formData.dosagem || ''} onChange={e => setFormData({ ...formData, dosagem: e.target.value })}
                        placeholder="Ex: 500mg, 10mg/ml" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quantidades */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Controle de Estoque
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantidade Atual</Label>
                  <Input type="number" value={formData.quantidade}
                    onChange={e => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mínimo</Label>
                  <Input type="number" value={formData.quantidade_minima}
                    onChange={e => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ponto de Pedido</Label>
                  <Input type="number" value={formData.ponto_pedido || ''} placeholder="Opcional"
                    onChange={e => setFormData({ ...formData, ponto_pedido: parseInt(e.target.value) || undefined })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Máximo</Label>
                  <Input type="number" value={formData.quantidade_maxima || ''} placeholder="Opcional"
                    onChange={e => setFormData({ ...formData, quantidade_maxima: parseInt(e.target.value) || undefined })} />
                </div>
              </div>
            </div>

            {/* Financeiro */}
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Custo (R$)</Label>
                <Input type="number" step="0.01" value={formData.valor_unitario}
                  onChange={e => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Venda (R$)</Label>
                <Input type="number" step="0.01" value={formData.valor_venda || ''} placeholder="Opcional"
                  onChange={e => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fornecedor</Label>
                <Input value={formData.fornecedor || ''} onChange={e => setFormData({ ...formData, fornecedor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Localização</Label>
                <Input value={formData.localizacao} onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Prateleira A1" />
              </div>
            </div>

            {/* Lote e Validade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Lote</Label>
                <Input value={formData.lote || ''} onChange={e => setFormData({ ...formData, lote: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Validade</Label>
                <Input type="date" value={formData.validade || ''} onChange={e => setFormData({ ...formData, validade: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição / Observações</Label>
              <Textarea value={formData.descricao || ''} onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                rows={2} placeholder="Informações adicionais..." />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movimentação Dialog */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{movimentacao.tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="1" value={movimentacao.quantidade || ''}
                onChange={e => setMovimentacao({ ...movimentacao, quantidade: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={movimentacao.motivo} onChange={e => setMovimentacao({ ...movimentacao, motivo: e.target.value })}
                placeholder="Motivo da movimentação" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovimentacaoOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveMovimentacao} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
