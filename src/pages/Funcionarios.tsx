import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Users, Phone } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  enfermagem: 'Enfermagem',
  financeiro: 'Financeiro',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  recepcao: 'bg-blue-100 text-blue-800',
  enfermagem: 'bg-green-100 text-green-800',
  financeiro: 'bg-yellow-100 text-yellow-800',
};

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<(User & { senha?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'recepcao' as UserRole,
    telefone: '',
    ativo: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = () => {
    const users = getAll<User & { senha?: string }>('users');
    setFuncionarios(users.filter(u => u.role !== 'medico'));
  };

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (func?: User) => {
    if (func) {
      setEditingFunc(func);
      setFormData({
        nome: func.nome,
        email: func.email,
        role: func.role,
        telefone: func.telefone || '',
        ativo: func.ativo,
      });
    } else {
      setEditingFunc(null);
      setFormData({
        nome: '',
        email: '',
        role: 'recepcao',
        telefone: '',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const allUsers = getAll<User & { senha?: string }>('users');

    if (editingFunc) {
      const index = allUsers.findIndex(u => u.id === editingFunc.id);
      if (index !== -1) {
        allUsers[index] = {
          ...allUsers[index],
          ...formData,
        };
      }
    } else {
      const novoFunc: User & { senha: string } = {
        id: generateId(),
        ...formData,
        criadoEm: new Date().toISOString(),
        senha: 'func123',
      };
      allUsers.push(novoFunc);
    }

    setCollection('users', allUsers);
    loadFuncionarios();
    setIsDialogOpen(false);
    toast({
      title: editingFunc ? 'Funcionário atualizado' : 'Funcionário cadastrado',
      description: editingFunc ? 'Os dados foram atualizados.' : 'O funcionário foi cadastrado com sucesso.',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      const allUsers = getAll<User>('users');
      const filtered = allUsers.filter(u => u.id !== id);
      setCollection('users', filtered as any);
      loadFuncionarios();
      toast({
        title: 'Funcionário excluído',
        description: 'O funcionário foi removido do sistema.',
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
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie a equipe administrativa</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipe ({filteredFuncionarios.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
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
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuncionarios.map((func) => (
                    <TableRow key={func.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(func.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{func.nome}</p>
                            <p className="text-sm text-muted-foreground">{func.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[func.role]}>
                          {ROLE_LABELS[func.role] || func.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {func.telefone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={func.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {func.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(func)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(func.id)}>
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
            <DialogTitle>{editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome Sobrenome"
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
                <Label>Função *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                    <SelectItem value="enfermagem">Enfermagem</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="flex items-center justify-between">
              <Label>Funcionário ativo</Label>
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
              {editingFunc ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
