import { useState, useEffect } from 'react';
import { UserPlus, Play, Check, XCircle, Volume2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FilaAtendimento, Agendamento, Paciente, User } from '@/types';
import { getAll, generateId } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_COLORS = {
  aguardando: 'bg-yellow-100 text-yellow-800',
  chamado: 'bg-blue-100 text-blue-800',
  em_atendimento: 'bg-purple-100 text-purple-800',
  finalizado: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  aguardando: 'Aguardando',
  chamado: 'Chamado',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
};

export default function Fila() {
  const [fila, setFila] = useState<FilaAtendimento[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setFila(getAll<FilaAtendimento>('fila'));
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter((u) => u.role === 'medico'));
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const agendamentosHoje = agendamentos.filter(
    (ag) => ag.data === today && ['confirmado', 'agendado'].includes(ag.status)
  );

  const agendamentosDisponiveis = agendamentosHoje.filter(
    (ag) => !fila.some((f) => f.agendamentoId === ag.id)
  );

  const filaAtiva = fila
    .filter((f) => f.status !== 'finalizado')
    .sort((a, b) => a.posicao - b.posicao);

  const getPacienteNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return 'Desconhecido';
    return pacientes.find((p) => p.id === ag.pacienteId)?.nome || 'Desconhecido';
  };

  const getMedicoNome = (agendamentoId: string) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return 'Desconhecido';
    return medicos.find((m) => m.id === ag.medicoId)?.nome || 'Desconhecido';
  };

  const handleAddToFila = () => {
    if (!selectedAgendamento) {
      toast({
        title: 'Erro',
        description: 'Selecione um agendamento.',
        variant: 'destructive',
      });
      return;
    }

    const allFila = getAll<FilaAtendimento>('fila');
    const maxPosicao = Math.max(0, ...allFila.map((f) => f.posicao));

    const novoItem: FilaAtendimento = {
      id: generateId(),
      agendamentoId: selectedAgendamento,
      posicao: maxPosicao + 1,
      horarioChegada: new Date().toISOString(),
      status: 'aguardando',
    };

    allFila.push(novoItem);
    localStorage.setItem('elolab_clinic_fila', JSON.stringify(allFila));

    // Update agendamento status
    const allAgendamentos = getAll<Agendamento>('agendamentos');
    const agIndex = allAgendamentos.findIndex((a) => a.id === selectedAgendamento);
    if (agIndex !== -1) {
      allAgendamentos[agIndex].status = 'aguardando';
      localStorage.setItem('elolab_clinic_agendamentos', JSON.stringify(allAgendamentos));
    }

    loadData();
    setIsAddOpen(false);
    setSelectedAgendamento('');
    toast({
      title: 'Paciente adicionado',
      description: 'O paciente foi adicionado à fila de atendimento.',
    });
  };

  const handleChamar = (item: FilaAtendimento) => {
    updateFilaStatus(item.id, 'chamado');
    // Could trigger voice announcement here
    toast({
      title: 'Paciente chamado',
      description: `${getPacienteNome(item.agendamentoId)} foi chamado.`,
    });
  };

  const handleIniciarAtendimento = (item: FilaAtendimento, sala: string) => {
    const allFila = getAll<FilaAtendimento>('fila');
    const index = allFila.findIndex((f) => f.id === item.id);
    if (index !== -1) {
      allFila[index].status = 'em_atendimento';
      allFila[index].sala = sala;
      localStorage.setItem('elolab_clinic_fila', JSON.stringify(allFila));
    }

    // Update agendamento
    const allAgendamentos = getAll<Agendamento>('agendamentos');
    const agIndex = allAgendamentos.findIndex((a) => a.id === item.agendamentoId);
    if (agIndex !== -1) {
      allAgendamentos[agIndex].status = 'em_atendimento';
      localStorage.setItem('elolab_clinic_agendamentos', JSON.stringify(allAgendamentos));
    }

    loadData();
    toast({
      title: 'Atendimento iniciado',
      description: `Paciente encaminhado para ${sala}.`,
    });
  };

  const handleFinalizar = (item: FilaAtendimento) => {
    updateFilaStatus(item.id, 'finalizado');

    // Update agendamento
    const allAgendamentos = getAll<Agendamento>('agendamentos');
    const agIndex = allAgendamentos.findIndex((a) => a.id === item.agendamentoId);
    if (agIndex !== -1) {
      allAgendamentos[agIndex].status = 'finalizado';
      localStorage.setItem('elolab_clinic_agendamentos', JSON.stringify(allAgendamentos));
    }

    loadData();
    toast({
      title: 'Atendimento finalizado',
      description: 'O atendimento foi concluído.',
    });
  };

  const updateFilaStatus = (id: string, status: FilaAtendimento['status']) => {
    const allFila = getAll<FilaAtendimento>('fila');
    const index = allFila.findIndex((f) => f.id === id);
    if (index !== -1) {
      allFila[index].status = status;
      localStorage.setItem('elolab_clinic_fila', JSON.stringify(allFila));
    }
    loadData();
  };

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
                        {getPacienteNome(item.agendamentoId)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getMedicoNome(item.agendamentoId)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {format(new Date(item.horarioChegada), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[item.status])}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.sala || '-'}</TableCell>
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
                          {(item.status === 'aguardando' || item.status === 'chamado') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleIniciarAtendimento(item, 'Consultório 1')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
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
                      const paciente = pacientes.find((p) => p.id === ag.pacienteId);
                      const medico = medicos.find((m) => m.id === ag.medicoId);
                      return (
                        <SelectItem key={ag.id} value={ag.id}>
                          {ag.horaInicio} - {paciente?.nome || 'Paciente'} ({medico?.nome || 'Médico'})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddToFila} disabled={!selectedAgendamento}>
              Adicionar à Fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
