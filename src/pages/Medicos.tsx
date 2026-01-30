import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Stethoscope, Phone, Mail } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';

export default function Medicos() {
  const [medicos, setMedicos] = useState<(User & { senha?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crm: '',
    especialidade: '',
    telefone: '',
    ativo: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMedicos();
  }, []);

  const loadMedicos = () => {
    const users = getAll<User & { senha?: string }>('users');
    setMedicos(users.filter(u => u.role === 'medico'));
  };

  const filteredMedicos = medicos.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.crm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (medico?: User) => {
    if (medico) {
      setEditingMedico(medico);
      setFormData({
        nome: medico.nome,
        email: medico.email,
        crm: medico.crm || '',
        especialidade: medico.especialidade || '',
        telefone: medico.telefone || '',
        ativo: medico.ativo,
      });
    } else {
      setEditingMedico(null);
      setFormData({
        nome: '',
        email: '',
        crm: '',
        especialidade: '',
        telefone: '',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email || !formData.crm) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const allUsers = getAll<User & { senha?: string }>('users');

    if (editingMedico) {
      const index = allUsers.findIndex(u => u.id === editingMedico.id);
      if (index !== -1) {
        allUsers[index] = {
          ...allUsers[index],
          ...formData,
        };
      }
    } else {
      const novoMedico: User & { senha: string } = {
        id: generateId(),
        ...formData,
        role: 'medico',
        criadoEm: new Date().toISOString(),
        senha: 'medico123',
      };
      allUsers.push(novoMedico);
    }

    setCollection('users', allUsers);
    loadMedicos();
    setIsDialogOpen(false);
    toast({
      title: editingMedico ? 'Médico atualizado' : 'Médico cadastrado',
      description: editingMedico ? 'Os dados foram atualizados.' : 'O médico foi cadastrado com sucesso.',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este médico?')) {
      const allUsers = getAll<User>('users');
      const filtered = allUsers.filter(u => u.id !== id);
      setCollection('users', filtered as any);
      loadMedicos();
      toast({
        title: 'Médico excluído',
        description: 'O médico foi removido do sistema.',
      });
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Médicos</h1>
          <p className="text-muted-foreground">Gerencie o corpo clínico da clínica</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Médico
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Corpo Clínico ({filteredMedicos.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CRM ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="hidden md:table-cell">CRM</TableHead>
                  <TableHead className="hidden sm:table-cell">Especialidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum médico encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicos.map((medico) => (
                    <TableRow key={medico.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(medico.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{medico.nome}</p>
                            <p className="text-sm text-muted-foreground">{medico.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{medico.crm}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{medico.especialidade}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {medico.telefone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {medico.telefone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={medico.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {medico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(medico)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(medico.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            <DialogTitle>{editingMedico ? 'Editar Médico' : 'Novo Médico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Dr. Nome Sobrenome"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@clinica.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CRM *</Label>
                <Input
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  placeholder="CRM/UF 123456"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input
                value={formData.especialidade}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                placeholder="Cardiologia, Pediatria, etc."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Médico ativo</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingMedico ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
