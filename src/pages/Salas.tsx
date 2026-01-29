import { useState, useEffect } from 'react';
import { Plus, Search, DoorOpen, Settings, Wrench, Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sala, Leito, StatusSala, User, Paciente } from '@/types';
import { getAll, generateId, setItem } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SALA_STATUS_COLORS: Record<StatusSala, string> = {
  disponivel: 'bg-green-500',
  ocupado: 'bg-red-500',
  manutencao: 'bg-yellow-500',
  limpeza: 'bg-blue-500',
};

const SALA_STATUS_LABELS: Record<StatusSala, string> = {
  disponivel: 'Disponível',
  ocupado: 'Ocupado',
  manutencao: 'Manutenção',
  limpeza: 'Limpeza',
};

const TIPO_LABELS: Record<string, string> = {
  consultorio: 'Consultório',
  exame: 'Sala de Exames',
  procedimento: 'Sala de Procedimentos',
  triagem: 'Triagem',
  espera: 'Sala de Espera',
};

const LEITO_STATUS_COLORS: Record<string, string> = {
  disponivel: 'bg-green-500',
  ocupado: 'bg-red-500',
  reservado: 'bg-blue-500',
  manutencao: 'bg-yellow-500',
};

export default function Salas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isSalaDialogOpen, setIsSalaDialogOpen] = useState(false);
  const [isLeitoDialogOpen, setIsLeitoDialogOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [editingLeito, setEditingLeito] = useState<Leito | null>(null);
  const [salaFormData, setSalaFormData] = useState({
    nome: '',
    tipo: 'consultorio' as Sala['tipo'],
    capacidade: 1,
    status: 'disponivel' as StatusSala,
    medicoResponsavel: '',
  });
  const [leitoFormData, setLeitoFormData] = useState({
    numero: '',
    tipo: 'enfermaria' as Leito['tipo'],
    status: 'disponivel' as Leito['status'],
    pacienteId: '',
    previsaoAlta: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const salasData = getAll<Sala>('salas');
    if (salasData.length === 0) {
      const initialSalas: Sala[] = [
        { id: 'sala-1', nome: 'Consultório 1', tipo: 'consultorio', capacidade: 2, status: 'disponivel' },
        { id: 'sala-2', nome: 'Consultório 2', tipo: 'consultorio', capacidade: 2, status: 'ocupado', medicoResponsavel: 'med-1' },
        { id: 'sala-3', nome: 'Consultório 3', tipo: 'consultorio', capacidade: 2, status: 'disponivel' },
        { id: 'sala-4', nome: 'Sala de Exames', tipo: 'exame', capacidade: 3, status: 'disponivel' },
        { id: 'sala-5', nome: 'Sala de Procedimentos', tipo: 'procedimento', capacidade: 4, status: 'manutencao' },
        { id: 'sala-6', nome: 'Triagem', tipo: 'triagem', capacidade: 2, status: 'disponivel' },
      ];
      setItem('salas', initialSalas);
      setSalas(initialSalas);
    } else {
      setSalas(salasData);
    }

    const leitosData = getAll<Leito>('leitos');
    if (leitosData.length === 0) {
      const initialLeitos: Leito[] = [
        { id: 'leito-1', numero: 'L-101', tipo: 'enfermaria', status: 'disponivel' },
        { id: 'leito-2', numero: 'L-102', tipo: 'enfermaria', status: 'ocupado', pacienteId: 'pac-1' },
        { id: 'leito-3', numero: 'L-103', tipo: 'enfermaria', status: 'disponivel' },
        { id: 'leito-4', numero: 'UTI-01', tipo: 'uti', status: 'disponivel' },
        { id: 'leito-5', numero: 'UTI-02', tipo: 'uti', status: 'manutencao' },
        { id: 'leito-6', numero: 'OBS-01', tipo: 'observacao', status: 'ocupado', pacienteId: 'pac-2' },
      ];
      setItem('leitos', initialLeitos);
      setLeitos(initialLeitos);
    } else {
      setLeitos(leitosData);
    }

    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
    setPacientes(getAll<Paciente>('pacientes'));
  };

  const handleOpenSalaDialog = (sala?: Sala) => {
    if (sala) {
      setEditingSala(sala);
      setSalaFormData({
        nome: sala.nome,
        tipo: sala.tipo,
        capacidade: sala.capacidade,
        status: sala.status,
        medicoResponsavel: sala.medicoResponsavel || '',
      });
    } else {
      setEditingSala(null);
      setSalaFormData({
        nome: '',
        tipo: 'consultorio',
        capacidade: 1,
        status: 'disponivel',
        medicoResponsavel: '',
      });
    }
    setIsSalaDialogOpen(true);
  };

  const handleOpenLeitoDialog = (leito?: Leito) => {
    if (leito) {
      setEditingLeito(leito);
      setLeitoFormData({
        numero: leito.numero,
        tipo: leito.tipo,
        status: leito.status,
        pacienteId: leito.pacienteId || '',
        previsaoAlta: leito.previsaoAlta || '',
      });
    } else {
      setEditingLeito(null);
      setLeitoFormData({
        numero: '',
        tipo: 'enfermaria',
        status: 'disponivel',
        pacienteId: '',
        previsaoAlta: '',
      });
    }
    setIsLeitoDialogOpen(true);
  };

  const handleSaveSala = () => {
    if (!salaFormData.nome) {
      toast({ title: 'Erro', description: 'Preencha o nome da sala.', variant: 'destructive' });
      return;
    }

    const allSalas = getAll<Sala>('salas');
    if (editingSala) {
      const index = allSalas.findIndex(s => s.id === editingSala.id);
      if (index !== -1) allSalas[index] = { ...allSalas[index], ...salaFormData };
    } else {
      allSalas.push({ id: generateId(), ...salaFormData });
    }
    setItem('salas', allSalas);
    loadData();
    setIsSalaDialogOpen(false);
    toast({ title: editingSala ? 'Sala atualizada' : 'Sala cadastrada' });
  };

  const handleSaveLeito = () => {
    if (!leitoFormData.numero) {
      toast({ title: 'Erro', description: 'Preencha o número do leito.', variant: 'destructive' });
      return;
    }

    const allLeitos = getAll<Leito>('leitos');
    if (editingLeito) {
      const index = allLeitos.findIndex(l => l.id === editingLeito.id);
      if (index !== -1) allLeitos[index] = { ...allLeitos[index], ...leitoFormData };
    } else {
      allLeitos.push({ id: generateId(), ...leitoFormData });
    }
    setItem('leitos', allLeitos);
    loadData();
    setIsLeitoDialogOpen(false);
    toast({ title: editingLeito ? 'Leito atualizado' : 'Leito cadastrado' });
  };

  const handleChangeSalaStatus = (sala: Sala, newStatus: StatusSala) => {
    const allSalas = getAll<Sala>('salas');
    const index = allSalas.findIndex(s => s.id === sala.id);
    if (index !== -1) {
      allSalas[index].status = newStatus;
      if (newStatus !== 'ocupado') allSalas[index].medicoResponsavel = undefined;
      setItem('salas', allSalas);
      loadData();
      toast({ title: 'Status atualizado', description: `${sala.nome} está ${SALA_STATUS_LABELS[newStatus]}.` });
    }
  };

  const handleChangeLeitoStatus = (leito: Leito, newStatus: Leito['status']) => {
    const allLeitos = getAll<Leito>('leitos');
    const index = allLeitos.findIndex(l => l.id === leito.id);
    if (index !== -1) {
      allLeitos[index].status = newStatus;
      if (newStatus !== 'ocupado') allLeitos[index].pacienteId = undefined;
      setItem('leitos', allLeitos);
      loadData();
      toast({ title: 'Status atualizado' });
    }
  };

  const getMedicoNome = (id?: string) => id ? medicos.find(m => m.id === id)?.nome : null;
  const getPacienteNome = (id?: string) => id ? pacientes.find(p => p.id === id)?.nome : null;

  const salasPorTipo = {
    consultorio: salas.filter(s => s.tipo === 'consultorio'),
    exame: salas.filter(s => s.tipo === 'exame'),
    procedimento: salas.filter(s => s.tipo === 'procedimento'),
    triagem: salas.filter(s => s.tipo === 'triagem'),
  };

  const leitosPorTipo = {
    enfermaria: leitos.filter(l => l.tipo === 'enfermaria'),
    uti: leitos.filter(l => l.tipo === 'uti'),
    observacao: leitos.filter(l => l.tipo === 'observacao'),
    recuperacao: leitos.filter(l => l.tipo === 'recuperacao'),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salas e Leitos</h1>
          <p className="text-muted-foreground">Gerencie a disponibilidade de espaços</p>
        </div>
      </div>

      <Tabs defaultValue="salas">
        <TabsList>
          <TabsTrigger value="salas" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            Salas ({salas.length})
          </TabsTrigger>
          <TabsTrigger value="leitos" className="gap-2">
            <Bed className="h-4 w-4" />
            Leitos ({leitos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salas" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid gap-4 md:grid-cols-4">
              {(['disponivel', 'ocupado', 'manutencao', 'limpeza'] as StatusSala[]).map(status => (
                <Card key={status} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{salas.filter(s => s.status === status).length}</p>
                      <p className="text-sm text-muted-foreground">{SALA_STATUS_LABELS[status]}</p>
                    </div>
                    <div className={cn('w-4 h-4 rounded-full', SALA_STATUS_COLORS[status])} />
                  </div>
                </Card>
              ))}
            </div>
            <Button onClick={() => handleOpenSalaDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Sala
            </Button>
          </div>

          {Object.entries(salasPorTipo).map(([tipo, salasDoTipo]) => {
            if (salasDoTipo.length === 0) return null;
            return (
              <Card key={tipo}>
                <CardHeader>
                  <CardTitle>{TIPO_LABELS[tipo]} ({salasDoTipo.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {salasDoTipo.map(sala => (
                      <Card key={sala.id} className="relative overflow-hidden">
                        <div className={cn('absolute top-0 left-0 right-0 h-1', SALA_STATUS_COLORS[sala.status])} />
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{sala.nome}</h4>
                              <p className="text-sm text-muted-foreground">Capacidade: {sala.capacidade}</p>
                              {sala.medicoResponsavel && (
                                <p className="text-sm text-primary mt-1">{getMedicoNome(sala.medicoResponsavel)}</p>
                              )}
                            </div>
                            <Badge variant="outline">{SALA_STATUS_LABELS[sala.status]}</Badge>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {sala.status === 'disponivel' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'ocupado')}>
                                Ocupar
                              </Button>
                            )}
                            {sala.status === 'ocupado' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'limpeza')}>
                                Liberar
                              </Button>
                            )}
                            {sala.status === 'limpeza' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeSalaStatus(sala, 'disponivel')}>
                                Pronta
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleOpenSalaDialog(sala)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="leitos" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid gap-4 md:grid-cols-4">
              {(['disponivel', 'ocupado', 'reservado', 'manutencao'] as Leito['status'][]).map(status => (
                <Card key={status} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{leitos.filter(l => l.status === status).length}</p>
                      <p className="text-sm text-muted-foreground capitalize">{status}</p>
                    </div>
                    <div className={cn('w-4 h-4 rounded-full', LEITO_STATUS_COLORS[status])} />
                  </div>
                </Card>
              ))}
            </div>
            <Button onClick={() => handleOpenLeitoDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Leito
            </Button>
          </div>

          {Object.entries(leitosPorTipo).map(([tipo, leitosDoTipo]) => {
            if (leitosDoTipo.length === 0) return null;
            return (
              <Card key={tipo}>
                <CardHeader>
                  <CardTitle className="capitalize">{tipo} ({leitosDoTipo.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {leitosDoTipo.map(leito => (
                      <Card key={leito.id} className="relative overflow-hidden">
                        <div className={cn('absolute top-0 left-0 right-0 h-1', LEITO_STATUS_COLORS[leito.status])} />
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{leito.numero}</h4>
                              {leito.pacienteId && (
                                <p className="text-sm text-primary">{getPacienteNome(leito.pacienteId)}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="capitalize">{leito.status}</Badge>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {leito.status === 'disponivel' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeLeitoStatus(leito, 'ocupado')}>
                                Ocupar
                              </Button>
                            )}
                            {leito.status === 'ocupado' && (
                              <Button size="sm" variant="outline" onClick={() => handleChangeLeitoStatus(leito, 'disponivel')}>
                                Alta
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleOpenLeitoDialog(leito)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Sala Dialog */}
      <Dialog open={isSalaDialogOpen} onOpenChange={setIsSalaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSala ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Sala *</Label>
              <Input value={salaFormData.nome} onChange={(e) => setSalaFormData({ ...salaFormData, nome: e.target.value })} placeholder="Consultório 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={salaFormData.tipo} onValueChange={(v: Sala['tipo']) => setSalaFormData({ ...salaFormData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultorio">Consultório</SelectItem>
                    <SelectItem value="exame">Sala de Exames</SelectItem>
                    <SelectItem value="procedimento">Procedimentos</SelectItem>
                    <SelectItem value="triagem">Triagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input type="number" min={1} value={salaFormData.capacidade} onChange={(e) => setSalaFormData({ ...salaFormData, capacidade: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={salaFormData.status} onValueChange={(v: StatusSala) => setSalaFormData({ ...salaFormData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSala}>{editingSala ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leito Dialog */}
      <Dialog open={isLeitoDialogOpen} onOpenChange={setIsLeitoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLeito ? 'Editar Leito' : 'Novo Leito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número do Leito *</Label>
              <Input value={leitoFormData.numero} onChange={(e) => setLeitoFormData({ ...leitoFormData, numero: e.target.value })} placeholder="L-101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={leitoFormData.tipo} onValueChange={(v: Leito['tipo']) => setLeitoFormData({ ...leitoFormData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enfermaria">Enfermaria</SelectItem>
                    <SelectItem value="uti">UTI</SelectItem>
                    <SelectItem value="observacao">Observação</SelectItem>
                    <SelectItem value="recuperacao">Recuperação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={leitoFormData.status} onValueChange={(v: Leito['status']) => setLeitoFormData({ ...leitoFormData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(leitoFormData.status === 'ocupado' || leitoFormData.status === 'reservado') && (
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select value={leitoFormData.pacienteId} onValueChange={(v) => setLeitoFormData({ ...leitoFormData, pacienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeitoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLeito}>{editingLeito ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
