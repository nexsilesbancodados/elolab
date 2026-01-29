import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types';
import { getAll, generateId, remove } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  recepcao: 'Recepção',
  enfermagem: 'Enfermagem',
  financeiro: 'Financeiro',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  medico: 'bg-blue-100 text-blue-800',
  recepcao: 'bg-green-100 text-green-800',
  enfermagem: 'bg-purple-100 text-purple-800',
  financeiro: 'bg-yellow-100 text-yellow-800',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User & { senha: string }>>({});
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsuarios(getAll<User>('users'));
  };

  const handleNew = () => {
    setSelectedUser(null);
    setFormData({
      ativo: true,
      role: 'recepcao',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser) {
      if (selectedUser.id === currentUser?.id) {
        toast({
          title: 'Erro',
          description: 'Você não pode excluir seu próprio usuário.',
          variant: 'destructive',
        });
        setIsDeleteOpen(false);
        return;
      }
      remove('users', selectedUser.id);
      loadData();
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido com sucesso.',
      });
    }
    setIsDeleteOpen(false);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email || !formData.role) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUser && !formData.senha) {
      toast({
        title: 'Erro',
        description: 'A senha é obrigatória para novos usuários.',
        variant: 'destructive',
      });
      return;
    }

    const allUsers = getAll<User>('users');

    // Check for duplicate email
    const emailExists = allUsers.some(
      (u) => u.email === formData.email && u.id !== selectedUser?.id
    );
    if (emailExists) {
      toast({
        title: 'Erro',
        description: 'Este email já está em uso.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedUser) {
      const index = allUsers.findIndex((u) => u.id === selectedUser.id);
      if (index !== -1) {
        allUsers[index] = { ...allUsers[index], ...formData } as User;
      }
    } else {
      const newUser: User = {
        id: generateId(),
        nome: formData.nome!,
        email: formData.email!,
        role: formData.role!,
        crm: formData.crm,
        especialidade: formData.especialidade,
        ativo: formData.ativo ?? true,
        criadoEm: new Date().toISOString(),
      };
      allUsers.push(newUser);

      // Store password separately (in a real app, this would be hashed)
      const passwords = JSON.parse(localStorage.getItem('elolab_clinic_passwords') || '{}');
      passwords[newUser.email] = formData.senha;
      localStorage.setItem('elolab_clinic_passwords', JSON.stringify(passwords));
    }

    localStorage.setItem('elolab_clinic_users', JSON.stringify(allUsers));
    loadData();
    setIsFormOpen(false);
    toast({
      title: selectedUser ? 'Usuário atualizado' : 'Usuário criado',
      description: 'Os dados foram salvos com sucesso.',
    });
  };

  const handleToggleAtivo = (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode desativar seu próprio usuário.',
        variant: 'destructive',
      });
      return;
    }

    const allUsers = getAll<User>('users');
    const index = allUsers.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      allUsers[index].ativo = !allUsers[index].ativo;
      localStorage.setItem('elolab_clinic_users', JSON.stringify(allUsers));
      loadData();
      toast({
        title: allUsers[index].ativo ? 'Usuário ativado' : 'Usuário desativado',
        description: `${user.nome} foi ${allUsers[index].ativo ? 'ativado' : 'desativado'}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="hidden md:table-cell">Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id} className={!usuario.ativo ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {usuario.role === 'admin' && (
                            <Shield className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{usuario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge className={cn(ROLE_COLORS[usuario.role])}>
                          {ROLE_LABELS[usuario.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {usuario.especialidade || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={usuario.ativo}
                            onCheckedChange={() => handleToggleAtivo(usuario)}
                            disabled={usuario.id === currentUser?.id}
                          />
                          {usuario.ativo ? (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserX className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(usuario)}
                            disabled={usuario.id === currentUser?.id}
                          >
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {!selectedUser && (
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={formData.senha || ''}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'medico' && (
              <>
                <div className="space-y-2">
                  <Label>CRM</Label>
                  <Input
                    value={formData.crm || ''}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    placeholder="CRM/UF 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input
                    value={formData.especialidade || ''}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Cardiologia"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label>Usuário Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{selectedUser?.nome}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
