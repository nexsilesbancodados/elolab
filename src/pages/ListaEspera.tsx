import { useState, useEffect } from 'react';
import { Plus, Search, Clock, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
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
import { ItemListaEspera, Paciente, User } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';
import { format, differenceInDays } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  aguardando: 'bg-yellow-100 text-yellow-800',
  notificado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  agendado: 'bg-purple-100 text-purple-800',
  desistiu: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  aguardando: 'Aguardando',
  notificado: 'Notificado',
  confirmado: 'Confirmado',
  agendado: 'Agendado',
  desistiu: 'Desistiu',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-800',
  preferencial: 'bg-blue-100 text-blue-800',
  urgente: 'bg-red-100 text-red-800',
};

const ESPECIALIDADES = [
  'Clínico Geral',
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
];

export default function ListaEspera() {
  const [lista, setLista] = useState<ItemListaEspera[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('aguardando');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    medicoId: '',
    especialidade: '',
    prioridade: 'normal' as 'normal' | 'preferencial' | 'urgente',
    motivo: '',
    preferenciaHorario: '',
    observacoes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLista(getAll<ItemListaEspera>('listaEspera'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  };

  const filteredLista = lista.filter(item => {
    const paciente = pacientes.find(p => p.id === item.pacienteId);
    const matchesSearch = paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by priority first, then by date
    const prioridadeOrder = { urgente: 0, preferencial: 1, normal: 2 };
    const prioridadeDiff = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
    if (prioridadeDiff !== 0) return prioridadeDiff;
    return new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
  });

  const handleOpenDialog = () => {
    setFormData({
      pacienteId: '',
      medicoId: '',
      especialidade: '',
      prioridade: 'normal',
      motivo: '',
      preferenciaHorario: '',
      observacoes: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.motivo) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const novoItem: ItemListaEspera = {
      id: generateId(),
      ...formData,
      status: 'aguardando',
      dataCadastro: new Date().toISOString(),
    };

    const allLista = getAll<ItemListaEspera>('listaEspera');
    allLista.push(novoItem);
    setCollection('listaEspera', allLista);

    loadData();
    setIsDialogOpen(false);
    toast({
      title: 'Adicionado à lista',
      description: 'O paciente foi adicionado à lista de espera.',
    });
  };

  const handleUpdateStatus = (id: string, newStatus: ItemListaEspera['status']) => {
    const allLista = getAll<ItemListaEspera>('listaEspera');
    const index = allLista.findIndex(item => item.id === id);
    if (index !== -1) {
      allLista[index].status = newStatus;
      setCollection('listaEspera', allLista);
      loadData();
      toast({
        title: 'Status atualizado',
        description: `Status alterado para ${STATUS_LABELS[newStatus]}.`,
      });
    }
  };

  const handleRemove = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item da lista?')) {
      const allLista = getAll<ItemListaEspera>('listaEspera');
      const filtered = allLista.filter(item => item.id !== id);
      setCollection('listaEspera', filtered);
      loadData();
      toast({
        title: 'Removido',
        description: 'O item foi removido da lista de espera.',
      });
    }
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getPacienteTelefone = (id: string) => pacientes.find(p => p.id === id)?.telefone || '';
  const getMedicoNome = (id?: string) => id ? medicos.find(m => m.id === id)?.nome : null;

  const getDiasEspera = (dataCadastro: string) => {
    return differenceInDays(new Date(), new Date(dataCadastro));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Espera</h1>
          <p className="text-muted-foreground">Gerencie pacientes aguardando vaga</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar à Lista
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {lista.filter(i => i.status === 'aguardando').length}
              </p>
              <p className="text-sm text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {lista.filter(i => i.prioridade === 'urgente' && i.status === 'aguardando').length}
              </p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {lista.filter(i => i.status === 'notificado').length}
              </p>
              <p className="text-sm text-muted-foreground">Notificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {lista.filter(i => i.status === 'agendado').length}
              </p>
              <p className="text-sm text-muted-foreground">Agendados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lista ({filteredLista.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="notificado">Notificado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
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
                  <TableHead className="hidden md:table-cell">Especialidade/Médico</TableHead>
                  <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
                  <TableHead className="hidden lg:table-cell">Dias na Lista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum paciente na lista de espera
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLista.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getPacienteNome(item.pacienteId)}</p>
                          <p className="text-sm text-muted-foreground">{getPacienteTelefone(item.pacienteId)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.especialidade || getMedicoNome(item.medicoId) || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={PRIORIDADE_COLORS[item.prioridade]}>
                          {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {getDiasEspera(item.dataCadastro)} dias
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === 'aguardando' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'notificado')}>
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'agendado')}>
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {item.status === 'notificado' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'confirmado')}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'desistiu')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {item.status === 'confirmado' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'agendado')}>
                              <Calendar className="h-4 w-4" />
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
            <DialogTitle>Adicionar à Lista de Espera</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={formData.especialidade} onValueChange={(v) => setFormData({ ...formData, especialidade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map(esp => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(v: 'normal' | 'preferencial' | 'urgente') => setFormData({ ...formData, prioridade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="preferencial">Preferencial</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Médico (opcional)</Label>
              <Select value={formData.medicoId} onValueChange={(v) => setFormData({ ...formData, medicoId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Motivo da consulta..."
              />
            </div>
            <div className="space-y-2">
              <Label>Preferência de Horário</Label>
              <Input
                value={formData.preferenciaHorario}
                onChange={(e) => setFormData({ ...formData, preferenciaHorario: e.target.value })}
                placeholder="Ex: Manhãs de terça e quinta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
