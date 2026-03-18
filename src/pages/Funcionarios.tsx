import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, Loader2, Send, CheckCircle } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppRole } from '@/contexts/SupabaseAuthContext';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FuncionarioWithRoles {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cargo: string | null;
  departamento: string | null;
  ativo: boolean | null;
  user_id: string | null;
  roles: AppRole[];
  hasInvitation?: boolean;
}

const ROLE_CONFIG: { role: AppRole; label: string; description: string; color: string }[] = [
  { role: 'admin', label: 'Administrador', description: 'Acesso total ao sistema', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { role: 'medico', label: 'Médico', description: 'Prontuários, prescrições e atestados', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { role: 'recepcao', label: 'Recepção', description: 'Pacientes, agenda e fila', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { role: 'enfermagem', label: 'Enfermagem', description: 'Triagem, sinais vitais e estoque', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { role: 'financeiro', label: 'Financeiro', description: 'Contas, lançamentos e relatórios', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
];

export default function Funcionarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<string | null>(null);
  const [editingFunc, setEditingFunc] = useState<FuncionarioWithRoles | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    departamento: '',
    ativo: true,
    selectedRoles: [] as AppRole[],
  });

  const queryClient = useQueryClient();

  // Buscar funcionários com seus papéis
  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ['funcionarios-with-roles'],
    queryFn: async () => {
      // Buscar funcionários
      const { data: funcs, error: funcsError } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');

      if (funcsError) throw funcsError;

      // Para cada funcionário com user_id, buscar seus roles
      const funcionariosWithRoles: FuncionarioWithRoles[] = await Promise.all(
        (funcs || []).map(async (func) => {
          let roles: AppRole[] = [];
          
          if (func.user_id) {
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', func.user_id);
            
            roles = (rolesData?.map(r => r.role) || []) as AppRole[];
          }

          return {
            ...func,
            roles,
          };
        })
      );

      return funcionariosWithRoles;
    },
  });

  // Mutation para criar funcionário
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // 1. Criar o funcionário
      const { data: newFunc, error: funcError } = await supabase
        .from('funcionarios')
        .insert({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          cargo: data.cargo || null,
          departamento: data.departamento || null,
          ativo: data.ativo,
        })
        .select()
        .single();

      if (funcError) throw funcError;

      // 2. Se tiver email, verificar se existe um usuário com esse email para vincular
      if (data.email) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', data.email)
          .maybeSingle();

        if (profiles?.id) {
          // Vincular funcionário ao usuário
          await supabase
            .from('funcionarios')
            .update({ user_id: profiles.id })
            .eq('id', newFunc.id);

          // Adicionar os papéis selecionados
          if (data.selectedRoles.length > 0) {
            const rolesToInsert = data.selectedRoles.map(role => ({
              user_id: profiles.id,
              role,
            }));

            await supabase.from('user_roles').insert(rolesToInsert);
          }
        }
      }

      return newFunc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      toast.success('Funcionário cadastrado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar funcionário: ' + error.message);
    },
  });

  // Mutation para atualizar funcionário
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, userId }: { id: string; data: typeof formData; userId: string | null }) => {
      // 1. Atualizar dados do funcionário
      const { error: funcError } = await supabase
        .from('funcionarios')
        .update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          cargo: data.cargo || null,
          departamento: data.departamento || null,
          ativo: data.ativo,
        })
        .eq('id', id);

      if (funcError) throw funcError;

      // 2. Se tiver user_id, atualizar os papéis
      if (userId) {
        // Remover papéis antigos
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Adicionar novos papéis
        if (data.selectedRoles.length > 0) {
          const rolesToInsert = data.selectedRoles.map(role => ({
            user_id: userId,
            role,
          }));

          await supabase.from('user_roles').insert(rolesToInsert);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      toast.success('Funcionário atualizado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar funcionário: ' + error.message);
    },
  });

  // Mutation para excluir funcionário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      toast.success('Funcionário excluído com sucesso!');
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir funcionário: ' + error.message);
    },
  });

  // Mutation para enviar convite por e-mail
  const inviteMutation = useMutation({
    mutationFn: async (func: FuncionarioWithRoles) => {
      if (!func.email) {
        throw new Error('Funcionário não possui e-mail cadastrado');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      const response = await supabase.functions.invoke('send-employee-invitation', {
        body: {
          funcionarioId: func.id,
          email: func.email,
          nome: func.nome,
          roles: func.roles,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao enviar convite');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao enviar convite');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      const codigo = data?.inviteCode || data?.token;
      if (codigo) {
        toast.success(`Convite enviado! Código: ${codigo}`);
      } else {
        toast.success('Convite enviado com sucesso!');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar convite: ' + error.message);
    },
  });

  const handleSendInvitation = (func: FuncionarioWithRoles) => {
    if (!func.email) {
      toast.error('Cadastre um e-mail para este funcionário primeiro');
      return;
    }
    inviteMutation.mutate(func);
  };

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (func?: FuncionarioWithRoles) => {
    if (func) {
      setEditingFunc(func);
      setFormData({
        nome: func.nome,
        email: func.email || '',
        telefone: func.telefone || '',
        cargo: func.cargo || '',
        departamento: func.departamento || '',
        ativo: func.ativo ?? true,
        selectedRoles: func.roles || [],
      });
    } else {
      setEditingFunc(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        departamento: '',
        ativo: true,
        selectedRoles: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      toast.error('Preencha o nome do funcionário.');
      return;
    }

    if (editingFunc) {
      updateMutation.mutate({ 
        id: editingFunc.id, 
        data: formData, 
        userId: editingFunc.user_id 
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (id: string) => {
    setFuncionarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (funcionarioToDelete) {
      deleteMutation.mutate(funcionarioToDelete);
    }
  };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role],
    }));
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getRoleColor = (role: AppRole) => {
    return ROLE_CONFIG.find(r => r.role === role)?.color || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: AppRole) => {
    return ROLE_CONFIG.find(r => r.role === role)?.label || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie a equipe e suas permissões de acesso</p>
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
                  <TableHead>Permissões</TableHead>
                  <TableHead className="hidden md:table-cell">Cargo</TableHead>
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {func.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {func.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {func.roles.length > 0 ? (
                            func.roles.map(role => (
                              <Badge key={role} className={getRoleColor(role)}>
                                {getRoleLabel(role)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Sem permissões</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {func.cargo || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={func.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}>
                          {func.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Botão de Enviar Convite - só aparece se não tem user_id e tem email */}
                          {!func.user_id && func.email && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleSendInvitation(func)}
                                  disabled={inviteMutation.isPending}
                                >
                                  {inviteMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Enviar convite por e-mail</TooltipContent>
                            </Tooltip>
                          )}
                          {/* Badge de conta vinculada */}
                          {func.user_id && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center w-8 h-8">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Conta vinculada</TooltipContent>
                            </Tooltip>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(func)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(func.id)}>
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

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
            <DialogDescription>
              {editingFunc 
                ? 'Atualize os dados e permissões do funcionário.'
                : 'Cadastre um novo funcionário e defina suas permissões de acesso.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome Sobrenome"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@clinica.com"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Recepcionista"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    placeholder="Ex: Atendimento"
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

            {/* Permissões de Acesso */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Permissões de Acesso</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione o que este funcionário pode acessar no sistema.
                  {!editingFunc?.user_id && (
                    <span className="block text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ As permissões só serão aplicadas quando o funcionário criar uma conta com o mesmo e-mail.
                    </span>
                  )}
                </p>
              </div>
              
              <div className="grid gap-3">
                {ROLE_CONFIG.map(({ role, label, description, color }) => (
                  <div
                    key={role}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      formData.selectedRoles.includes(role)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleRole(role)}
                  >
                    <Checkbox
                      checked={formData.selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label}</span>
                        <Badge className={color} variant="secondary">
                          {role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingFunc ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O funcionário será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
