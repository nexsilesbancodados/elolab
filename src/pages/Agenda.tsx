import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Repeat, Loader2, LayoutList, LayoutGrid, Users, CalendarCheck, AlertTriangle, CalendarDays } from 'lucide-react';
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
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
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

// Color palette for doctors
const MEDICO_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-orange-500',
];

const MEDICO_BG_COLORS = [
  'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
  'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
  'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
  'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
  'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
  'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
  'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
];

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
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'day' | 'month'>('grid');
  const queryClient = useQueryClient();
  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useAgendamentos();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: bloqueios = [] } = useSupabaseQuery<{
    id: string; medico_id: string; data_inicio: string; data_fim: string;
    hora_inicio: string | null; hora_fim: string | null; dia_inteiro: boolean; motivo: string | null; tipo: string;
  }>('bloqueios_agenda');
  const { medicoId, isMedicoOnly } = useCurrentMedico();

  const isLoading = loadingAgendamentos || loadingPacientes || loadingMedicos;

  // Send WhatsApp notification (best-effort, non-blocking)
  const sendWhatsAppNotification = async (agendamentoId: string, action: string) => {
    try {
      await supabase.functions.invoke('whatsapp-notifications', {
        body: { action, agendamento_id: agendamentoId },
      });
    } catch (err) {
      // WhatsApp is optional - don't block the flow
      console.log('WhatsApp notification skipped:', err);
    }
  };

  // Auto-set filter to own doctor when logged in as medico-only
  // Using useEffect instead of useMemo for side effects
  useState(() => {
    if (isMedicoOnly && medicoId) {
      setSelectedMedico(medicoId);
    }
  });

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);

  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((ag) => {
      // If medico-only user, always filter by own medico_id
      if (isMedicoOnly && medicoId && ag.medico_id !== medicoId) return false;
      if (!isMedicoOnly && selectedMedico !== 'todos' && ag.medico_id !== selectedMedico) return false;
      return true;
    });
  }, [agendamentos, selectedMedico, isMedicoOnly, medicoId]);

  // Stats do dia atual
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const agendamentosHoje = filteredAgendamentos.filter(a => a.data === hoje);
  const statsHoje = {
    total: agendamentosHoje.length,
    confirmados: agendamentosHoje.filter(a => a.status === 'confirmado').length,
    finalizados: agendamentosHoje.filter(a => a.status === 'finalizado').length,
    cancelados: agendamentosHoje.filter(a => a.status === 'cancelado').length,
    aguardando: agendamentosHoje.filter(a => a.status === 'aguardando' || a.status === 'agendado').length,
  };

  const isSlotBlocked = (data: Date, hora: string) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return bloqueios.some(b => {
      if (selectedMedico !== 'todos' && b.medico_id !== selectedMedico) return false;
      if (dataStr < b.data_inicio || dataStr > b.data_fim) return false;
      if (b.dia_inteiro) return true;
      if (b.hora_inicio && b.hora_fim) return hora >= b.hora_inicio && hora < b.hora_fim;
      return false;
    });
  };

  const getAgendamentoForSlot = (data: Date, hora: string) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return filteredAgendamentos.find(
      (ag) => ag.data === dataStr && (ag.hora_inicio === hora || ag.hora_inicio?.slice(0, 5) === hora)
    );
  };

  const handleSlotClick = (data: Date, hora: string) => {
    if (isSlotBlocked(data, hora)) {
      toast.error('Este horário está bloqueado');
      return;
    }
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
      // Normalize hora to HH:mm:ss for consistent DB storage
      const normalizeTime = (t: string | undefined) => {
        if (!t) return t;
        return t.length === 5 ? `${t}:00` : t;
      };

      if (formData.id) {
        // Update existing
        const { error } = await supabase
          .from('agendamentos')
          .update({
            paciente_id: formData.paciente_id,
            medico_id: formData.medico_id,
            data: formData.data!,
            hora_inicio: normalizeTime(formData.hora_inicio)!,
            hora_fim: normalizeTime(formData.hora_fim),
            tipo: formData.tipo,
            status: formData.status,
            observacoes: formData.observacoes,
          })
          .eq('id', formData.id);

        if (error) throw error;

        // Send WhatsApp confirmation if status changed to confirmado
        if (formData.status === 'confirmado') {
          sendWhatsAppNotification(formData.id, 'send_appointment_confirmation');
        }

        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Create new (possibly recurring)
        const dates = generateRecurringDates(formData.data!, recurrence);
        
        const newAgendamentos = dates.map(date => ({
          paciente_id: formData.paciente_id!,
          medico_id: formData.medico_id!,
          data: date,
          hora_inicio: normalizeTime(formData.hora_inicio)!,
          hora_fim: normalizeTime(formData.hora_fim),
          tipo: formData.tipo,
          status: formData.status as StatusAgendamento,
          observacoes: formData.observacoes,
        }));

        const { data: inserted, error } = await supabase
          .from('agendamentos')
          .insert(newAgendamentos)
          .select('id');

        if (error) throw error;
        
        // Send WhatsApp confirmation for each new appointment
        if (inserted) {
          for (const ag of inserted) {
            sendWhatsAppNotification(ag.id, 'send_appointment_confirmation');
          }
        }

        const count = dates.length;
        toast.success(
          count > 1 
            ? `${count} agendamentos criados com sucesso!` 
            : 'Agendamento criado com sucesso!'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
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
      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
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
    return medico ? `Dr(a). ${medico.nome || medico.crm}` : 'Desconhecido';
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
                  {medico.nome || medico.crm} - {medico.especialidade || 'Geral'}
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
          {/* Stats do dia */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Consultas hoje', value: statsHoje.total, color: 'text-primary', bg: 'bg-primary/10', icon: CalendarCheck },
              { label: 'Confirmados', value: statsHoje.confirmados, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', icon: Users },
              { label: 'Aguardando', value: statsHoje.aguardando, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
              { label: 'Finalizados', value: statsHoje.finalizados, color: 'text-muted-foreground', bg: 'bg-muted', icon: CalendarCheck },
              { label: 'Cancelados/Faltas', value: statsHoje.cancelados + agendamentosHoje.filter(a => a.status === 'faltou').length, color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick status actions for today's appointments */}
          {agendamentosHoje.filter(a => a.status === 'agendado').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                {agendamentosHoje.filter(a => a.status === 'agendado').length} agendamento(s) ainda não confirmado(s) hoje
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7 text-xs border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                onClick={async () => {
                  const ids = agendamentosHoje.filter(a => a.status === 'agendado').map(a => a.id);
                  const { error } = await supabase.from('agendamentos').update({ status: 'confirmado' as StatusAgendamento }).in('id', ids);
                  if (!error) {
                    toast.success(`${ids.length} agendamento(s) confirmado(s)!`);
                    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
                  }
                }}
              >
                Confirmar todos
              </Button>
            </motion.div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => viewMode === 'day' ? setCurrentWeek(addDays(currentWeek, -1)) : setCurrentWeek(subWeeks(currentWeek, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {viewMode === 'day'
                      ? format(currentWeek, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : `${format(weekDays[0], "dd 'de' MMMM", { locale: ptBR })} — ${format(weekDays[6], "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
                  </CardTitle>
                  <Button variant="outline" size="icon" onClick={() => viewMode === 'day' ? setCurrentWeek(addDays(currentWeek, 1)) : setCurrentWeek(addWeeks(currentWeek, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="h-9 w-40 text-sm"
                    value={format(currentWeek, 'yyyy-MM-dd')}
                    onChange={e => e.target.value && setCurrentWeek(parseISO(e.target.value))}
                  />
                  <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                    Hoje
                  </Button>
                  <div className="flex rounded-lg border overflow-hidden">
                    <Button
                      variant={viewMode === 'day' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-none border-0"
                      onClick={() => setViewMode('day')}
                      title="Visão do dia"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-none border-0 border-l"
                      onClick={() => setViewMode('grid')}
                      title="Visão semanal"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-none border-0 border-l"
                      onClick={() => setViewMode('list')}
                      title="Lista"
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === 'day' ? (
                /* ─── Day View ─── */
                <div className="divide-y">
                  {/* Quick weekday nav */}
                  <div className="p-3 bg-muted/20 border-b flex items-center gap-1 overflow-x-auto">
                    {weekDays.map(d => {
                      const isSelected = isSameDay(d, currentWeek);
                      const dayAgCount = filteredAgendamentos.filter(a => a.data === format(d, 'yyyy-MM-dd')).length;
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => setCurrentWeek(d)}
                          className={cn(
                            'flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[52px]',
                            isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted',
                            isSameDay(d, new Date()) && !isSelected && 'ring-1 ring-primary/40',
                          )}
                        >
                          <span className="text-[10px] uppercase font-medium">{format(d, 'EEE', { locale: ptBR })}</span>
                          <span className="text-lg font-bold">{format(d, 'dd')}</span>
                          {dayAgCount > 0 && (
                            <span className={cn('text-[9px] font-medium', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                              {dayAgCount} ag.
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {HORARIOS.map(hora => {
                    const agendamento = getAgendamentoForSlot(currentWeek, hora);
                    const blocked = isSlotBlocked(currentWeek, hora);
                    return (
                      <div
                        key={hora}
                        className={cn(
                          'flex items-stretch min-h-[72px] transition-colors',
                          blocked ? 'bg-muted/40' : 'hover:bg-muted/20 cursor-pointer',
                        )}
                        onClick={() => !blocked && handleSlotClick(currentWeek, hora)}
                      >
                        <div className="w-20 flex-shrink-0 flex items-center justify-center border-r bg-muted/20 text-sm font-medium text-muted-foreground">
                          {hora}
                        </div>
                        <div className="flex-1 p-2">
                          {blocked && !agendamento && (
                            <div className="rounded-lg p-3 bg-muted text-muted-foreground/60 border border-dashed border-muted-foreground/20 h-full flex items-center justify-center text-sm">
                              Bloqueado
                            </div>
                          )}
                          {agendamento && (
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn('rounded-lg p-3 border', STATUS_COLORS[agendamento.status || 'agendado'])}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm">{getPacienteNome(agendamento.paciente_id)}</p>
                                  <p className="text-xs opacity-75">{getMedicoNome(agendamento.medico_id)}</p>
                                  {agendamento.tipo && <p className="text-xs opacity-60 mt-0.5">{agendamento.tipo}</p>}
                                </div>
                                <Badge className={cn('text-[10px]', STATUS_COLORS[agendamento.status || 'agendado'])}>
                                  {STATUS_LABELS[agendamento.status as StatusAgendamento || 'agendado']}
                                </Badge>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                <div className="divide-y">
                  {filteredAgendamentos
                    .filter(a => a.data >= format(weekDays[0], 'yyyy-MM-dd') && a.data <= format(weekDays[6], 'yyyy-MM-dd'))
                    .sort((a, b) => `${a.data}${a.hora_inicio}`.localeCompare(`${b.data}${b.hora_inicio}`))
                    .map(ag => (
                      <motion.div key={ag.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleSlotClick(parseISO(ag.data), ag.hora_inicio || '08:00')}
                      >
                        <div className="w-16 text-center shrink-0">
                          <p className="text-xs text-muted-foreground">{format(parseISO(ag.data), 'EEE', { locale: ptBR })}</p>
                          <p className="font-bold text-sm">{format(parseISO(ag.data), 'dd/MM')}</p>
                        </div>
                        <div className={`w-2 h-10 rounded-full shrink-0 ${
                          ag.status === 'confirmado' ? 'bg-success' :
                          ag.status === 'cancelado' ? 'bg-destructive' :
                          ag.status === 'finalizado' ? 'bg-muted-foreground' :
                          ag.status === 'em_atendimento' ? 'bg-purple-500' : 'bg-info'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{getPacienteNome(ag.paciente_id)}</p>
                          <p className="text-xs text-muted-foreground truncate">{getMedicoNome(ag.medico_id)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">{ag.hora_inicio?.slice(0,5)}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[ag.status as StatusAgendamento || 'agendado']}`}>
                            {STATUS_LABELS[ag.status as StatusAgendamento || 'agendado']}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  }
                  {filteredAgendamentos.filter(a => a.data >= format(weekDays[0], 'yyyy-MM-dd') && a.data <= format(weekDays[6], 'yyyy-MM-dd')).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum agendamento esta semana</p>
                    </div>
                  )}
                </div>
              ) : (
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
                          const blocked = isSlotBlocked(day, hora);
                          return (
                            <div
                              key={`${day.toISOString()}-${hora}`}
                              className={cn(
                                'p-1 border-r last:border-r-0 min-h-[60px] transition-colors',
                                blocked 
                                  ? 'bg-muted/60 cursor-not-allowed' 
                                  : 'cursor-pointer hover:bg-muted/30',
                                isSameDay(day, new Date()) && !blocked && 'bg-primary/5'
                              )}
                              onClick={() => handleSlotClick(day, hora)}
                            >
                              {blocked && !agendamento && (
                                <div className="rounded p-1.5 text-xs bg-muted text-muted-foreground/60 border border-dashed border-muted-foreground/20 h-full flex items-center justify-center">
                                  <span className="text-[10px]">Bloqueado</span>
                                </div>
                              )}
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
              )}
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
          {/* Bloqueios de Horário */}
          <BloqueioAgenda medicoIdFilter={selectedMedico !== 'todos' ? selectedMedico : undefined} />
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                      {m.nome || m.crm} - {m.especialidade || 'Geral'}
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
