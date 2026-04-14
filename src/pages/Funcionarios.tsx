import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Users, Mail, Phone, Loader2, Send,
  CheckCircle, Stethoscope, Briefcase, UserCog, Shield, Clock, Heart,
  FlaskConical, Activity, HeadphonesIcon, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppRole, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  { role: 'admin', label: 'Administrador', description: 'Acesso total ao sistema', color: 'bg-purple-100 text-purple-800' },
  { role: 'medico', label: 'Médico', description: 'Prontuários, prescrições e atestados', color: 'bg-blue-100 text-blue-800' },
  { role: 'recepcao', label: 'Recepção', description: 'Pacientes, agenda e fila', color: 'bg-cyan-100 text-cyan-800' },
  { role: 'enfermagem', label: 'Enfermagem', description: 'Triagem, sinais vitais e estoque', color: 'bg-green-100 text-green-800' },
  { role: 'financeiro', label: 'Financeiro', description: 'Contas, lançamentos e relatórios', color: 'bg-yellow-100 text-yellow-800' },
];

const TIPO_FUNCIONARIO_CONFIG: {
  value: string;
  label: string;
  icon: typeof Stethoscope;
  registroLabel?: string;
  registroTipo?: string;
  defaultRoles: AppRole[];
  description: string;
}[] = [
  { value: 'medico', label: 'Médico(a)', icon: Stethoscope, registroLabel: 'CRM', registroTipo: 'CRM', defaultRoles: ['medico'], description: 'Atendimento clínico, prontuários e prescrições' },
  { value: 'enfermeiro', label: 'Enfermeira(o)', icon: Heart, registroLabel: 'COREN', registroTipo: 'COREN', defaultRoles: ['enfermagem'], description: 'Cuidados de enfermagem e procedimentos' },
  { value: 'tecnico_enfermagem', label: 'Téc. Enfermagem', icon: Activity, registroLabel: 'COREN', registroTipo: 'COREN', defaultRoles: ['enfermagem'], description: 'Apoio em triagem e sinais vitais' },
  { value: 'tecnico_laboratorio', label: 'Téc. Laboratório', icon: FlaskConical, registroLabel: 'CRT', registroTipo: 'CRT', defaultRoles: ['enfermagem'], description: 'Coletas e análises laboratoriais' },
  { value: 'atendente', label: 'Atendente', icon: HeadphonesIcon, defaultRoles: ['recepcao'], description: 'Recepção, agenda e atendimento ao público' },
  { value: 'gerente', label: 'Gerente / Dono(a)', icon: UserCog, defaultRoles: ['admin', 'financeiro'], description: 'Gestão completa da clínica' },
  { value: 'administrativo', label: 'Administrativo', icon: Building2, defaultRoles: ['financeiro'], description: 'Faturamento, contas e relatórios' },
];

const UF_OPTIONS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const TURNO_OPTIONS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
  { value: 'plantao_12', label: 'Plantão 12h' },
  { value: 'plantao_24', label: 'Plantão 24h' },
];

interface FormDataType {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  ativo: boolean;
  selectedRoles: AppRole[];
  tipo_funcionario: string;
  registro_profissional: string;
  tipo_registro: string;
  uf_registro: string;
  especialidade: string;
  data_nascimento: string;
  cpf: string;
  carga_horaria: string;
  turno: string;
}

const initialFormData: FormDataType = {
  nome: '', email: '', telefone: '', cargo: '', departamento: '', ativo: true,
  selectedRoles: [],
  tipo_funcionario: '', registro_profissional: '', tipo_registro: '', uf_registro: 'SP',
  especialidade: '', data_nascimento: '', cpf: '', carga_horaria: '40', turno: 'integral',
};

