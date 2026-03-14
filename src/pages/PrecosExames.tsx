import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DollarSign, Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';

export default function PrecosExames() {
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
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('precos_exames_convenio').insert({
          convenio_id: form.convenio_id, tipo_exame: form.tipo_exame, codigo_tuss: form.codigo_tuss || null,
          descricao: form.descricao || null, valor_tabela: +form.valor_tabela, valor_filme: form.valor_filme ? +form.valor_filme : 0,
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
    convenio_id: '', tipo_exame: '', codigo_tuss: '', descricao: '', valor_tabela: '', valor_filme: '',
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      convenio_id: p.convenio_id, tipo_exame: p.tipo_exame, codigo_tuss: p.codigo_tuss || '',
      descricao: p.descricao || '', valor_tabela: String(p.valor_tabela), valor_filme: String(p.valor_filme || ''),
    });
    setShowNew(true);
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Preços de Exames por Convênio
          </h1>
          <p className="text-muted-foreground">Tabela de preços para faturamento de exames laboratoriais</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ convenio_id: '', tipo_exame: '', codigo_tuss: '', descricao: '', valor_tabela: '', valor_filme: '' }); setShowNew(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Preço
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>TUSS</TableHead>
                <TableHead className="text-right">Valor Tabela</TableHead>
                <TableHead className="text-right">Filme</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum preço cadastrado</TableCell></TableRow>
              ) : (
                filtered?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />{p.convenios?.nome}</Badge></TableCell>
                    <TableCell className="font-medium">{p.tipo_exame}</TableCell>
                    <TableCell className="font-mono text-xs">{p.codigo_tuss || '-'}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_tabela)}</TableCell>
                    <TableCell className="text-right">{fmt(p.valor_filme || 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(p.valor_total)}</TableCell>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Preço' : 'Novo Preço de Exame'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Convênio *</Label>
              <Select value={form.convenio_id} onValueChange={(v) => setForm(p => ({ ...p, convenio_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{convenios?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo de Exame *</Label><Input value={form.tipo_exame} onChange={(e) => setForm(p => ({ ...p, tipo_exame: e.target.value }))} placeholder="Hemograma Completo" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Código TUSS</Label><Input value={form.codigo_tuss} onChange={(e) => setForm(p => ({ ...p, codigo_tuss: e.target.value }))} placeholder="40301630" /></div>
              <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Tabela (R$) *</Label><Input type="number" step="0.01" value={form.valor_tabela} onChange={(e) => setForm(p => ({ ...p, valor_tabela: e.target.value }))} /></div>
              <div><Label>Valor Filme (R$)</Label><Input type="number" step="0.01" value={form.valor_filme} onChange={(e) => setForm(p => ({ ...p, valor_filme: e.target.value }))} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={!form.convenio_id || !form.tipo_exame || !form.valor_tabela}>
              {editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
