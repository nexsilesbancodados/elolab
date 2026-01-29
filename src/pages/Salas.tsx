import { useState, useEffect } from 'react';
import { Plus, Search, DoorOpen, Settings, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Sala, StatusSala, User } from '@/types';
import { getAll, generateId, setItem } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<StatusSala, string> = {
  disponivel: 'bg-green-500',
  ocupado: 'bg-red-500',
  manutencao: 'bg-yellow-500',
  limpeza: 'bg-blue-500',
};

const STATUS_LABELS: Record<StatusSala, string> = {
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

export default function Salas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'consultorio' as Sala['tipo'],
    capacidade: 1,
    status: 'disponivel' as StatusSala,
    medicoResponsavel: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const salasData = getAll<Sala>('salas');
    if (salasData.length === 0) {
      // Seed initial rooms
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
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  };

  const handleOpenDialog = (sala?: Sala) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nome: sala.nome,
        tipo: sala.tipo,
        capacidade: sala.capacidade,
        status: sala.status,
        medicoResponsavel: sala.medicoResponsavel || '',
      });
    } else {
      setEditingSala(null);
      setFormData({
        nome: '',
        tipo: 'consultorio',
        capacidade: 1,
        status: 'disponivel',
        medicoResponsavel: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      toast({
        title: 'Erro',
        description: 'Preencha o nome da sala.',
        variant: 'destructive',
      });
      return;
    }

    const allSalas = getAll<Sala>('salas');

    if (editingSala) {
      const index = allSalas.findIndex(s => s.id === editingSala.id);
      if (index !== -1) {
        allSalas[index] = { ...allSalas[index], ...formData };
      }
    } else {
      const novaSala: Sala = {
        id: generateId(),
        ...formData,
      };
      allSalas.push(novaSala);
    }

    setItem('salas', allSalas);
    loadData();
    setIsDialogOpen(false);
    toast({
      title: editingSala ? 'Sala atualizada' : 'Sala cadastrada',
      description: editingSala ? 'Os dados foram atualizados.' : 'A sala foi cadastrada com sucesso.',
    });
  };

  const handleChangeStatus = (sala: Sala, newStatus: StatusSala) => {
    const allSalas = getAll<Sala>('salas');
    const index = allSalas.findIndex(s => s.id === sala.id);
    if (index !== -1) {
      allSalas[index].status = newStatus;
      if (newStatus !== 'ocupado') {
        allSalas[index].medicoResponsavel = undefined;
      }
      setItem('salas', allSalas);
      loadData();
      toast({
        title: 'Status atualizado',
        description: `${sala.nome} está agora ${STATUS_LABELS[newStatus]}.`,
      });
    }
  };

  const getMedicoNome = (id?: string) => {
    if (!id) return null;
    return medicos.find(m => m.id === id)?.nome;
  };

  const salasPorTipo = {
    consultorio: salas.filter(s => s.tipo === 'consultorio'),
    exame: salas.filter(s => s.tipo === 'exame'),
    procedimento: salas.filter(s => s.tipo === 'procedimento'),
    triagem: salas.filter(s => s.tipo === 'triagem'),
    espera: salas.filter(s => s.tipo === 'espera'),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salas e Consultórios</h1>
          <p className="text-muted-foreground">Gerencie a disponibilidade das salas</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['disponivel', 'ocupado', 'manutencao', 'limpeza'] as StatusSala[]).map(status => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{salas.filter(s => s.status === status).length}</p>
                  <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
                </div>
                <div className={cn('w-4 h-4 rounded-full', STATUS_COLORS[status])} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Salas por Tipo */}
      {Object.entries(salasPorTipo).map(([tipo, salasDoTipo]) => {
        if (salasDoTipo.length === 0) return null;
        return (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                {TIPO_LABELS[tipo]} ({salasDoTipo.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {salasDoTipo.map(sala => (
                  <Card key={sala.id} className="relative overflow-hidden">
                    <div className={cn('absolute top-0 left-0 right-0 h-1', STATUS_COLORS[sala.status])} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{sala.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            Capacidade: {sala.capacidade} pessoas
                          </p>
                          {sala.medicoResponsavel && (
                            <p className="text-sm text-primary mt-1">
                              {getMedicoNome(sala.medicoResponsavel)}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {STATUS_LABELS[sala.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {sala.status === 'disponivel' && (
                          <Button size="sm" variant="outline" onClick={() => handleChangeStatus(sala, 'ocupado')}>
                            Ocupar
                          </Button>
                        )}
                        {sala.status === 'ocupado' && (
                          <Button size="sm" variant="outline" onClick={() => handleChangeStatus(sala, 'limpeza')}>
                            Liberar
                          </Button>
                        )}
                        {sala.status === 'limpeza' && (
                          <Button size="sm" variant="outline" onClick={() => handleChangeStatus(sala, 'disponivel')}>
                            Pronta
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(sala)}>
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSala ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Sala *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Consultório 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v: Sala['tipo']) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultorio">Consultório</SelectItem>
                    <SelectItem value="exame">Sala de Exames</SelectItem>
                    <SelectItem value="procedimento">Procedimentos</SelectItem>
                    <SelectItem value="triagem">Triagem</SelectItem>
                    <SelectItem value="espera">Sala de Espera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.capacidade}
                  onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v: StatusSala) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'ocupado' && (
              <div className="space-y-2">
                <Label>Médico Responsável</Label>
                <Select
                  value={formData.medicoResponsavel}
                  onValueChange={(v) => setFormData({ ...formData, medicoResponsavel: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingSala ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