/** Aplica máscara de CPF */
function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Aplica máscara de telefone */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export default function Funcionarios() {
  const { profile } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<string | null>(null);
  const [editingFunc, setEditingFunc] = useState<FuncionarioWithRoles | null>(null);
  const [formData, setFormData] = useState<FormDataType>({ ...initialFormData });
  const [formStep, setFormStep] = useState<'tipo' | 'dados'>('tipo');

  const queryClient = useQueryClient();

  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ['funcionarios-with-roles'],
    queryFn: async () => {
      const { data: funcs, error: funcsError } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');
      if (funcsError) throw funcsError;

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
          return { ...func, roles };
        })
      );
      return funcionariosWithRoles;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormDataType) => {
      const { data: newFunc, error: funcError } = await supabase
        .from('funcionarios')
        .insert({
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone || null,
          cargo: data.cargo || null,
          departamento: data.departamento || null,
          ativo: data.ativo,
          clinica_id: profile?.clinica_id || null,
          tipo_funcionario: data.tipo_funcionario || 'atendente',
          registro_profissional: data.registro_profissional || null,
          tipo_registro: data.tipo_registro || null,
          uf_registro: data.uf_registro || null,
          especialidade: data.especialidade || null,
          data_nascimento: data.data_nascimento || null,
          cpf: data.cpf || null,
          carga_horaria: data.carga_horaria ? parseInt(data.carga_horaria) : null,
          turno: data.turno || 'integral',
        } as any)
        .select()
        .single();
      if (funcError) throw funcError;

      if (data.email) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', data.email)
          .maybeSingle();
        if (profiles?.id) {
          await supabase.from('funcionarios').update({ user_id: profiles.id }).eq('id', newFunc.id);
          if (data.selectedRoles.length > 0) {
            await supabase.from('user_roles').insert(data.selectedRoles.map(role => ({ user_id: profiles.id, role })));
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
    onError: (error: any) => toast.error('Erro ao cadastrar: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, userId }: { id: string; data: FormDataType; userId: string | null }) => {
      const { error: funcError } = await supabase
        .from('funcionarios')
        .update({
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone || null,
          cargo: data.cargo || null,
          departamento: data.departamento || null,
          ativo: data.ativo,
          tipo_funcionario: data.tipo_funcionario || 'atendente',
          registro_profissional: data.registro_profissional || null,
          tipo_registro: data.tipo_registro || null,
          uf_registro: data.uf_registro || null,
          especialidade: data.especialidade || null,
          data_nascimento: data.data_nascimento || null,
          cpf: data.cpf || null,
          carga_horaria: data.carga_horaria ? parseInt(data.carga_horaria) : null,
          turno: data.turno || 'integral',
        } as any)
        .eq('id', id);
      if (funcError) throw funcError;

      if (userId) {
        await supabase.from('user_roles').delete().eq('user_id', userId);
        if (data.selectedRoles.length > 0) {
          await supabase.from('user_roles').insert(data.selectedRoles.map(role => ({ user_id: userId, role })));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      toast.success('Funcionário atualizado com sucesso!');
      setIsDialogOpen(false);
    },
    onError: (error: any) => toast.error('Erro ao atualizar: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      toast.success('Funcionário excluído com sucesso!');
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => toast.error('Erro ao excluir: ' + error.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async (func: FuncionarioWithRoles) => {
      if (!func.email) throw new Error('Funcionário não possui e-mail cadastrado');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Você precisa estar autenticado');
      const response = await supabase.functions.invoke('send-employee-invitation', {
        body: { funcionarioId: func.id, email: func.email, nome: func.nome, roles: func.roles },
      });
      if (response.error) throw new Error(response.error.message || 'Erro ao enviar convite');
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao enviar convite');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios-with-roles'] });
      const codigo = data?.inviteCode || data?.token;
      toast.success(codigo ? `Convite enviado! Código: ${codigo}` : 'Convite enviado com sucesso!');
    },
    onError: (error: any) => toast.error('Erro ao enviar convite: ' + error.message),
  });

  const handleSendInvitation = (func: FuncionarioWithRoles) => {
    if (!func.email) { toast.error('Cadastre um e-mail primeiro'); return; }
    inviteMutation.mutate(func);
  };

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (func?: FuncionarioWithRoles) => {
    if (func) {
      const raw = func as any;
      setEditingFunc(func);
      setFormData({
        nome: func.nome, email: func.email || '', telefone: func.telefone || '',
        cargo: func.cargo || '', departamento: func.departamento || '',
        ativo: func.ativo ?? true, selectedRoles: func.roles || [],
        tipo_funcionario: raw.tipo_funcionario || 'atendente',
        registro_profissional: raw.registro_profissional || '',
        tipo_registro: raw.tipo_registro || '',
        uf_registro: raw.uf_registro || 'SP',
        especialidade: raw.especialidade || '',
        data_nascimento: raw.data_nascimento || '',
        cpf: raw.cpf || '',
        carga_horaria: raw.carga_horaria ? String(raw.carga_horaria) : '40',
        turno: raw.turno || 'integral',
      });
      setFormStep('dados');
    } else {
      setEditingFunc(null);
      setFormData({ ...initialFormData });
      setFormStep('tipo');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome.trim()) { toast.error('Preencha o nome.'); return; }
    if (!formData.tipo_funcionario) { toast.error('Selecione o tipo de profissional.'); return; }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error('E-mail inválido.'); return; }

    const tipoConfig = TIPO_FUNCIONARIO_CONFIG.find(t => t.value === formData.tipo_funcionario);
    if (tipoConfig?.registroLabel && !formData.registro_profissional.trim()) {
      toast.error(`Informe o número do ${tipoConfig.registroLabel}.`);
      return;
    }

    if (editingFunc) {
      updateMutation.mutate({ id: editingFunc.id, data: formData, userId: editingFunc.user_id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (id: string) => { setFuncionarioToDelete(id); setDeleteDialogOpen(true); };
  const handleConfirmDelete = () => { if (funcionarioToDelete) deleteMutation.mutate(funcionarioToDelete); };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role],
    }));
  };

  const handleTipoSelect = (tipo: string) => {
    const config = TIPO_FUNCIONARIO_CONFIG.find(t => t.value === tipo);
    setFormData(prev => ({
      ...prev,
      tipo_funcionario: tipo,
      tipo_registro: config?.registroTipo || '',
      cargo: config?.label || prev.cargo,
      selectedRoles: config?.defaultRoles || [],
    }));
    setFormStep('dados');
  };

  const getInitials = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const getRoleColor = (role: AppRole) => ROLE_CONFIG.find(r => r.role === role)?.color || 'bg-muted text-muted-foreground';
  const getRoleLabel = (role: AppRole) => ROLE_CONFIG.find(r => r.role === role)?.label || role;

  const selectedTipoConfig = TIPO_FUNCIONARIO_CONFIG.find(t => t.value === formData.tipo_funcionario);
  const hasRegistro = !!selectedTipoConfig?.registroLabel;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie a equipe e suas permissões de acesso</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />Novo Funcionário
        </Button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: funcionarios.length, icon: Users },
          { label: 'Ativos', value: funcionarios.filter(f => f.ativo).length, icon: CheckCircle },
          { label: 'Com acesso', value: funcionarios.filter(f => f.user_id).length, icon: Shield },
          { label: 'Pendentes', value: funcionarios.filter(f => !f.user_id && f.email).length, icon: Clock },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />Equipe ({filteredFuncionarios.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="rounded-md border min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo / Registro</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFuncionarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum funcionário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFuncionarios.map((func) => {
                      const raw = func as any;
                      const tipoConfig = TIPO_FUNCIONARIO_CONFIG.find(t => t.value === raw.tipo_funcionario);
                      const TipoIcon = tipoConfig?.icon || Users;
                      return (
                        <TableRow key={func.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(func.nome)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{func.nome}</p>
                                {func.email && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    <Mail className="h-3 w-3 shrink-0" />{func.email}
                                  </p>
                                )}
                                {func.telefone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3 shrink-0" />{func.telefone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <TipoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{tipoConfig?.label || 'Atendente'}</span>
                              </div>
                              {raw.registro_profissional && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {raw.tipo_registro}: {raw.registro_profissional}{raw.uf_registro ? `/${raw.uf_registro}` : ''}
                                </p>
                              )}
                              {raw.especialidade && <p className="text-xs text-muted-foreground">{raw.especialidade}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {func.roles.length > 0 ? func.roles.map(role => (
                                <Badge key={role} className={getRoleColor(role)} variant="secondary">{getRoleLabel(role)}</Badge>
                              )) : <span className="text-xs text-muted-foreground italic">Sem permissões</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{TURNO_OPTIONS.find(t => t.value === raw.turno)?.label || '—'}</span>
                            {raw.carga_horaria && <span className="text-xs text-muted-foreground block">{raw.carga_horaria}h/sem</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={func.ativo ? 'default' : 'secondary'} className={func.ativo ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                              {func.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {!func.user_id && func.email && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handleSendInvitation(func)} disabled={inviteMutation.isPending}>
                                      {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-primary" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Enviar convite por e-mail</TooltipContent>
                                </Tooltip>
                              )}
                              {func.user_id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center w-8 h-8">
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Conta vinculada</TooltipContent>
                                </Tooltip>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(func)} aria-label="Editar funcionário">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(func.id)} aria-label="Excluir funcionário">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormStep('tipo'); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <AnimatePresence mode="wait">
            {formStep === 'tipo' && !editingFunc ? (
              <motion.div
                key="step-tipo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl">Novo Funcionário</DialogTitle>
                  <DialogDescription>Selecione o tipo de profissional para começar</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TIPO_FUNCIONARIO_CONFIG.map((tipo) => {
                    const Icon = tipo.icon;
                    return (
                      <motion.button
                        key={tipo.value}
                        whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTipoSelect(tipo.value)}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground">{tipo.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tipo.description}</p>
                          {tipo.registroLabel && (
                            <Badge variant="outline" className="mt-1.5 text-[10px]">{tipo.registroLabel}</Badge>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-dados"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <DialogHeader className="mb-2">
                  <div className="flex items-center gap-3">
                    {!editingFunc && (
                      <Button variant="ghost" size="sm" onClick={() => setFormStep('tipo')} className="h-8 px-2 -ml-2">
                        ← Voltar
                      </Button>
                    )}
                    <div>
                      <DialogTitle className="text-xl">
                        {editingFunc ? 'Editar Funcionário' : 'Dados do Profissional'}
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        {selectedTipoConfig && (
                          <>
                            {(() => { const Icon = selectedTipoConfig.icon; return <Icon className="h-3.5 w-3.5" />; })()}
                            <span>{selectedTipoConfig.label}</span>
                          </>
                        )}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Tipo (editável se estiver editando) */}
                  {editingFunc && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                        <Briefcase className="h-3.5 w-3.5" />Tipo de Profissional
                      </Label>
                      <Select value={formData.tipo_funcionario} onValueChange={(v) => {
                        const config = TIPO_FUNCIONARIO_CONFIG.find(t => t.value === v);
                        setFormData(prev => ({ ...prev, tipo_funcionario: v, tipo_registro: config?.registroTipo || '', cargo: config?.label || prev.cargo }));
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPO_FUNCIONARIO_CONFIG.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                {(() => { const I = t.icon; return <I className="h-3.5 w-3.5" />; })()}
                                {t.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Dados Pessoais */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados Pessoais</Label>
                    <div className="space-y-2">
                      <Label className="text-xs">Nome completo *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome Sobrenome"
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">CPF</Label>
                        <Input
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Data de Nascimento</Label>
                        <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">E-mail</Label>
                        <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@clinica.com" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Telefone</Label>
                        <Input
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registro Profissional */}
                  {hasRegistro && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <Stethoscope className="h-3.5 w-3.5" />Registro Profissional ({selectedTipoConfig?.registroLabel})
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Nº do Registro *</Label>
                            <Input
                              value={formData.registro_profissional}
                              onChange={(e) => setFormData({ ...formData, registro_profissional: e.target.value })}
                              placeholder="Ex: 12345"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Conselho</Label>
                            <Input value={formData.tipo_registro} readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">UF</Label>
                            <Select value={formData.uf_registro} onValueChange={v => setFormData({ ...formData, uf_registro: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent className="max-h-48">
                                {UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Especialidade</Label>
                          <Input
                            value={formData.especialidade}
                            onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                            placeholder="Ex: Cardiologia, Análises Clínicas"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Dados Funcionais */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados Funcionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Turno</Label>
                        <Select value={formData.turno} onValueChange={v => setFormData({ ...formData, turno: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TURNO_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Carga Horária (h/semana)</Label>
                        <Input type="number" value={formData.carga_horaria} onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })} placeholder="40" min={1} max={168} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <Label className="text-sm">Funcionário ativo</Label>
                        <p className="text-xs text-muted-foreground">Funcionários inativos não aparecem nas listas</p>
                      </div>
                      <Switch checked={formData.ativo} onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })} />
                    </div>
                  </div>

                  <Separator />

                  {/* Permissões */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />Permissões de Acesso
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Defina o que este funcionário pode acessar no sistema.
                        {!editingFunc?.user_id && (
                          <span className="block text-amber-600 mt-1">
                            ⚠️ As permissões serão aplicadas quando o funcionário criar uma conta.
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {ROLE_CONFIG.map(({ role, label, description, color }) => (
                        <motion.div
                          key={role}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            formData.selectedRoles.includes(role)
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => toggleRole(role)}
                        >
                          <Checkbox checked={formData.selectedRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{label}</span>
                              <Badge className={color} variant="secondary">{role}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="min-w-[120px]">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingFunc ? 'Salvar Alterações' : 'Cadastrar'}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O funcionário será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
