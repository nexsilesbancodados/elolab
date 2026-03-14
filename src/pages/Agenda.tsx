import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Repeat, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAgendamentos, usePacientes, useMedicos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';
import { AgendaSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyAgendamentos } from '@/components/EmptyState';
import { Database } from '@/integrations/supabase/types';
import { BloqueioAgenda } from '@/components/agenda/BloqueioAgenda';

type StatusAgendamento = Database['public']['Enums']['status_agendamento'];

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

const STATUS_COLORS: Record<StatusAgendamento, string> = {
  agendado: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  confirmado: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  aguardando: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  em_atendimento: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  finalizado: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
  cancelado: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  faltou: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
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

interface FormData {
  id?: string;
  data?: string;
  hora_inicio?: string;
  hora_fim?: string;
  paciente_id?: string;
  medico_id?: string;
  tipo?: string;
  status?: StatusAgendamento;
  observacoes?: string;
}

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMedico, setSelectedMedico] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({ type: 'none', occurrences: 4 });
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();

  const isLoading = loadingAgendamentos || loadingPacientes || loadingMedicos;

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);

  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((ag) => {
      if (selectedMedico !== 'todos' && ag.medico_id !== selectedMedico) return false;
      return true;
    });
  }, [agendamentos, selectedMedico]);

  const getAgendamentoForSlot = (data: Date, hora: string) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return filteredAgendamentos.find(
      (ag) => ag.data === dataStr && ag.hora_inicio === hora
    );
  };

  const handleSlotClick = (data: Date, hora: string) => {
    const existing = getAgendamentoForSlot(data, hora);
    if (existing) {
      setFormData({
        id: existing.id,
        data: existing.data,
        hora_inicio: existing.hora_inicio,
        hora_fim: existing.hora_fim || undefined,
        paciente_id: existing.paciente_id,
        medico_id: existing.medico_id,
        tipo: existing.tipo || 'consulta',
        status: (existing.status || 'agendado') as StatusAgendamento,
        observacoes: existing.observacoes || '',
      });
      setRecurrence({ type: 'none', occurrences: 4 });
    } else {
      setFormData({
        data: format(data, 'yyyy-MM-dd'),
        hora_inicio: hora,
        hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || '18:30',
        tipo: 'consulta',
        status: 'agendado' as StatusAgendamento,
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

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.medico_id) {
      toast.error('Selecione o paciente e o médico.');
      return;
    }

    setIsSaving(true);

    try {
      if (formData.id) {
        // Update existing
        const { error } = await supabase
          .from('agendamentos')
          .update({
            paciente_id: formData.paciente_id,
            medico_id: formData.medico_id,
            data: formData.data!,
            hora_inicio: formData.hora_inicio!,
            hora_fim: formData.hora_fim,
            tipo: formData.tipo,
            status: formData.status,
            observacoes: formData.observacoes,
          })
          .eq('id', formData.id);

        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Create new (possibly recurring)
        const dates = generateRecurringDates(formData.data!, recurrence);
        
        const newAgendamentos = dates.map(date => ({
          paciente_id: formData.paciente_id!,
          medico_id: formData.medico_id!,
          data: date,
          hora_inicio: formData.hora_inicio!,
          hora_fim: formData.hora_fim,
          tipo: formData.tipo,
          status: formData.status as StatusAgendamento,
          observacoes: formData.observacoes,
        }));

        const { error } = await supabase
          .from('agendamentos')
          .insert(newAgendamentos);

        if (error) throw error;
        
        const count = dates.length;
        toast.success(
          count > 1 
            ? `${count} agendamentos criados com sucesso!` 
            : 'Agendamento criado com sucesso!'
        );
      }

      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setIsFormOpen(false);
      setRecurrence({ type: 'none', occurrences: 4 });
    } catch (error) {
      console.error('Error saving agendamento:', error);
      toast.error('Erro ao salvar agendamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;
      
      toast.success('Agendamento excluído!');
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error deleting agendamento:', error);
      toast.error('Erro ao excluir agendamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPacienteNome = (id: string) => pacientes.find((p) => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => {
    const medico = medicos.find((m) => m.id === id);
    return medico ? `Dr(a). ${medico.crm}` : 'Desconhecido';
  };

  if (isLoading) {
    return <AgendaSkeleton />;
  }

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
                  {medico.crm} - {medico.especialidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {agendamentos.length === 0 && pacientes.length === 0 ? (
        <EmptyAgendamentos onAdd={() => {
          toast.info('Primeiro cadastre pacientes e médicos para criar agendamentos.');
        }} />
      ) : (
        <>
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
                                    STATUS_COLORS[agendamento.status || 'agendado']
                                  )}
                                >
                                  <p className="font-medium truncate">
                                    {getPacienteNome(agendamento.paciente_id)}
                                  </p>
                                  <p className="truncate opacity-75">
                                    {getMedicoNome(agendamento.medico_id)}
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
        </>
      )}

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
                  {formData.hora_inicio}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id}
                onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}
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
                value={formData.medico_id}
                onValueChange={(v) => setFormData({ ...formData, medico_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.crm} - {m.especialidade}
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
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
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
                  onValueChange={(v) => setFormData({ ...formData, status: v as StatusAgendamento })}
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
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrence.type !== 'none' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Repetições</Label>
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
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre a consulta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {formData.id && (
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                Excluir
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
