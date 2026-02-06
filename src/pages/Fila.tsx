import { useState, useEffect } from 'react';
import { UserPlus, Play, Check, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useFilaAtendimento, useAgendamentos, usePacientes, useMedicos, useSalas } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  aguardando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  chamado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  em_atendimento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  finalizado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const STATUS_LABELS: Record<string, string> = {
  aguardando: 'Aguardando',
  chamado: 'Chamado',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
};

export default function Fila() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: fila = [], isLoading: loadingFila } = useFilaAtendimento();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos(today);
  const { data: pacientes = [] } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  const { data: salas = [] } = useSalas();

  const isLoading = loadingFila || loadingAgendamentos;

  // Atualizar a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const agendamentosDisponiveis = agendamentos.filter(
    (ag) => 
      ['confirmado', 'agendado'].includes(ag.status || '') && 
      !fila.some((f) => f.agendamento_id === ag.id)
  );

  const filaAtiva = fila
    .filter((f) => f.status !== 'finalizado')
    .sort((a, b) => a.posicao - b.posicao);

  const getPacienteNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return 'Desconhecido';
    return pacientes.find((p) => p.id === (ag as any).paciente_id)?.nome || 'Desconhecido';
  };

  const getMedicoNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return 'Desconhecido';
    const medico = medicos.find((m) => m.id === (ag as any).medico_id);
    return medico ? `Dr(a). ${medico.crm}` : 'Desconhecido';
  };

  const getSalaNome = (salaId: string | null) => {
    if (!salaId) return '-';
    return salas.find(s => s.id === salaId)?.nome || '-';
  };

  const handleAddToFila = async () => {
    if (!selectedAgendamento) {
      toast.error('Selecione um agendamento.');
      return;
    }

    setIsSaving(true);
    try {
      const maxPosicao = Math.max(0, ...fila.map((f) => f.posicao));

      const { error } = await supabase.from('fila_atendimento').insert({
        agendamento_id: selectedAgendamento,
        posicao: maxPosicao + 1,
        status: 'aguardando',
        horario_chegada: new Date().toISOString(),
      });

      if (error) throw error;

      // Atualizar status do agendamento
      await supabase
        .from('agendamentos')
        .update({ status: 'aguardando' })
        .eq('id', selectedAgendamento);

      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      
      setIsAddOpen(false);
      setSelectedAgendamento('');
      toast.success('Paciente adicionado à fila de atendimento.');
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast.error('Erro ao adicionar à fila.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChamar = async (item: typeof fila[0]) => {
    try {
      const { error } = await supabase
        .from('fila_atendimento')
        .update({ status: 'chamado' })
        .eq('id', item.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      toast.success(`${getPacienteNome(item.agendamento_id)} foi chamado.`);
    } catch (error) {
      console.error('Error calling patient:', error);
      toast.error('Erro ao chamar paciente.');
    }
  };

  const handleIniciarAtendimento = async (item: typeof fila[0], salaId: string) => {
    try {
      const { error: filaError } = await supabase
        .from('fila_atendimento')
        .update({ status: 'em_atendimento', sala_id: salaId })
        .eq('id', item.id);

      if (filaError) throw filaError;

      const { error: agError } = await supabase
        .from('agendamentos')
        .update({ status: 'em_atendimento' })
        .eq('id', item.agendamento_id);

      if (agError) throw agError;

      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Atendimento iniciado.');
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Erro ao iniciar atendimento.');
    }
  };

  const handleFinalizar = async (item: typeof fila[0]) => {
    try {
      const { error: filaError } = await supabase
        .from('fila_atendimento')
        .update({ status: 'finalizado' })
        .eq('id', item.id);

      if (filaError) throw filaError;

      const { error: agError } = await supabase
        .from('agendamentos')
        .update({ status: 'finalizado' })
        .eq('id', item.agendamento_id);

      if (agError) throw agError;

      queryClient.invalidateQueries({ queryKey: ['fila_atendimento'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Atendimento finalizado.');
    } catch (error) {
      console.error('Error finishing consultation:', error);
      toast.error('Erro ao finalizar atendimento.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fila de Atendimento</h1>
          <p className="text-muted-foreground">Gerencie a fila de pacientes aguardando</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/painel-tv" target="_blank">
              <Volume2 className="h-4 w-4 mr-2" />
              Abrir Painel TV
            </a>
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Registrar Chegada
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">
                {filaAtiva.filter((f) => f.status === 'aguardando').length}
              </p>
              <p className="text-sm text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">
                {filaAtiva.filter((f) => f.status === 'chamado').length}
              </p>
              <p className="text-sm text-muted-foreground">Chamados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600">
                {filaAtiva.filter((f) => f.status === 'em_atendimento').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Atendimento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">
                {fila.filter((f) => f.status === 'finalizado').length}
              </p>
              <p className="text-sm text-muted-foreground">Finalizados Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Médico</TableHead>
                  <TableHead className="hidden sm:table-cell">Chegada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Sala</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filaAtiva.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum paciente na fila
                    </TableCell>
                  </TableRow>
                ) : (
                  filaAtiva.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-lg">{item.posicao}</TableCell>
                      <TableCell className="font-medium">
                        {getPacienteNome(item.agendamento_id)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getMedicoNome(item.agendamento_id)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.horario_chegada ? format(new Date(item.horario_chegada), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[item.status || 'aguardando'])}>
                          {STATUS_LABELS[item.status || 'aguardando']}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getSalaNome(item.sala_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === 'aguardando' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChamar(item)}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                          {(item.status === 'aguardando' || item.status === 'chamado') && salas.length > 0 && (
                            <Select onValueChange={(salaId) => handleIniciarAtendimento(item, salaId)}>
                              <SelectTrigger className="w-auto">
                                <Play className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                {salas.filter(s => s.status === 'disponivel').map(sala => (
                                  <SelectItem key={sala.id} value={sala.id}>{sala.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {item.status === 'em_atendimento' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFinalizar(item)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Add to Queue Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Chegada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Agendamento</Label>
              <Select value={selectedAgendamento} onValueChange={setSelectedAgendamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um agendamento de hoje" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentosDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum agendamento disponível
                    </SelectItem>
                  ) : (
                    agendamentosDisponiveis.map((ag) => {
                      const agData = ag as any;
                      const paciente = pacientes.find((p) => p.id === agData.paciente_id);
                      const medico = medicos.find((m) => m.id === agData.medico_id);
                      return (
                        <SelectItem key={ag.id} value={ag.id}>
                          {ag.hora_inicio} - {paciente?.nome || 'Paciente'} ({medico?.crm || 'Médico'})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleAddToFila} disabled={!selectedAgendamento || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar à Fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
