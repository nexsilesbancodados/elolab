import { useState, useEffect } from 'react';
import { Search, ArrowRightLeft, Filter, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EncaminhamentoMedico } from '@/components/clinical/EncaminhamentoMedico';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface EncaminhamentoData {
  id: string;
  paciente_id: string;
  prontuario_id: string | null;
  medico_origem_id: string;
  medico_destino_id: string | null;
  especialidade_destino: string;
  tipo: string | null;
  urgencia: string | null;
  motivo: string;
  hipotese_diagnostica: string | null;
  cid_principal: string | null;
  exames_realizados: string | null;
  tratamento_atual: string | null;
  informacoes_adicionais: string | null;
  status: string | null;
  data_encaminhamento: string | null;
  data_atendimento: string | null;
  contra_referencia: string | null;
  data_contra_referencia: string | null;
  created_at: string | null;
  paciente?: { nome: string };
  medico_origem?: { crm: string };
}

interface Paciente {
  id: string;
  nome: string;
}

export default function Encaminhamentos() {
  const [encaminhamentos, setEncaminhamentos] = useState<EncaminhamentoData[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [medicoId, setMedicoId] = useState<string | null>(null);
  const { profile, user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadMedicoId();
  }, [user]);

  const loadMedicoId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('medicos')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setMedicoId(data.id);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load encaminhamentos
      const { data: encData, error: encError } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          paciente:pacientes(nome),
          medico_origem:medicos!encaminhamentos_medico_origem_id_fkey(crm)
        `)
        .order('created_at', { ascending: false });

      if (encError) throw encError;
      setEncaminhamentos(encData || []);

      // Load pacientes
      const { data: pacData } = await supabase
        .from('pacientes')
        .select('id, nome')
        .order('nome');

      setPacientes(pacData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os encaminhamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEncaminhamentos = encaminhamentos.filter((enc) => {
    const matchesSearch = 
      enc.paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.especialidade_destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enc.motivo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || enc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  const getUrgenciaBadge = (urgencia: string | null) => {
    switch (urgencia) {
      case 'eletivo':
        return <Badge className="bg-blue-100 text-blue-800">Eletivo</Badge>;
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case 'urgente':
        return <Badge className="bg-yellow-100 text-yellow-800">Urgente</Badge>;
      case 'emergencia':
        return <Badge className="bg-red-100 text-red-800">Emergência</Badge>;
      default:
        return null;
    }
  };

  const selectedPaciente = selectedPacienteId 
    ? pacientes.find(p => p.id === selectedPacienteId) 
    : null;

  const pacienteEncaminhamentos = selectedPacienteId
    ? encaminhamentos.filter(e => e.paciente_id === selectedPacienteId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Encaminhamentos</h1>
        <p className="text-muted-foreground">Referências e contra-referências médicas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pacientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {pacientes
                .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((paciente) => {
                  const qtdEncaminhamentos = encaminhamentos.filter(
                    e => e.paciente_id === paciente.id
                  ).length;

                  return (
                    <div
                      key={paciente.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedPacienteId === paciente.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedPacienteId(paciente.id)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{paciente.nome}</p>
                        {qtdEncaminhamentos > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {qtdEncaminhamentos}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Encaminhamentos do Paciente */}
        <div className="lg:col-span-2">
          {selectedPaciente && medicoId ? (
            <EncaminhamentoMedico
              pacienteId={selectedPaciente.id}
              pacienteNome={selectedPaciente.nome}
              medicoOrigemId={medicoId}
              encaminhamentos={pacienteEncaminhamentos}
              onEncaminhamentoCriado={loadData}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Selecione um paciente para gerenciar encaminhamentos</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tabela Geral de Encaminhamentos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Todos os Encaminhamentos
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead className="hidden md:table-cell">Urgência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Contra-ref.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredEncaminhamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum encaminhamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEncaminhamentos.map((enc) => (
                    <TableRow key={enc.id}>
                      <TableCell>
                        {enc.data_encaminhamento 
                          ? format(new Date(enc.data_encaminhamento), 'dd/MM/yyyy')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="font-medium">
                        {enc.paciente?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>{enc.especialidade_destino}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getUrgenciaBadge(enc.urgencia)}
                      </TableCell>
                      <TableCell>{getStatusBadge(enc.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {enc.contra_referencia ? (
                          <Badge className="bg-green-100 text-green-800">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
