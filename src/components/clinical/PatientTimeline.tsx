import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Pill, 
  TestTube, 
  FileCheck, 
  ArrowRight, 
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PatientTimelineProps {
  pacienteId: string;
  className?: string;
  maxItems?: number;
}

interface TimelineEvent {
  id: string;
  type: 'prontuario' | 'prescricao' | 'exame' | 'atestado' | 'encaminhamento';
  date: Date;
  title: string;
  description?: string;
  status?: string;
  medicoNome?: string;
}

export function PatientTimeline({ pacienteId, className, maxItems = 50 }: PatientTimelineProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['patient-timeline', pacienteId],
    queryFn: async () => {
      const allEvents: TimelineEvent[] = [];

      // Fetch prontuários
      const { data: prontuarios } = await supabase
        .from('prontuarios')
        .select('id, data, queixa_principal, hipotese_diagnostica, medico_id')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: false })
        .limit(maxItems);

      prontuarios?.forEach(p => {
        allEvents.push({
          id: p.id,
          type: 'prontuario',
          date: new Date(p.data),
          title: 'Consulta Médica',
          description: p.queixa_principal || p.hipotese_diagnostica || 'Atendimento realizado',
        });
      });

      // Fetch prescrições
      const { data: prescricoes } = await supabase
        .from('prescricoes')
        .select('id, data_emissao, medicamento, dosagem, tipo')
        .eq('paciente_id', pacienteId)
        .order('data_emissao', { ascending: false })
        .limit(maxItems);

      prescricoes?.forEach(p => {
        allEvents.push({
          id: p.id,
          type: 'prescricao',
          date: new Date(p.data_emissao || new Date()),
          title: 'Prescrição',
          description: `${p.medicamento}${p.dosagem ? ` - ${p.dosagem}` : ''}`,
          status: p.tipo || 'simples',
        });
      });

      // Fetch exames
      const { data: exames } = await supabase
        .from('exames')
        .select('id, data_solicitacao, tipo_exame, status')
        .eq('paciente_id', pacienteId)
        .order('data_solicitacao', { ascending: false })
        .limit(maxItems);

      exames?.forEach(e => {
        allEvents.push({
          id: e.id,
          type: 'exame',
          date: new Date(e.data_solicitacao || new Date()),
          title: 'Exame',
          description: e.tipo_exame,
          status: e.status || 'solicitado',
        });
      });

      // Fetch atestados
      const { data: atestados } = await supabase
        .from('atestados')
        .select('id, data_emissao, tipo, dias, motivo')
        .eq('paciente_id', pacienteId)
        .order('data_emissao', { ascending: false })
        .limit(maxItems);

      atestados?.forEach(a => {
        allEvents.push({
          id: a.id,
          type: 'atestado',
          date: new Date(a.data_emissao || new Date()),
          title: 'Atestado',
          description: a.dias ? `${a.dias} dia(s) - ${a.motivo || a.tipo}` : a.motivo || a.tipo || 'Emitido',
        });
      });

      // Fetch encaminhamentos
      const { data: encaminhamentos } = await supabase
        .from('encaminhamentos')
        .select('id, data_encaminhamento, especialidade_destino, motivo, status')
        .eq('paciente_id', pacienteId)
        .order('data_encaminhamento', { ascending: false })
        .limit(maxItems);

      encaminhamentos?.forEach(e => {
        allEvents.push({
          id: e.id,
          type: 'encaminhamento',
          date: new Date(e.data_encaminhamento || new Date()),
          title: 'Encaminhamento',
          description: `${e.especialidade_destino} - ${e.motivo}`,
          status: e.status || 'pendente',
        });
      });

      // Sort by date descending
      return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, maxItems);
    },
    enabled: !!pacienteId,
  });

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'prontuario':
        return <FileText className="h-4 w-4" />;
      case 'prescricao':
        return <Pill className="h-4 w-4" />;
      case 'exame':
        return <TestTube className="h-4 w-4" />;
      case 'atestado':
        return <FileCheck className="h-4 w-4" />;
      case 'encaminhamento':
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'prontuario':
        return 'bg-blue-500';
      case 'prescricao':
        return 'bg-green-500';
      case 'exame':
        return 'bg-purple-500';
      case 'atestado':
        return 'bg-amber-500';
      case 'encaminhamento':
        return 'bg-orange-500';
    }
  };

  const getEventBadgeVariant = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'prontuario':
        return 'default';
      case 'prescricao':
        return 'secondary';
      case 'exame':
        return 'outline';
      case 'atestado':
        return 'secondary';
      case 'encaminhamento':
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum evento encontrado para este paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline do Paciente
          <Badge variant="outline" className="ml-auto">
            {events.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={`${event.type}-${event.id}`} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white shrink-0",
                      getEventColor(event.type)
                    )}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getEventBadgeVariant(event.type)}>
                        {event.title}
                      </Badge>
                      {event.status && (
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(event.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
