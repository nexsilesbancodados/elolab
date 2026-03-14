import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FlaskConical, Search, Plus, TestTube, ClipboardCheck, AlertTriangle,
  Clock, CheckCircle2, XCircle, Eye, Printer, Download,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  coletado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  em_analise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  validado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  liberado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  coletado: 'Coletado',
  em_analise: 'Em Análise',
  validado: 'Validado',
  liberado: 'Liberado',
  cancelado: 'Cancelado',
};

export default function Laboratorio() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('coletas');
  const [showNewColeta, setShowNewColeta] = useState(false);
  const [showResultados, setShowResultados] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: pacientes } = useQuery({
    queryKey: ['pacientes-lab'],
    queryFn: async () => {
      const { data } = await supabase.from('pacientes').select('id, nome').order('nome');
      return data || [];
    },
  });

  const { data: medicos } = useQuery({
    queryKey: ['medicos-lab'],
    queryFn: async () => {
      const { data } = await supabase.from('medicos').select('id, crm, especialidade').order('crm');
      return data || [];
    },
  });

  const { data: coletas, isLoading } = useQuery({
    queryKey: ['coletas-laboratorio'],
    queryFn: async () => {
      const { data } = await supabase
        .from('coletas_laboratorio')
        .select('*, pacientes(nome), medicos(crm, especialidade)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: resultados } = useQuery({
    queryKey: ['resultados-laboratorio', showResultados],
    queryFn: async () => {
      if (!showResultados) return [];
      const { data } = await supabase
        .from('resultados_laboratorio')
        .select('*')
        .eq('coleta_id', showResultados)
        .order('parametro');
      return data || [];
    },
    enabled: !!showResultados,
  });

  const createColeta = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('coletas_laboratorio').insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas-laboratorio'] });
      toast.success('Coleta registrada com sucesso!');
      setShowNewColeta(false);
    },
    onError: () => toast.error('Erro ao registrar coleta'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'coletado') updates.data_coleta = new Date().toISOString();
      const { error } = await supabase.from('coletas_laboratorio').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas-laboratorio'] });
      toast.success('Status atualizado');
    },
  });

  const addResultado = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('resultados_laboratorio').insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultados-laboratorio'] });
      toast.success('Resultado adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar resultado'),
  });

  const filtered = coletas?.filter((c: any) =>
    c.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo_amostra?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pendentes: coletas?.filter((c: any) => c.status === 'pendente').length || 0,
    coletados: coletas?.filter((c: any) => c.status === 'coletado').length || 0,
    emAnalise: coletas?.filter((c: any) => c.status === 'em_analise').length || 0,
    liberados: coletas?.filter((c: any) => c.status === 'liberado').length || 0,
  };

  const [newColetaForm, setNewColetaForm] = useState({
    paciente_id: '', medico_solicitante_id: '', tipo_amostra: 'sangue',
    tubo: '', observacoes: '', jejum_necessario: false, jejum_horas: 0, urgente: false,
  });

  const [newResultForm, setNewResultForm] = useState({
    parametro: '', resultado: '', unidade: '', valor_referencia_min: '',
    valor_referencia_max: '', valor_referencia_texto: '', metodo: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" /> Laboratório
          </h1>
          <p className="text-muted-foreground">Gestão de coletas, amostras e resultados laboratoriais</p>
        </div>
        <Button onClick={() => setShowNewColeta(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Coleta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pendentes', value: stats.pendentes, icon: Clock, color: 'text-yellow-500' },
          { label: 'Coletados', value: stats.coletados, icon: TestTube, color: 'text-blue-500' },
          { label: 'Em Análise', value: stats.emAnalise, icon: ClipboardCheck, color: 'text-purple-500' },
          { label: 'Liberados', value: stats.liberados, icon: CheckCircle2, color: 'text-green-500' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por paciente ou código..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Coletas list */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : filtered?.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma coleta encontrada</CardContent></Card>
        ) : (
          filtered?.map((coleta: any) => (
            <Card key={coleta.id} className={coleta.urgente ? 'border-red-500/50' : ''}>
              <CardContent className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{coleta.pacientes?.nome}</span>
                    <Badge variant="outline" className="font-mono text-xs">{coleta.codigo_amostra}</Badge>
                    <Badge className={statusColors[coleta.status]}>{statusLabels[coleta.status]}</Badge>
                    {coleta.urgente && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Urgente</Badge>}
                    {coleta.jejum_necessario && <Badge variant="outline">Jejum {coleta.jejum_horas}h</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {coleta.tipo_amostra} {coleta.tubo && `• Tubo: ${coleta.tubo}`} • Dr(a). {coleta.medicos?.crm}
                    {coleta.data_coleta && ` • Coletado: ${format(new Date(coleta.data_coleta), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {coleta.status === 'pendente' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: coleta.id, status: 'coletado' })}>
                      <TestTube className="h-3 w-3 mr-1" /> Coletar
                    </Button>
                  )}
                  {coleta.status === 'coletado' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: coleta.id, status: 'em_analise' })}>
                      Iniciar Análise
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setShowResultados(coleta.id)}>
                    <Eye className="h-3 w-3 mr-1" /> Resultados
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Nova Coleta */}
      <Dialog open={showNewColeta} onOpenChange={setShowNewColeta}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Coleta de Amostra</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createColeta.mutate({
              ...newColetaForm,
              jejum_horas: newColetaForm.jejum_horas || null,
            });
          }} className="space-y-4">
            <div>
              <Label>Paciente *</Label>
              <Select value={newColetaForm.paciente_id} onValueChange={(v) => setNewColetaForm(p => ({ ...p, paciente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{pacientes?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Médico Solicitante</Label>
              <Select value={newColetaForm.medico_solicitante_id} onValueChange={(v) => setNewColetaForm(p => ({ ...p, medico_solicitante_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{medicos?.map((m: any) => <SelectItem key={m.id} value={m.id}>CRM {m.crm} - {m.especialidade}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Amostra</Label>
                <Select value={newColetaForm.tipo_amostra} onValueChange={(v) => setNewColetaForm(p => ({ ...p, tipo_amostra: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['sangue', 'urina', 'fezes', 'escarro', 'secreção', 'líquor', 'outro'].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tubo</Label>
                <Input value={newColetaForm.tubo} onChange={(e) => setNewColetaForm(p => ({ ...p, tubo: e.target.value }))} placeholder="Ex: EDTA, Seco..." />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox checked={newColetaForm.jejum_necessario} onCheckedChange={(v) => setNewColetaForm(p => ({ ...p, jejum_necessario: !!v }))} />
                <Label>Jejum necessário</Label>
              </div>
              {newColetaForm.jejum_necessario && (
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-20" value={newColetaForm.jejum_horas}
                    onChange={(e) => setNewColetaForm(p => ({ ...p, jejum_horas: +e.target.value }))} />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox checked={newColetaForm.urgente} onCheckedChange={(v) => setNewColetaForm(p => ({ ...p, urgente: !!v }))} />
                <Label className="text-red-500">Urgente</Label>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={newColetaForm.observacoes} onChange={(e) => setNewColetaForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={!newColetaForm.paciente_id}>Registrar Coleta</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Resultados */}
      <Dialog open={!!showResultados} onOpenChange={() => setShowResultados(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Resultados Laboratoriais</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {resultados?.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum resultado cadastrado ainda</p>}
            {resultados?.map((r: any) => {
              const numResult = parseFloat(r.resultado);
              const isAltered = !isNaN(numResult) && ((r.valor_referencia_min != null && numResult < r.valor_referencia_min) || (r.valor_referencia_max != null && numResult > r.valor_referencia_max));
              return (
                <div key={r.id} className={`p-3 rounded-lg border ${isAltered ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{r.parametro}</p>
                      <p className="text-sm text-muted-foreground">{r.metodo && `Método: ${r.metodo}`}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isAltered ? 'text-red-600' : ''}`}>
                        {r.resultado} {r.unidade}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ref: {r.valor_referencia_texto || `${r.valor_referencia_min ?? '-'} a ${r.valor_referencia_max ?? '-'} ${r.unidade || ''}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Form add resultado */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Adicionar Resultado</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!showResultados) return;
                  const coleta = coletas?.find((c: any) => c.id === showResultados);
                  addResultado.mutate({
                    coleta_id: showResultados,
                    paciente_id: coleta?.paciente_id,
                    parametro: newResultForm.parametro,
                    resultado: newResultForm.resultado,
                    unidade: newResultForm.unidade || null,
                    valor_referencia_min: newResultForm.valor_referencia_min ? +newResultForm.valor_referencia_min : null,
                    valor_referencia_max: newResultForm.valor_referencia_max ? +newResultForm.valor_referencia_max : null,
                    valor_referencia_texto: newResultForm.valor_referencia_texto || null,
                    metodo: newResultForm.metodo || null,
                  });
                  setNewResultForm({ parametro: '', resultado: '', unidade: '', valor_referencia_min: '', valor_referencia_max: '', valor_referencia_texto: '', metodo: '' });
                }} className="grid grid-cols-2 gap-3">
                  <div><Label>Parâmetro *</Label><Input value={newResultForm.parametro} onChange={(e) => setNewResultForm(p => ({ ...p, parametro: e.target.value }))} placeholder="Ex: Hemoglobina" /></div>
                  <div><Label>Resultado *</Label><Input value={newResultForm.resultado} onChange={(e) => setNewResultForm(p => ({ ...p, resultado: e.target.value }))} placeholder="Ex: 14.2" /></div>
                  <div><Label>Unidade</Label><Input value={newResultForm.unidade} onChange={(e) => setNewResultForm(p => ({ ...p, unidade: e.target.value }))} placeholder="g/dL" /></div>
                  <div><Label>Método</Label><Input value={newResultForm.metodo} onChange={(e) => setNewResultForm(p => ({ ...p, metodo: e.target.value }))} placeholder="Automatizado" /></div>
                  <div><Label>Ref. Mínimo</Label><Input type="number" step="any" value={newResultForm.valor_referencia_min} onChange={(e) => setNewResultForm(p => ({ ...p, valor_referencia_min: e.target.value }))} /></div>
                  <div><Label>Ref. Máximo</Label><Input type="number" step="any" value={newResultForm.valor_referencia_max} onChange={(e) => setNewResultForm(p => ({ ...p, valor_referencia_max: e.target.value }))} /></div>
                  <div className="col-span-2">
                    <Button type="submit" size="sm" disabled={!newResultForm.parametro || !newResultForm.resultado}>Adicionar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
