import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit, Trash2, Building2, Shield, FileText, Clock,
  ExternalLink, User, Phone, Loader2, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConvenios } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const VERSOES_TISS = ['04.01.00', '04.00.02', '03.05.00', '03.04.01'];

interface FormData {
  nome: string;
  codigo: string;
  cnpj: string;
  telefone: string;
  email: string;
  website: string;
  valor_consulta: number;
  valor_retorno: number;
  carencia: number;
  ativo: boolean;
  registro_ans: string;
  codigo_operadora: string;
  versao_tiss: string;
  prazo_retorno: number;
  taxa_glosa: number;
  portal_url: string;
  responsavel_nome: string;
  responsavel_cargo: string;
  responsavel_telefone: string;
  tipo_planos: string[];
}

const initialFormData: FormData = {
  nome: '', codigo: '', cnpj: '', telefone: '', email: '', website: '',
  valor_consulta: 0, valor_retorno: 0, carencia: 0, ativo: true,
  registro_ans: '', codigo_operadora: '', versao_tiss: '04.01.00',
  prazo_retorno: 30, taxa_glosa: 0, portal_url: '',
  responsavel_nome: '', responsavel_cargo: '', responsavel_telefone: '',
  tipo_planos: [],
};

export default function Convenios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPlano, setNewPlano] = useState('');

  const queryClient = useQueryClient();
  const { data: convenios = [], isLoading } = useConvenios();

  const filteredConvenios = useMemo(() =>
    (convenios as any[]).filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.registro_ans || '').includes(searchTerm)
    ), [convenios, searchTerm]);

  const handleNew = () => { setEditingId(null); setFormData(initialFormData); setIsFormOpen(true); };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      nome: c.nome, codigo: c.codigo, cnpj: c.cnpj || '', telefone: c.telefone || '',
      email: c.email || '', website: c.website || '', valor_consulta: c.valor_consulta || 0,
      valor_retorno: c.valor_retorno || 0, carencia: c.carencia || 0, ativo: c.ativo ?? true,
      registro_ans: c.registro_ans || '', codigo_operadora: c.codigo_operadora || '',
      versao_tiss: c.versao_tiss || '04.01.00', prazo_retorno: c.prazo_retorno ?? 30,
      taxa_glosa: c.taxa_glosa || 0, portal_url: c.portal_url || '',
      responsavel_nome: c.responsavel_nome || '', responsavel_cargo: c.responsavel_cargo || '',
      responsavel_telefone: c.responsavel_telefone || '',
      tipo_planos: c.tipo_planos || [],
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => { setSelectedId(id); setIsDeleteOpen(true); };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('convenios').delete().eq('id', selectedId);
      if (error) throw error;
      toast.success('Convênio excluído!');
      queryClient.invalidateQueries({ queryKey: ['convenios'] });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir.');
    } finally { setIsDeleting(false); setIsDeleteOpen(false); }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.codigo) { toast.error('Nome e código são obrigatórios.'); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        nome: formData.nome, codigo: formData.codigo, cnpj: formData.cnpj || null,
        telefone: formData.telefone || null, email: formData.email || null,
        website: formData.website || null, valor_consulta: formData.valor_consulta,
        valor_retorno: formData.valor_retorno, carencia: formData.carencia, ativo: formData.ativo,
        registro_ans: formData.registro_ans || null, codigo_operadora: formData.codigo_operadora || null,
        versao_tiss: formData.versao_tiss || null, prazo_retorno: formData.prazo_retorno,
        taxa_glosa: formData.taxa_glosa, portal_url: formData.portal_url || null,
        responsavel_nome: formData.responsavel_nome || null,
        responsavel_cargo: formData.responsavel_cargo || null,
        responsavel_telefone: formData.responsavel_telefone || null,
        tipo_planos: formData.tipo_planos.length > 0 ? formData.tipo_planos : null,
      };

      if (editingId) {
        const { error } = await supabase.from('convenios').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Convênio atualizado!');
      } else {
        const { error } = await supabase.from('convenios').insert(payload);
        if (error) throw error;
        toast.success('Convênio cadastrado!');
      }
      queryClient.invalidateQueries({ queryKey: ['convenios'] });
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar.');
    } finally { setIsSubmitting(false); }
  };

  const addPlano = () => {
    const trimmed = newPlano.trim();
    if (!trimmed || formData.tipo_planos.includes(trimmed)) return;
    setFormData(p => ({ ...p, tipo_planos: [...p.tipo_planos, trimmed] }));
    setNewPlano('');
  };

  const removePlano = (p: string) => {
    setFormData(prev => ({ ...prev, tipo_planos: prev.tipo_planos.filter(x => x !== p) }));
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Convênios</h1>
          <p className="text-muted-foreground">Operadoras de saúde, faturamento TISS e regras de cobrança</p>
        </div>
        <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" />Novo Convênio</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{(convenios as any[]).length}</p><p className="text-xs text-muted-foreground">Convênios</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{(convenios as any[]).filter(c => c.ativo).length}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{(convenios as any[]).filter(c => c.registro_ans).length}</p><p className="text-xs text-muted-foreground">Com ANS</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent"><Clock className="h-5 w-5 text-accent-foreground" /></div>
          <div><p className="text-2xl font-bold">{(convenios as any[]).filter(c => !c.registro_ans && c.ativo).length}</p><p className="text-xs text-muted-foreground">Sem ANS</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Convênios ({filteredConvenios.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar nome, código ou ANS..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Convênio</TableHead>
                  <TableHead className="hidden md:table-cell">ANS / Operadora</TableHead>
                  <TableHead className="hidden sm:table-cell">Consulta</TableHead>
                  <TableHead className="hidden lg:table-cell">Retorno</TableHead>
                  <TableHead className="hidden lg:table-cell">TISS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConvenios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum convênio encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConvenios.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.nome}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.codigo}</p>
                          {c.tipo_planos && c.tipo_planos.length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {c.tipo_planos.slice(0, 2).map((p: string) => (
                                <Badge key={p} variant="secondary" className="text-[9px]">{p}</Badge>
                              ))}
                              {c.tipo_planos.length > 2 && <span className="text-[9px] text-muted-foreground">+{c.tipo_planos.length - 2}</span>}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-xs space-y-0.5">
                          {c.registro_ans ? (
                            <p className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" />{c.registro_ans}</p>
                          ) : (
                            <p className="text-muted-foreground">Sem registro</p>
                          )}
                          {c.codigo_operadora && <p className="text-muted-foreground">Op: {c.codigo_operadora}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell tabular-nums">{formatCurrency(c.valor_consulta || 0)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs">
                          <p className="tabular-nums">{formatCurrency(c.valor_retorno || 0)}</p>
                          <p className="text-muted-foreground">{c.prazo_retorno || 30}d</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-[10px] font-mono">{c.versao_tiss || '04.01.00'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.ativo ? 'default' : 'secondary'}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.portal_url && (
                            <Button variant="ghost" size="icon" asChild title="Portal do convênio">
                              <a href={c.portal_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c.id)}>
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

      {/* ── Enhanced Form Dialog ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingId ? 'Editar Convênio' : 'Novo Convênio'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {/* Identificação */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Código Interno *</Label>
                <Input value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} maxLength={10} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <Input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            </div>

            {/* Dados ANS */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Dados Regulatórios (ANS)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Registro ANS</Label>
                  <Input value={formData.registro_ans} onChange={e => setFormData({ ...formData, registro_ans: e.target.value })}
                    placeholder="Nº ANS" className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Código da Operadora</Label>
                  <Input value={formData.codigo_operadora} onChange={e => setFormData({ ...formData, codigo_operadora: e.target.value })}
                    placeholder="Código TISS" className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Versão TISS</Label>
                  <Select value={formData.versao_tiss} onValueChange={v => setFormData({ ...formData, versao_tiss: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VERSOES_TISS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Valores e Regras */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Valores e Regras de Cobrança
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor Consulta (R$)</Label>
                  <Input type="number" step="0.01" value={formData.valor_consulta}
                    onChange={e => setFormData({ ...formData, valor_consulta: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor Retorno (R$)</Label>
                  <Input type="number" step="0.01" value={formData.valor_retorno}
                    onChange={e => setFormData({ ...formData, valor_retorno: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Carência (dias)</Label>
                  <Input type="number" value={formData.carencia}
                    onChange={e => setFormData({ ...formData, carencia: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prazo de Retorno (dias)</Label>
                  <Input type="number" value={formData.prazo_retorno}
                    onChange={e => setFormData({ ...formData, prazo_retorno: parseInt(e.target.value) || 30 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Taxa Glosa (%)</Label>
                  <Input type="number" step="0.1" value={formData.taxa_glosa}
                    onChange={e => setFormData({ ...formData, taxa_glosa: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>

            {/* Planos Vinculados */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Planos Vinculados</h4>
              <div className="flex gap-2 mb-2">
                <Input value={newPlano} onChange={e => setNewPlano(e.target.value)}
                  placeholder="Ex: Básico, Executivo, Nacional..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPlano())} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addPlano}>Adicionar</Button>
              </div>
              {formData.tipo_planos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tipo_planos.map(p => (
                    <Badge key={p} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removePlano(p)}>
                      {p} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Contato */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> Contato
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Website</Label>
                  <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Portal de Autorização (URL)</Label>
                  <Input value={formData.portal_url} onChange={e => setFormData({ ...formData, portal_url: e.target.value })} placeholder="https://portal..." />
                </div>
              </div>
            </div>

            {/* Responsável Faturamento */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <User className="h-4 w-4" /> Responsável no Convênio (Faturamento)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input value={formData.responsavel_nome} onChange={e => setFormData({ ...formData, responsavel_nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cargo</Label>
                  <Input value={formData.responsavel_cargo} onChange={e => setFormData({ ...formData, responsavel_cargo: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={formData.responsavel_telefone} onChange={e => setFormData({ ...formData, responsavel_telefone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Ativo */}
            <Separator />
            <div className="flex items-center gap-2">
              <Switch checked={formData.ativo} onCheckedChange={checked => setFormData({ ...formData, ativo: checked })} />
              <Label>Convênio Ativo</Label>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este convênio? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
