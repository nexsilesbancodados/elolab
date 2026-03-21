import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DollarSign, Plus, Search, Edit, Trash2, Building2, Stethoscope, Loader2 } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Internal/Particular Prices Tab ───
function PrecosInternos() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', codigo_tuss: '', descricao: '', valor: '', custo: '' });

  const { data: precos = [], isLoading } = useQuery({
    queryKey: ['precos-exames-internos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('configuracoes_clinica')
        .select('valor')
        .eq('chave', 'precos_exames_internos')
        .eq('user_id', user.id)
        .maybeSingle();
      return (data?.valor as any[]) || [];
    },
    enabled: !!user?.id,
  });

  const saveAll = async (list: any[]) => {
    if (!user?.id) return;
    await supabase.from('configuracoes_clinica').upsert({
      chave: 'precos_exames_internos',
      user_id: user.id,
      valor: list as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,chave' });
    queryClient.invalidateQueries({ queryKey: ['precos-exames-internos'] });
  };

  const handleSave = async () => {
    if (!form.nome || !form.valor) { toast.error('Preencha nome e valor'); return; }
    const entry = { nome: form.nome, codigo_tuss: form.codigo_tuss, descricao: form.descricao, valor: +form.valor, custo: form.custo ? +form.custo : 0 };
    const list = [...precos];
    if (editIdx !== null) list[editIdx] = entry;
    else list.push(entry);
    await saveAll(list);
    toast.success(editIdx !== null ? 'Atualizado!' : 'Cadastrado!');
    setShowForm(false);
    setEditIdx(null);
    setForm({ nome: '', codigo_tuss: '', descricao: '', valor: '', custo: '' });
  };

  const handleDelete = async (idx: number) => {
    const list = precos.filter((_: any, i: number) => i !== idx);
    await saveAll(list);
    toast.success('Removido!');
  };

  const openEdit = (idx: number) => {
    const p = precos[idx];
    setEditIdx(idx);
    setForm({ nome: p.nome, codigo_tuss: p.codigo_tuss || '', descricao: p.descricao || '', valor: String(p.valor), custo: String(p.custo || '') });
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    if (!search) return precos;
    const q = search.toLowerCase();
    return precos.filter((p: any) => p.nome?.toLowerCase().includes(q) || p.codigo_tuss?.toLowerCase().includes(q));
  }, [precos, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar exame..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => { setEditIdx(null); setForm({ nome: '', codigo_tuss: '', descricao: '', valor: '', custo: '' }); setShowForm(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Exame
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead>TUSS</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor Particular</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum exame cadastrado. Clique "Novo Exame" para começar.</TableCell></TableRow>
              ) : (
                filtered.map((p: any, idx: number) => {
                  const margem = p.custo > 0 ? ((p.valor - p.custo) / p.valor * 100) : 100;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{p.codigo_tuss || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{p.descricao || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(p.valor)}</TableCell>
                      <TableCell className="text-right">{p.custo > 0 ? fmt(p.custo) : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={margem >= 50 ? 'default' : margem >= 20 ? 'secondary' : 'destructive'} className="text-xs">
                          {margem.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(idx)}><Edit className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(idx)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filtered.length} exame(s)</span>
          <span>Média: {fmt(filtered.reduce((s: number, p: any) => s + (p.valor || 0), 0) / filtered.length)}</span>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) setEditIdx(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editIdx !== null ? 'Editar Exame' : 'Novo Exame Particular'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do Exame *</Label><Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Hemograma Completo" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Código TUSS</Label><Input value={form.codigo_tuss} onChange={(e) => setForm(p => ({ ...p, codigo_tuss: e.target.value }))} placeholder="40301630" /></div>
              <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Particular (R$) *</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm(p => ({ ...p, valor: e.target.value }))} /></div>
              <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.custo} onChange={(e) => setForm(p => ({ ...p, custo: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || !form.valor}>{editIdx !== null ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Convênio Prices Tab ───
function PrecosConvenio() {
  const [search, setSearch] = useState('');
  const [filterConvenio, setFilterConvenio] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: convenios } = useQuery({
    queryKey: ['convenios-precos'],
    queryFn: async () => {
      const { data } = await supabase.from('convenios').select('id, nome, codigo').eq('ativo', true).order('nome');
      return data || [];
    },
  });

  const { data: precos, isLoading } = useQuery({
    queryKey: ['precos-exames'],
    queryFn: async () => {
      const { data } = await supabase
        .from('precos_exames_convenio')
        .select('*, convenios(nome, codigo)')
        .order('tipo_exame');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (editing) {
        const { error } = await supabase.from('precos_exames_convenio').update({
          convenio_id: form.convenio_id, tipo_exame: form.tipo_exame, codigo_tuss: form.codigo_tuss || null,
          descricao: form.descricao || null, valor_tabela: +form.valor_tabela, valor_filme: form.valor_filme ? +form.valor_filme : 0,
          valor_custo: form.valor_custo ? +form.valor_custo : 0, valor_repasse: form.valor_repasse ? +form.valor_repasse : 0,
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('precos_exames_convenio').insert({
          convenio_id: form.convenio_id, tipo_exame: form.tipo_exame, codigo_tuss: form.codigo_tuss || null,
          descricao: form.descricao || null, valor_tabela: +form.valor_tabela, valor_filme: form.valor_filme ? +form.valor_filme : 0,
          valor_custo: form.valor_custo ? +form.valor_custo : 0, valor_repasse: form.valor_repasse ? +form.valor_repasse : 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precos-exames'] });
      toast.success(editing ? 'Preço atualizado!' : 'Preço cadastrado!');
      setShowNew(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message?.includes('unique') ? 'Já existe preço para este exame neste convênio' : 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('precos_exames_convenio').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precos-exames'] });
      toast.success('Removido');
    },
  });

  const filtered = precos?.filter((p: any) => {
    const matchSearch = p.tipo_exame.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_tuss?.toLowerCase().includes(search.toLowerCase());
    const matchConvenio = filterConvenio === 'all' || p.convenio_id === filterConvenio;
    return matchSearch && matchConvenio;
  });

  const [form, setForm] = useState({
    convenio_id: '', tipo_exame: '', codigo_tuss: '', descricao: '', valor_tabela: '', valor_filme: '', valor_custo: '', valor_repasse: '',
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      convenio_id: p.convenio_id, tipo_exame: p.tipo_exame, codigo_tuss: p.codigo_tuss || '',
      descricao: p.descricao || '', valor_tabela: String(p.valor_tabela), valor_filme: String(p.valor_filme || ''),
      valor_custo: String(p.valor_custo || ''), valor_repasse: String(p.valor_repasse || ''),
    });
    setShowNew(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar exame ou TUSS..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterConvenio} onValueChange={setFilterConvenio}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os convênios</SelectItem>
            {convenios?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setForm({ convenio_id: '', tipo_exame: '', codigo_tuss: '', descricao: '', valor_tabela: '', valor_filme: '', valor_custo: '', valor_repasse: '' }); setShowNew(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Preço
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>TUSS</TableHead>
                <TableHead className="text-right">Tabela</TableHead>
                <TableHead className="text-right">Filme</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Repasse</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum preço cadastrado</TableCell></TableRow>
              ) : (
                filtered?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{p.convenios?.nome}</Badge></TableCell>
                    <TableCell className="font-medium">{p.tipo_exame}</TableCell>
                    <TableCell className="font-mono text-xs">{p.codigo_tuss || '—'}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_tabela)}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_filme || 0)}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_custo || 0)}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_repasse || 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(p.valor_total || p.valor_tabela)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={(v) => { setShowNew(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Preço' : 'Novo Preço de Exame por Convênio'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Convênio *</Label>
              <Select value={form.convenio_id} onValueChange={(v) => setForm(p => ({ ...p, convenio_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{convenios?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo de Exame *</Label><Input value={form.tipo_exame} onChange={(e) => setForm(p => ({ ...p, tipo_exame: e.target.value }))} placeholder="Hemograma Completo" /></div>
              <div><Label>Código TUSS</Label><Input value={form.codigo_tuss} onChange={(e) => setForm(p => ({ ...p, codigo_tuss: e.target.value }))} placeholder="40301630" /></div>
            </div>
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Tabela (R$) *</Label><Input type="number" step="0.01" value={form.valor_tabela} onChange={(e) => setForm(p => ({ ...p, valor_tabela: e.target.value }))} /></div>
              <div><Label>Valor Filme (R$)</Label><Input type="number" step="0.01" value={form.valor_filme} onChange={(e) => setForm(p => ({ ...p, valor_filme: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.valor_custo} onChange={(e) => setForm(p => ({ ...p, valor_custo: e.target.value }))} /></div>
              <div><Label>Repasse (R$)</Label><Input type="number" step="0.01" value={form.valor_repasse} onChange={(e) => setForm(p => ({ ...p, valor_repasse: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={!form.convenio_id || !form.tipo_exame || !form.valor_tabela || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───
export default function PrecosExames() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Tabela de Preços de Exames
        </h1>
        <p className="text-muted-foreground text-sm">Gerencie preços de exames internos (particular) e por convênio</p>
      </div>

      <Tabs defaultValue="particular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="particular" className="gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Particular / Interno
          </TabsTrigger>
          <TabsTrigger value="convenio" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Por Convênio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="particular">
          <PrecosInternos />
        </TabsContent>

        <TabsContent value="convenio">
          <PrecosConvenio />
        </TabsContent>
      </Tabs>
    </div>
  );
}
