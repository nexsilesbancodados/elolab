import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Stethoscope, Phone, Mail, BadgeCheck, Award,
  FileText, Clock, User, Upload, Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { useMedicos } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

const INTERVALOS = [10, 15, 20, 25, 30, 40, 45, 50, 60];

interface FormData {
  nome: string;
  email: string;
  crm: string;
  crm_uf: string;
  cpf: string;
  rqe: string;
  cns: string;
  especialidade: string;
  telefone: string;
  intervalo_consulta: number;
  ativo: boolean;
  foto_url: string;
  carimbo_url: string;
}

const initialFormData: FormData = {
  nome: '', email: '', crm: '', crm_uf: 'SP', cpf: '', rqe: '', cns: '',
  especialidade: '', telefone: '', intervalo_consulta: 30, ativo: true,
  foto_url: '', carimbo_url: '',
};

export default function Medicos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCarimbo, setUploadingCarimbo] = useState(false);

  const queryClient = useQueryClient();
  const { data: medicos = [], isLoading } = useMedicos();

  const filteredMedicos = useMemo(() =>
    medicos.filter((m: any) =>
      (m.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.crm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.especialidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.cpf || '').includes(searchTerm)
    ),
    [medicos, searchTerm]
  );

  const handleOpenDialog = (medico?: any) => {
    if (medico) {
      setEditingId(medico.id);
      setFormData({
        nome: medico.nome || '',
        email: medico.email || '',
        crm: medico.crm,
        crm_uf: medico.crm_uf || 'SP',
        cpf: medico.cpf || '',
        rqe: medico.rqe || '',
        cns: medico.cns || '',
        especialidade: medico.especialidade || '',
        telefone: medico.telefone || '',
        intervalo_consulta: medico.intervalo_consulta ?? 30,
        ativo: medico.ativo,
        foto_url: medico.foto_url || '',
        carimbo_url: medico.carimbo_url || '',
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const handleUpload = async (file: File, bucket: string, field: 'foto_url' | 'carimbo_url') => {
    const setter = field === 'foto_url' ? setUploadingPhoto : setUploadingCarimbo;
    setter(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `medicos/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }));
      toast.success('Arquivo enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setter(false);
    }
  };

  const handleSave = async () => {
    if (!formData.crm) { toast.error('CRM é obrigatório.'); return; }
    if (!formData.nome) { toast.error('Nome é obrigatório.'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        nome: formData.nome || null,
        email: formData.email || null,
        crm: formData.crm,
        crm_uf: formData.crm_uf || null,
        cpf: formData.cpf || null,
        rqe: formData.rqe || null,
        cns: formData.cns || null,
        especialidade: formData.especialidade || null,
        telefone: formData.telefone || null,
        intervalo_consulta: formData.intervalo_consulta,
        ativo: formData.ativo,
        foto_url: formData.foto_url || null,
        carimbo_url: formData.carimbo_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from('medicos').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Médico atualizado com sucesso!');
      } else {
        const { data: newMedico, error } = await supabase.from('medicos').insert(payload).select().single();
        if (error) throw error;
        toast.success('Médico cadastrado com sucesso!');

        if (formData.email && newMedico) {
          try {
            const { data: funcData, error: funcError } = await supabase
              .from('funcionarios')
              .insert({ nome: formData.nome, email: formData.email, cargo: 'Médico', departamento: formData.especialidade || 'Clínico', ativo: true })
              .select().single();

            if (!funcError && funcData) {
              const { error: inviteError } = await supabase.functions.invoke('send-employee-invitation', {
                body: { funcionarioId: funcData.id, email: formData.email, nome: formData.nome, roles: ['medico'] },
              });
              if (inviteError) toast.info('Médico cadastrado, mas o convite não pôde ser enviado.');
              else toast.success(`Convite de acesso enviado para ${formData.email}`);
            }
          } catch { toast.info('Médico cadastrado. Convite pode ser enviado pela página de Funcionários.'); }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar médico:', error);
      toast.error(error.message || 'Erro ao salvar médico');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('medicos').delete().eq('id', selectedId);
      if (error) throw error;
      toast.success('Médico excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir médico');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Médicos</h1>
          <p className="text-muted-foreground">Gerencie o corpo clínico da clínica</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Médico
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" /> Corpo Clínico ({filteredMedicos.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CRM, CPF..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                  <TableHead className="hidden xl:table-cell">Intervalo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum médico encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicos.map((medico: any) => (
                    <TableRow key={medico.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {medico.foto_url && <AvatarImage src={medico.foto_url} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(medico.nome || medico.crm).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr(a). {medico.nome || medico.crm}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {medico.rqe ? `RQE ${medico.rqe} · ` : ''}{medico.especialidade || 'Clínico Geral'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{medico.crm}/{medico.crm_uf || '?'}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{medico.especialidade || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {medico.telefone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />{medico.telefone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="h-3 w-3" />{medico.intervalo_consulta ?? 30}min
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={medico.ativo ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                          {medico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" aria-label="Editar médico" onClick={() => handleOpenDialog(medico)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Excluir médico" onClick={() => handleDeleteClick(medico.id)}>
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

      {/* ─── Form Dialog (Enhanced) ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {editingId ? 'Editar Médico' : 'Novo Médico'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {formData.foto_url && <AvatarImage src={formData.foto_url} />}
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {(formData.nome || '??').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Foto de Perfil</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={uploadingPhoto}
                    onClick={() => document.getElementById('foto-upload')?.click()}>
                    <Upload className="h-3 w-3" />{uploadingPhoto ? 'Enviando...' : 'Upload'}
                  </Button>
                  {formData.foto_url && (
                    <Button variant="ghost" size="sm" className="text-xs text-destructive"
                      onClick={() => setFormData(p => ({ ...p, foto_url: '' }))}>Remover</Button>
                  )}
                </div>
                <input id="foto-upload" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'patient-photos', 'foto_url')} />
              </div>
            </div>

            <Separator />

            {/* Dados Pessoais */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <User className="h-4 w-4" /> Dados Pessoais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome Completo *</Label>
                  <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Dr. João Silva" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPF</Label>
                  <Input value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: e.target.value }))}
                    placeholder="000.000.000-00" maxLength={14} />
                  <p className="text-[10px] text-muted-foreground">Obrigatório para guias TISS e NF</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="medico@email.com" />
                  {!editingId && formData.email && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Convite de acesso será enviado automaticamente
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Registro Profissional */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Registro Profissional
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">CRM *</Label>
                  <Input value={formData.crm} onChange={e => setFormData(p => ({ ...p, crm: e.target.value }))}
                    placeholder="123456" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">UF do CRM *</Label>
                  <Select value={formData.crm_uf} onValueChange={v => setFormData(p => ({ ...p, crm_uf: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RQE</Label>
                  <Input value={formData.rqe} onChange={e => setFormData(p => ({ ...p, rqe: e.target.value }))}
                    placeholder="Ex: 12345" />
                  <p className="text-[10px] text-muted-foreground">Registro de Qualificação de Especialidade</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CNS</Label>
                  <Input value={formData.cns} onChange={e => setFormData(p => ({ ...p, cns: e.target.value }))}
                    placeholder="Cartão Nacional de Saúde" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Especialidade</Label>
                <Input value={formData.especialidade} onChange={e => setFormData(p => ({ ...p, especialidade: e.target.value }))}
                  placeholder="Cardiologia, Pediatria, etc." />
              </div>
            </div>

            <Separator />

            {/* Configurações de Agenda */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Configurações de Agenda
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Intervalo Padrão de Consulta</Label>
                  <Select value={String(formData.intervalo_consulta)}
                    onValueChange={v => setFormData(p => ({ ...p, intervalo_consulta: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERVALOS.map(i => <SelectItem key={i} value={String(i)}>{i} minutos</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Define automaticamente os slots na agenda</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label className="text-sm">Médico ativo</Label>
                  <Switch checked={formData.ativo}
                    onCheckedChange={checked => setFormData(p => ({ ...p, ativo: checked }))} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Carimbo / Assinatura */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Carimbo / Assinatura Digital
              </h4>
              <div className="flex items-center gap-4">
                {formData.carimbo_url ? (
                  <img src={formData.carimbo_url} alt="Carimbo" className="h-16 border rounded-lg p-1 bg-background" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <Image className="h-5 w-5" />
                  </div>
                )}
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={uploadingCarimbo}
                    onClick={() => document.getElementById('carimbo-upload')?.click()}>
                    <Upload className="h-3 w-3" />{uploadingCarimbo ? 'Enviando...' : 'Upload Carimbo'}
                  </Button>
                  {formData.carimbo_url && (
                    <Button variant="ghost" size="sm" className="text-xs text-destructive block"
                      onClick={() => setFormData(p => ({ ...p, carimbo_url: '' }))}>Remover</Button>
                  )}
                  <p className="text-[10px] text-muted-foreground">Imagem do carimbo/assinatura para documentos impressos</p>
                </div>
                <input id="carimbo-upload" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'patient-photos', 'carimbo_url')} />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              {editingId ? 'Salvar' : 'Cadastrar'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este médico? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
