import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DoorOpen, Settings, Bed, Loader2 , Users, CheckCircle2, XCircle} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSalas } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from '@/integrations/supabase/types';

type StatusSala = Database['public']['Enums']['status_sala'];

const SALA_STATUS_COLORS: Record<StatusSala, string> = {
  disponivel: 'bg-green-500',
  ocupado: 'bg-red-500',
  manutencao: 'bg-yellow-500',
  limpeza: 'bg-blue-500',
};

const SALA_STATUS_LABELS: Record<StatusSala, string> = {
  disponivel: 'Disponível',
  ocupado: 'Ocupado',
  manutencao: 'Manutenção',
  limpeza: 'Limpeza',
};

const TIPO_LABELS: Record<string, string> = {
  consultorio: 'Consultório',
  exame: 'Sala de Exames',
  procedimento: 'Sala de Procedimentos',
  triagem: 'Triagem',
  espera: 'Sala de Espera',
};

export default function Salas() {
  const [isSalaDialogOpen, setIsSalaDialogOpen] = useState(false);
  const [editingSalaId, setEditingSalaId] = useState<string | null>(null);
  const [salaFormData, setSalaFormData] = useState({
    nome: '',
    tipo: 'consultorio',
    capacidade: 1,
    status: 'disponivel' as StatusSala,
    medico_responsavel: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salas = [], isLoading } = useSalas();

  const handleOpenSalaDialog = (sala?: any) => {
    if (sala) {
      setEditingSalaId(sala.id);
      setSalaFormData({
        nome: sala.nome,
        tipo: sala.tipo || 'consultorio',
        capacidade: sala.capacidade || 1,
        status: sala.status || 'disponivel',
        medico_responsavel: sala.medico_responsavel || '',
      });
    } else {
      setEditingSalaId(null);
      setSalaFormData({
        nome: '',
        tipo: 'consultorio',
        capacidade: 1,
        status: 'disponivel',
        medico_responsavel: '',
      });
    }
    setIsSalaDialogOpen(true);
  };

  const handleSaveSala = async () => {
    if (!salaFormData.nome) {
      toast({ title: 'Erro', description: 'Preencha o nome da sala.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nome: salaFormData.nome,
        tipo: salaFormData.tipo,
        capacidade: salaFormData.capacidade,
        status: salaFormData.status as StatusSala,
        medico_responsavel: salaFormData.medico_responsavel || null,
      };

      if (editingSalaId) {
        const { error } = await supabase.from('salas').update(payload).eq('id', editingSalaId);
        if (error) throw error;
        toast({ title: 'Sala atualizada' });
      } else {
        const { error } = await supabase.from('salas').insert(payload);
        if (error) throw error;
        toast({ title: 'Sala cadastrada' });
      }

      queryClient.invalidateQueries({ queryKey: ['salas'] });
      setIsSalaDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving sala:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar sala.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeSalaStatus = async (sala: any, newStatus: StatusSala) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus !== 'ocupado') updateData.medico_responsavel = null;

      const { error } = await supabase.from('salas').update(updateData).eq('id', sala.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['salas'] });
      toast({ title: 'Status atualizado', description: `${sala.nome} está ${SALA_STATUS_LABELS[newStatus]}.` });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const salasPorTipo: Record<string, any[]> = {};
  for (const sala of salas) {
    const tipo = (sala as any).tipo || 'consultorio';
    if (!salasPorTipo[tipo]) salasPorTipo[tipo] = [];
    salasPorTipo[tipo].push(sala);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salas e Leitos</h1>
          <p className="text-muted-foreground">Gerencie a disponibilidade de espaços</p>
        </div>
      </div>

      <Tabs defaultValue="salas">
        <TabsList>
          <TabsTrigger value="salas" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            Salas ({salas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salas" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid gap-4 md:grid-cols-4">
              {(['disponivel', 'ocupada', 'manutencao', 'limpeza'] as StatusSala[]).map(status => (
                <Card key={status} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{salas.filter((s: any) => s.status === status).length}</p>
                      <p className="text-sm text-muted-foreground">{SALA_STATUS_LABELS[status]}</p>
                    </div>
                    <div className={cn('w-4 h-4 rounded-full', SALA_STATUS_COLORS[status])} />
                  </div>
                </Card>
              ))}
            </div>
            <Button onClick={() => handleOpenSalaDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Sala
            </Button>
          </div>

          {Object.entries(salasPorTipo).map(([tipo, salasDoTipo]) => {
            if (salasDoTipo.length === 0) return null;
            return (
              <Card key={tipo}>
                <CardHeader>
                  <CardTitle>{TIPO_LABELS[tipo] || tipo} ({salasDoTipo.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {salasDoTipo.map((sala: any) => (
                      <Card key={sala.id} className="relative overflow-hidden">
                        <div className={cn('absolute top-0 left-0 right-0 h-1', SALA_STATUS_COLORS[sala.status as StatusSala] || 'bg-gray-400')} />
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{sala.nome}</h4>
                              <p className="text-sm text-muted-foreground">Capacidade: {sala.capacidade}</p>
                            </div>
                            <Badge variant="outline">{SALA_STATUS_LABELS[sala.status as StatusSala] || sala.status}</Badge>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {sala.status === 'disponivel' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'ocupado')}>
                                Ocupar
                              </Button>
                            )}
                            {sala.status === 'ocupado' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'limpeza')}>
                                Liberar
                              </Button>
                            )}
                            {sala.status === 'limpeza' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'disponivel')}>
                                Pronta
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleOpenSalaDialog(sala)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Sala Dialog */}
      <Dialog open={isSalaDialogOpen} onOpenChange={setIsSalaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSalaId ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Sala *</Label>
              <Input value={salaFormData.nome} onChange={(e) => setSalaFormData({ ...salaFormData, nome: e.target.value })} placeholder="Consultório 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={salaFormData.tipo} onValueChange={(v) => setSalaFormData({ ...salaFormData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultorio">Consultório</SelectItem>
                    <SelectItem value="exame">Sala de Exames</SelectItem>
                    <SelectItem value="procedimento">Procedimentos</SelectItem>
                    <SelectItem value="triagem">Triagem</SelectItem>
                    <SelectItem value="espera">Sala de Espera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input type="number" min={1} value={salaFormData.capacidade} onChange={(e) => setSalaFormData({ ...salaFormData, capacidade: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={salaFormData.status} onValueChange={(v: StatusSala) => setSalaFormData({ ...salaFormData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SALA_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSala} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
