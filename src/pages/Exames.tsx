import { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, Download, Upload } from 'lucide-react';
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
import { Exame, Paciente, User, StatusExame } from '@/types';
import { getAll, generateId, setItem } from '@/lib/localStorage';
import { format } from 'date-fns';

const STATUS_COLORS: Record<StatusExame, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800',
  agendado: 'bg-blue-100 text-blue-800',
  realizado: 'bg-purple-100 text-purple-800',
  laudo_disponivel: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<StatusExame, string> = {
  solicitado: 'Solicitado',
  agendado: 'Agendado',
  realizado: 'Realizado',
  laudo_disponivel: 'Laudo Disponível',
  cancelado: 'Cancelado',
};

const TIPOS_EXAME = [
  'Hemograma Completo',
  'Glicemia em Jejum',
  'Colesterol Total e Frações',
  'Triglicerídeos',
  'Ureia e Creatinina',
  'TGO e TGP',
  'TSH e T4 Livre',
  'Eletrocardiograma',
  'Raio-X Tórax',
  'Ultrassom Abdominal',
  'Tomografia',
  'Ressonância Magnética',
  'Endoscopia',
  'Colonoscopia',
];

export default function Exames() {
  const [exames, setExames] = useState<Exame[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    medicoSolicitanteId: '',
    tipoExame: '',
    descricao: '',
    observacoes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExames(getAll<Exame>('exames'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  };

  const filteredExames = exames.filter(e => {
    const paciente = pacientes.find(p => p.id === e.pacienteId);
    const matchesSearch = paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.tipoExame.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = () => {
    setFormData({
      pacienteId: '',
      medicoSolicitanteId: '',
      tipoExame: '',
      descricao: '',
      observacoes: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.medicoSolicitanteId || !formData.tipoExame) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const novoExame: Exame = {
      id: generateId(),
      ...formData,
      status: 'solicitado',
      dataSolicitacao: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    };

    const allExames = getAll<Exame>('exames');
    allExames.push(novoExame);
    setItem('exames', allExames);
    
    loadData();
    setIsDialogOpen(false);
    toast({
      title: 'Exame solicitado',
      description: 'O exame foi solicitado com sucesso.',
    });
  };

  const handleUpdateStatus = (id: string, newStatus: StatusExame) => {
    const allExames = getAll<Exame>('exames');
    const index = allExames.findIndex(e => e.id === id);
    if (index !== -1) {
      allExames[index].status = newStatus;
      if (newStatus === 'realizado') {
        allExames[index].dataRealizacao = new Date().toISOString();
      }
      setItem('exames', allExames);
      loadData();
      toast({
        title: 'Status atualizado',
        description: `Status alterado para ${STATUS_LABELS[newStatus]}.`,
      });
    }
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => medicos.find(m => m.id === id)?.nome || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exames</h1>
          <p className="text-muted-foreground">Gerencie solicitações e resultados de exames</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(['solicitado', 'agendado', 'realizado', 'laudo_disponivel'] as StatusExame[]).map(status => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{exames.filter(e => e.status === status).length}</p>
                <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exames ({filteredExames.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="solicitado">Solicitado</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="laudo_disponivel">Laudo Disponível</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum exame encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExames.map((exame) => (
                    <TableRow key={exame.id}>
                      <TableCell className="font-medium">{getPacienteNome(exame.pacienteId)}</TableCell>
                      <TableCell>{exame.tipoExame}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(exame.medicoSolicitanteId)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {format(new Date(exame.dataSolicitacao), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[exame.status]}>
                          {STATUS_LABELS[exame.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {exame.status === 'solicitado' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(exame.id, 'agendado')}>
                              Agendar
                            </Button>
                          )}
                          {exame.status === 'agendado' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(exame.id, 'realizado')}>
                              Realizado
                            </Button>
                          )}
                          {exame.status === 'realizado' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(exame.id, 'laudo_disponivel')}>
                              <Upload className="h-4 w-4 mr-1" />
                              Laudo
                            </Button>
                          )}
                          {exame.status === 'laudo_disponivel' && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Exame</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={formData.pacienteId} onValueChange={(v) => setFormData({ ...formData, pacienteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Médico Solicitante *</Label>
              <Select value={formData.medicoSolicitanteId} onValueChange={(v) => setFormData({ ...formData, medicoSolicitanteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Exame *</Label>
              <Select value={formData.tipoExame} onValueChange={(v) => setFormData({ ...formData, tipoExame: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o exame" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EXAME.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Solicitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
