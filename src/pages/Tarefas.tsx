import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ListTodo, Plus, CheckCircle2, Clock, AlertTriangle, Circle, Search, Trash2,
, Flag, AlertCircle} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Circle },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-700' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};


const PRIORIDADE_COLORS: Record<string, string> = {
  alta: 'text-destructive',
  media: 'text-warning', 
  baixa: 'text-success',
};

const PRIORIDADE_ICONS: Record<string, string> = {
  alta: '🔴',
  media: '🟡',
  baixa: '🟢',
};

export default function Tarefas() {
  const { user } = useSupabaseAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ['profiles-tarefas'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, nome').order('nome');
      return data || [];
    },
  });

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tarefas')
        .select('*, responsavel:profiles!tarefas_responsavel_id_fkey(nome), criador:profiles!tarefas_criado_por_fkey(nome)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createTarefa = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('tarefas').insert({ ...form, criado_por: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Tarefa criada!');
      setShowNew(false);
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  const updateTarefa = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      if (updates.status === 'concluida') updates.data_conclusao = new Date().toISOString();
      const { error } = await supabase.from('tarefas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Tarefa atualizada');
    },
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tarefas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Tarefa removida');
    },
  });

  const filtered = tarefas?.filter((t: any) => {
    const matchSearch = t.titulo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tarefas?.length || 0,
    pendentes: tarefas?.filter((t: any) => t.status === 'pendente').length || 0,
    emAndamento: tarefas?.filter((t: any) => t.status === 'em_andamento').length || 0,
    concluidas: tarefas?.filter((t: any) => t.status === 'concluida').length || 0,
  };

  const [form, setForm] = useState({
    titulo: '', descricao: '', prioridade: 'media', responsavel_id: '',
    data_vencimento: '', categoria: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" /> Tarefas Internas
          </h1>
          <p className="text-muted-foreground">Gerencie tarefas da equipe</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" /> Nova Tarefa</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-primary' },
          { label: 'Pendentes', value: stats.pendentes, color: 'text-yellow-500' },
          { label: 'Em Andamento', value: stats.emAndamento, color: 'text-blue-500' },
          { label: 'Concluídas', value: stats.concluidas, color: 'text-green-500' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
          filtered?.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tarefa</CardContent></Card> :
          filtered?.map((t: any) => {
            const sc = statusConfig[t.status] || statusConfig.pendente;
            const pc = prioridadeConfig[t.prioridade] || prioridadeConfig.media;
            const vencida = t.data_vencimento && isPast(new Date(t.data_vencimento)) && t.status !== 'concluida' && t.status !== 'cancelada';
            const hoje = t.data_vencimento && isToday(new Date(t.data_vencimento));
            return (
              <Card key={t.id} className={vencida ? 'border-red-500/50' : hoje ? 'border-yellow-500/50' : ''}>
                <CardContent className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${t.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</span>
                      <Badge className={sc.color}>{sc.label}</Badge>
                      <Badge className={pc.color}>{pc.label}</Badge>
                      {t.categoria && <Badge variant="outline">{t.categoria}</Badge>}
                      {vencida && <Badge variant="destructive">Vencida</Badge>}
                    </div>
                    {t.descricao && <p className="text-sm text-muted-foreground line-clamp-1">{t.descricao}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t.responsavel?.nome && `Responsável: ${t.responsavel.nome}`}
                      {t.data_vencimento && ` • Vencimento: ${format(new Date(t.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {t.status === 'pendente' && (
                      <Button size="sm" variant="outline" onClick={() => updateTarefa.mutate({ id: t.id, status: 'em_andamento' })}>Iniciar</Button>
                    )}
                    {t.status === 'em_andamento' && (
                      <Button size="sm" variant="outline" onClick={() => updateTarefa.mutate({ id: t.id, status: 'concluida' })}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Concluir
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTarefa.mutate(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        }
      </div>

      {/* Dialog Nova Tarefa */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createTarefa.mutate({
              ...form,
              responsavel_id: form.responsavel_id || null,
              data_vencimento: form.data_vencimento || null,
              categoria: form.categoria || null,
            });
            setForm({ titulo: '', descricao: '', prioridade: 'media', responsavel_id: '', data_vencimento: '', categoria: '' });
          }} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm(p => ({ ...p, prioridade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(prioridadeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={(e) => setForm(p => ({ ...p, data_vencimento: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Select value={form.responsavel_id} onValueChange={(v) => setForm(p => ({ ...p, responsavel_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{profiles?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm(p => ({ ...p, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {['Administrativo', 'Clínico', 'Financeiro', 'TI', 'Manutenção', 'RH', 'Outro'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!form.titulo}>Criar Tarefa</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
