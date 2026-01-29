import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Repeat } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

const RECURRENCE_OPTIONS = {
  none: 'Não repetir',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
};

interface RecurrenceConfig {
  type: 'none' | 'weekly' | 'biweekly' | 'monthly';
  occurrences: number;
}

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMedico, setSelectedMedico] = useState<string>('todos');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<UserType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ data: string; hora: string } | null>(null);
  const [formData, setFormData] = useState<Partial<Agendamento>>({});
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({ type: 'none', occurrences: 4 });
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
      setFormData(existing);
      setRecurrence({ type: 'none', occurrences: 4 });
    } else {
      setSelectedSlot({ data: format(data, 'yyyy-MM-dd'), hora });
      setFormData({
        data: format(data, 'yyyy-MM-dd'),
        horaInicio: hora,
        horaFim: HORARIOS[HORARIOS.indexOf(hora) + 1] || '18:30',
        tipo: 'consulta',
        status: 'agendado',
      });
      setRecurrence({ type: 'none', occurrences: 4 });
    }
    setIsFormOpen(true);
  };

  const generateRecurringDates = (startDate: string, config: RecurrenceConfig): string[] => {
    if (config.type === 'none') return [startDate];

    const dates: string[] = [];
    let currentDate = parseISO(startDate);

    for (let i = 0; i < config.occurrences; i++) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      
      switch (config.type) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }

    return dates;
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
      // Update existing
      const index = allAgendamentos.findIndex((a) => a.id === formData.id);
      if (index !== -1) {
        allAgendamentos[index] = { ...allAgendamentos[index], ...formData } as Agendamento;
      }
    } else {
      // Create new (possibly recurring)
      const dates = generateRecurringDates(formData.data!, recurrence);
      const recurrenceGroupId = recurrence.type !== 'none' ? generateId() : undefined;

      dates.forEach((date) => {
        const newAgendamento: Agendamento = {
          ...formData,
          id: generateId(),
          data: date,
          recurrenceGroupId,
          criadoEm: new Date().toISOString(),
        } as Agendamento;
        allAgendamentos.push(newAgendamento);
      });
    }

    localStorage.setItem('elolab_clinic_agendamentos', JSON.stringify(allAgendamentos));
    loadData();
    setIsFormOpen(false);
    setRecurrence({ type: 'none', occurrences: 4 });
    
    const count = recurrence.type !== 'none' && !formData.id ? recurrence.occurrences : 1;
    toast({
      title: formData.id ? 'Agendamento atualizado' : `${count} agendamento(s) criado(s)`,
      description: recurrence.type !== 'none' && !formData.id 
        ? `Consultas agendadas: ${RECURRENCE_OPTIONS[recurrence.type].toLowerCase()}`
        : 'A agenda foi atualizada com sucesso.',
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
                                'rounded p-1.5 text-xs border relative',
                                STATUS_COLORS[agendamento.status]
                              )}
                            >
                              {(agendamento as any).recurrenceGroupId && (
                                <Repeat className="absolute top-1 right-1 h-3 w-3 opacity-50" />
                              )}
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
        <DialogContent className="max-w-lg">
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
                    <SelectItem value="telemedicina">Telemedicina</SelectItem>
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

            {/* Recurrence - only show for new appointments */}
            {!formData.id && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Consulta Recorrente</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Frequência</Label>
                    <Select
                      value={recurrence.type}
                      onValueChange={(v) => setRecurrence({ ...recurrence, type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECURRENCE_OPTIONS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrence.type !== 'none' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min={2}
                        max={52}
                        value={recurrence.occurrences}
                        onChange={(e) => setRecurrence({ ...recurrence, occurrences: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                  )}
                </div>
                {recurrence.type !== 'none' && (
                  <p className="text-xs text-muted-foreground">
                    Serão criados {recurrence.occurrences} agendamentos ({RECURRENCE_OPTIONS[recurrence.type].toLowerCase()})
                  </p>
                )}
              </div>
            )}

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