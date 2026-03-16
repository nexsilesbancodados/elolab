import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Stethoscope, Phone, Mail, BadgeCheck, Award,
  FileText, Clock, User, Upload, Image, Calendar, ClipboardList, Pill,
  ChevronRight, ExternalLink, X, Activity, Users, Eye,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useMedicos } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// ─── Doctor Profile Panel ───
function MedicoProfilePanel({ medico, onClose, onEdit }: { medico: any; onClose: () => void; onEdit: () => void }) {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['medico-agendamentos', medico.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, pacientes(nome, telefone)')
        .eq('medico_id', medico.id)
        .order('data', { ascending: false })
        .order('hora_inicio', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: prontuarios = [] } = useQuery({
    queryKey: ['medico-prontuarios', medico.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prontuarios')
        .select('id, data, queixa_principal, diagnostico_principal, pacientes(nome)')
        .eq('medico_id', medico.id)
        .order('data', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: prescricoes = [] } = useQuery({
    queryKey: ['medico-prescricoes', medico.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescricoes')
        .select('id, medicamento, dosagem, data_emissao, pacientes(nome)')
        .eq('medico_id', medico.id)
        .order('data_emissao', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: atestados = [] } = useQuery({
    queryKey: ['medico-atestados', medico.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atestados')
        .select('id, tipo, dias, data_emissao, motivo, pacientes(nome)')
        .eq('medico_id', medico.id)
        .order('data_emissao', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const agendamentosHoje = agendamentos.filter((a: any) => a.data === today);
  const agendamentosFuturos = agendamentos.filter((a: any) => a.data > today);
  const totalPacientes = new Set(agendamentos.map((a: any) => a.paciente_id)).size;

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      agendado: 'bg-blue-500/10 text-blue-600 border-blue-200',
      confirmado: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      finalizado: 'bg-muted text-muted-foreground',
      cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
      em_atendimento: 'bg-amber-500/10 text-amber-600 border-amber-200',
    };
    return map[s] || 'bg-muted text-muted-foreground';
  };

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <SheetHeader className="mb-4">
            <SheetTitle className="sr-only">Perfil do Médico</SheetTitle>
          </SheetHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
              {medico.foto_url && <AvatarImage src={medico.foto_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {(medico.nome || medico.crm).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">Dr(a). {medico.nome || medico.crm}</h2>
              <p className="text-sm text-muted-foreground">{medico.especialidade || 'Clínico Geral'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-[11px] gap-1">
                  <BadgeCheck className="h-3 w-3" /> CRM {medico.crm}/{medico.crm_uf}
                </Badge>
                {medico.rqe && (
                  <Badge variant="outline" className="text-[11px] gap-1">
                    <Award className="h-3 w-3" /> RQE {medico.rqe}
                  </Badge>
                )}
                <Badge className={medico.ativo ? 'bg-success/10 text-success border-success/20 text-[11px]' : 'bg-muted text-muted-foreground text-[11px]'}>
                  {medico.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {medico.telefone && (
              <a href={`tel:${medico.telefone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-3.5 w-3.5" /> {medico.telefone}
              </a>
            )}
            {medico.email && (
              <a href={`mailto:${medico.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" /> {medico.email}
              </a>
            )}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {medico.intervalo_consulta ?? 30}min/consulta
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('/agenda')}>
              <Calendar className="h-3 w-3" /> Agenda
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('/prontuarios')}>
              <ClipboardList className="h-3 w-3" /> Prontuários
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('/prescricoes')}>
              <Pill className="h-3 w-3" /> Prescrições
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b bg-muted/30">
          {[
            { label: 'Hoje', value: agendamentosHoje.length, icon: Activity, color: 'text-primary' },
            { label: 'Futuros', value: agendamentosFuturos.length, icon: Calendar, color: 'text-blue-500' },
            { label: 'Pacientes', value: totalPacientes, icon: Users, color: 'text-emerald-500' },
            { label: 'Prontuários', value: prontuarios.length, icon: ClipboardList, color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-0.5 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="agenda" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 grid grid-cols-4 h-9">
            <TabsTrigger value="agenda" className="text-[11px] gap-1"><Calendar className="h-3 w-3" /> Agenda</TabsTrigger>
            <TabsTrigger value="prontuarios" className="text-[11px] gap-1"><ClipboardList className="h-3 w-3" /> Prontuários</TabsTrigger>
            <TabsTrigger value="prescricoes" className="text-[11px] gap-1"><Pill className="h-3 w-3" /> Prescrições</TabsTrigger>
            <TabsTrigger value="atestados" className="text-[11px] gap-1"><FileText className="h-3 w-3" /> Atestados</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-4 pb-4">
            {/* Agenda Tab */}
            <TabsContent value="agenda" className="mt-3 space-y-2">
              {agendamentosHoje.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-primary mb-2">📅 Hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
                  {agendamentosHoje.map((ag: any) => (
                    <motion.div key={ag.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg border bg-card mb-1.5 hover:shadow-sm transition-shadow">
                      <div className="text-center min-w-[48px]">
                        <p className="text-sm font-bold text-foreground">{ag.hora_inicio?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{(ag as any).pacientes?.nome || 'Paciente'}</p>
                        <p className="text-[11px] text-muted-foreground">{ag.tipo || 'Consulta'}</p>
                      </div>
                      <Badge className={`text-[10px] ${statusColor(ag.status)}`}>{ag.status}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
              {agendamentosFuturos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Próximos agendamentos</p>
                  {agendamentosFuturos.slice(0, 15).map((ag: any) => (
                    <div key={ag.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card/50 mb-1.5">
                      <div className="text-center min-w-[60px]">
                        <p className="text-[11px] text-muted-foreground">
                          {format(parseISO(ag.data), "dd/MM", { locale: ptBR })}
                        </p>
                        <p className="text-xs font-semibold">{ag.hora_inicio?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{(ag as any).pacientes?.nome || 'Paciente'}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{ag.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {agendamentos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum agendamento encontrado</p>
                </div>
              )}
            </TabsContent>

            {/* Prontuários Tab */}
            <TabsContent value="prontuarios" className="mt-3 space-y-2">
              {prontuarios.map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{(p as any).pacientes?.nome || 'Paciente'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(parseISO(p.data), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {p.queixa_principal && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      <span className="font-medium">QP:</span> {p.queixa_principal}
                    </p>
                  )}
                  {p.diagnostico_principal && (
                    <Badge variant="secondary" className="text-[10px] mt-1.5">{p.diagnostico_principal}</Badge>
                  )}
                </div>
              ))}
              {prontuarios.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum prontuário registrado</p>
                </div>
              )}
            </TabsContent>

            {/* Prescrições Tab */}
            <TabsContent value="prescricoes" className="mt-3 space-y-2">
              {prescricoes.map((rx: any) => (
                <div key={rx.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{rx.medicamento}</p>
                      <p className="text-[11px] text-muted-foreground">{(rx as any).pacientes?.nome}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {rx.data_emissao ? format(parseISO(rx.data_emissao), 'dd/MM/yy') : '-'}
                    </p>
                  </div>
                  {rx.dosagem && <p className="text-xs text-muted-foreground mt-1">{rx.dosagem}</p>}
                </div>
              ))}
              {prescricoes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma prescrição emitida</p>
                </div>
              )}
            </TabsContent>

            {/* Atestados Tab */}
            <TabsContent value="atestados" className="mt-3 space-y-2">
              {atestados.map((at: any) => (
                <div key={at.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium capitalize">{at.tipo || 'Atestado'}</p>
                      <p className="text-[11px] text-muted-foreground">{(at as any).pacientes?.nome}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{at.dias || '-'} dia(s)</Badge>
                  </div>
                  {at.motivo && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{at.motivo}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {at.data_emissao ? format(parseISO(at.data_emissao), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
              ))}
              {atestados.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum atestado emitido</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ───
export default function Medicos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingMedico, setViewingMedico] = useState<any | null>(null);
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

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredMedicos.map((medico: any, i: number) => (
            <motion.div key={medico.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}>
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/60 hover:border-primary/30"
                onClick={() => setViewingMedico(medico)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                      {medico.foto_url && <AvatarImage src={medico.foto_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(medico.nome || medico.crm).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">Dr(a). {medico.nome || medico.crm}</h3>
                        <Badge className={`text-[10px] shrink-0 ${medico.ativo ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>
                          {medico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{medico.especialidade || 'Clínico Geral'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <BadgeCheck className="h-2.5 w-2.5" /> CRM {medico.crm}/{medico.crm_uf}
                        </Badge>
                        {medico.rqe && (
                          <Badge variant="outline" className="text-[10px]">RQE {medico.rqe}</Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="h-2.5 w-2.5" /> {medico.intervalo_consulta ?? 30}min
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      {medico.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{medico.telefone}</span>}
                      {medico.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{medico.email.split('@')[0]}@...</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); handleOpenDialog(medico); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(medico.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredMedicos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum médico encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1">Cadastre o primeiro médico clicando em "Novo Médico"</p>
          </CardContent>
        </Card>
      )}

      {/* Search bar */}
      {medicos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar médico..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72 shadow-lg border-border bg-background/95 backdrop-blur-sm" />
          </div>
        </div>
      )}

      {/* Profile Panel */}
      {viewingMedico && (
        <MedicoProfilePanel
          medico={viewingMedico}
          onClose={() => setViewingMedico(null)}
          onEdit={() => { handleOpenDialog(viewingMedico); setViewingMedico(null); }}
        />
      )}

      {/* ─── Form Dialog ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {editingId ? 'Editar Médico' : 'Novo Médico'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {/* Foto */}
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

            {/* Agenda */}
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

            {/* Carimbo */}
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
