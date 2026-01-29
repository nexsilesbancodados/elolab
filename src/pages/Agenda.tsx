import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Agendamento, Paciente, User as UserType, StatusAgendamento } from '@/types';
import { getAll, generateId } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

const STATUS_COLORS: Record<StatusAgendamento, string> = {
  agendado: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  aguardando: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  em_atendimento: 'bg-purple-100 text-purple-800 border-purple-200',
  finalizado: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
  faltou: 'bg-orange-100 text-orange-800 border-orange-200',
};

const STATUS_LABELS: Record<StatusAgendamento, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMedico, setSelectedMedico] = useState<string>('todos');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<UserType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ data: string; hora: string } | null>(null);
  const [formData, setFormData] = useState<Partial<Agendamento>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<UserType>('users').filter((u) => u.role === 'medico'));
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);

  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((ag) => {
      if (selectedMedico !== 'todos' && ag.medicoId !== selectedMedico) return false;
      return true;
    });
  }, [agendamentos, selectedMedico]);

  const getAgendamentoForSlot = (data: Date, hora: string): Agendamento | undefined => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return filteredAgendamentos.find(
      (ag) => ag.data === dataStr && ag.horaInicio === hora
    );
  };

  const handleSlotClick = (data: Date, hora: string) => {
    const existing = getAgendamentoForSlot(data, hora);
    if (existing) {
      // Edit existing
      setFormData(existing);
    } else {
      // New appointment
      setSelectedSlot({ data: format(data, 'yyyy-MM-dd'), hora });
      setFormData({
        data: format(data, 'yyyy-MM-dd'),
        horaInicio: hora,
        horaFim: HORARIOS[HORARIOS.indexOf(hora) + 1] || '18:30',
        tipo: 'consulta',
        status: 'agendado',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.medicoId) {
      toast({
        title: 'Erro',
        description: 'Selecione o paciente e o médico.',
        variant: 'destructive',
      });
      return;
    }

    const allAgendamentos = getAll<Agendamento>('agendamentos');

    if (formData.id) {
      // Update
      const index = allAgendamentos.findIndex((a) => a.id === formData.id);
      if (index !== -1) {
        allAgendamentos[index] = { ...allAgendamentos[index], ...formData } as Agendamento;
      }
    } else {
      // Create
      const newAgendamento: Agendamento = {
        ...formData,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as Agendamento;
      allAgendamentos.push(newAgendamento);
    }

    localStorage.setItem('elolab_clinic_agendamentos', JSON.stringify(allAgendamentos));
    loadData();
    setIsFormOpen(false);
    toast({
      title: formData.id ? 'Agendamento atualizado' : 'Agendamento criado',
      description: 'A agenda foi atualizada com sucesso.',
    });
  };

  const handleStatusChange = (status: StatusAgendamento) => {
    setFormData({ ...formData, status });
  };

  const getPacienteNome = (id: string) => pacientes.find((p) => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => medicos.find((m) => m.id === id)?.nome || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMedico} onValueChange={setSelectedMedico}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os médicos</SelectItem>
              {medicos.map((medico) => (
                <SelectItem key={medico.id} value={medico.id}>
                  {medico.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(weekDays[0], "dd 'de' MMMM", { locale: ptBR })} -{' '}
                {format(weekDays[6], "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
              Hoje
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 border-b bg-muted/50">
                <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
                  Horário
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'p-2 text-center border-r last:border-r-0',
                      isSameDay(day, new Date()) && 'bg-primary/10'
                    )}
                  >
                    <p className="text-sm font-medium">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p
                      className={cn(
                        'text-lg',
                        isSameDay(day, new Date()) && 'text-primary font-bold'
                      )}
                    >
                      {format(day, 'dd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className="divide-y">
                {HORARIOS.map((hora) => (
                  <div key={hora} className="grid grid-cols-8">
                    <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/30">
                      {hora}
                    </div>
                    {weekDays.map((day) => {
                      const agendamento = getAgendamentoForSlot(day, hora);
                      return (
                        <div
                          key={`${day.toISOString()}-${hora}`}
                          className={cn(
                            'p-1 border-r last:border-r-0 min-h-[60px] cursor-pointer hover:bg-muted/30 transition-colors',
                            isSameDay(day, new Date()) && 'bg-primary/5'
                          )}
                          onClick={() => handleSlotClick(day, hora)}
                        >
                          {agendamento && (
                            <div
                              className={cn(
                                'rounded p-1.5 text-xs border',
                                STATUS_COLORS[agendamento.status]
                              )}
                            >
                              <p className="font-medium truncate">
                                {getPacienteNome(agendamento.pacienteId)}
                              </p>
                              <p className="truncate opacity-75">
                                {getMedicoNome(agendamento.medicoId)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Badge key={key} className={cn('text-xs', STATUS_COLORS[key as StatusAgendamento])}>
            {label}
          </Badge>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  <Clock className="h-4 w-4" />
                  {formData.data && format(parseISO(formData.data), "dd/MM/yyyy")}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  <Clock className="h-4 w-4" />
                  {formData.horaInicio}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.pacienteId}
                onValueChange={(v) => setFormData({ ...formData, pacienteId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Médico *</Label>
              <Select
                value={formData.medicoId}
                onValueChange={(v) => setFormData({ ...formData, medicoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} - {m.especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                    <SelectItem value="exame">Exame</SelectItem>
                    <SelectItem value="procedimento">Procedimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleStatusChange(v as StatusAgendamento)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
