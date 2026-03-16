import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabaseQuery } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, AlertTriangle, CheckCircle2, Phone, Clock, Filter , Search, Bell} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Retorno {
  id: string;
  paciente_id: string;
  medico_id: string;
  data_retorno_prevista: string;
  data_consulta_origem: string;
  status: string | null;
  motivo: string | null;
  tipo_retorno: string | null;
  lembrete_enviado: boolean | null;
  observacoes: string | null;
  agendamento_id: string | null;
}

export default function RetornosControl() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const queryClient = useQueryClient();

  const { data: retornos = [], isLoading } = useSupabaseQuery<Retorno>('retornos', {
    orderBy: { column: 'data_retorno_prevista', ascending: true },
  });

  const { data: pacientes = [] } = useSupabaseQuery<{ id: string; nome: string; telefone: string | null }>('pacientes', {
    select: 'id, nome, telefone',
  });

  const { data: medicos = [] } = useSupabaseQuery<{ id: string; crm: string; especialidade: string | null }>('medicos', {
    select: 'id, crm, especialidade',
  });

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Paciente';
  const getPacienteTelefone = (id: string) => pacientes.find(p => p.id === id)?.telefone || null;
  const getMedicoNome = (id: string) => {
    const m = medicos.find(m => m.id === id);
    return m ? `Dr(a). ${m.nome || m.crm}` : 'Médico';
  };

  const hoje = new Date();
  const retornosComStatus = retornos.map(r => {
    const dataRetorno = parseISO(r.data_retorno_prevista);
    const diasAtraso = differenceInDays(hoje, dataRetorno);
    let statusCalculado = r.status || 'pendente';
    
    if (statusCalculado === 'pendente' && isPast(dataRetorno)) {
      statusCalculado = 'atrasado';
    }

    return { ...r, statusCalculado, diasAtraso, dataRetorno };
  });

  const filtrados = filtroStatus === 'todos' 
    ? retornosComStatus 
    : retornosComStatus.filter(r => r.statusCalculado === filtroStatus);

  const pendentes = retornosComStatus.filter(r => r.statusCalculado === 'pendente').length;
  const atrasados = retornosComStatus.filter(r => r.statusCalculado === 'atrasado').length;
  const realizados = retornosComStatus.filter(r => r.statusCalculado === 'realizado').length;

  const marcarRealizado = async (id: string) => {
    const { error } = await supabase
      .from('retornos')
      .update({ status: 'realizado' } as any)
      .eq('id', id);
    
    if (error) {
      toast.error('Erro ao atualizar retorno');
    } else {
      toast.success('Retorno marcado como realizado');
      queryClient.invalidateQueries({ queryKey: ['retornos'] });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'atrasado':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Atrasado</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'realizado':
        return <Badge className="gap-1 bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3" /> Realizado</Badge>;
      case 'cancelado':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Retornos</h1>
          <p className="text-muted-foreground">Acompanhe retornos pendentes e atrasados</p>
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="realizado">Realizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className={cn("cursor-pointer transition-all hover:shadow-md", filtroStatus === 'atrasado' && "ring-2 ring-destructive")}
              onClick={() => setFiltroStatus('atrasado')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Atrasados</p>
                <p className="text-3xl font-bold text-destructive">{atrasados}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all hover:shadow-md", filtroStatus === 'pendente' && "ring-2 ring-warning")}
              onClick={() => setFiltroStatus('pendente')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Pendentes</p>
                <p className="text-3xl font-bold text-warning">{pendentes}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-warning/10 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all hover:shadow-md", filtroStatus === 'realizado' && "ring-2 ring-success")}
              onClick={() => setFiltroStatus('realizado')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Realizados</p>
                <p className="text-3xl font-bold text-success">{realizados}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Retornos {filtroStatus !== 'todos' ? `(${filtroStatus})` : ''}</CardTitle>
          <CardDescription>{filtrados.length} retorno(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filtrados.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum retorno encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Data Retorno</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((r) => (
                  <TableRow key={r.id} className={cn(r.statusCalculado === 'atrasado' && 'bg-destructive/5')}>
                    <TableCell className="font-medium">{getPacienteNome(r.paciente_id)}</TableCell>
                    <TableCell>{getMedicoNome(r.medico_id)}</TableCell>
                    <TableCell>
                      <div>
                        {format(r.dataRetorno, "dd/MM/yyyy", { locale: ptBR })}
                        {r.statusCalculado === 'atrasado' && (
                          <p className="text-xs text-destructive">{r.diasAtraso} dia(s) de atraso</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{r.motivo || '-'}</TableCell>
                    <TableCell>{getStatusBadge(r.statusCalculado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {r.statusCalculado !== 'realizado' && (
                          <Button size="sm" variant="outline" onClick={() => marcarRealizado(r.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Realizado
                          </Button>
                        )}
                        {getPacienteTelefone(r.paciente_id) && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={`https://wa.me/55${getPacienteTelefone(r.paciente_id)?.replace(/\D/g, '')}`} target="_blank" rel="noopener">
                              <Phone className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
