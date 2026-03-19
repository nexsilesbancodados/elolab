import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, Eye, Tag, Link, Loader2, MapPin,
  Phone, Mail, Calendar, Filter, Users, UserCheck, Baby, Heart,
  FileText, ChevronDown, ChevronUp, User2, Building2, CreditCard,
  Droplets, Briefcase, X, Stethoscope, Save, Pill, ClipboardList,
  AlertTriangle, Activity, ChevronRight, History, PenLine, Lock,
  ShieldCheck, BookOpen, FileCheck, Brain, Bone, Eye as EyeIcon,
  Thermometer, Scale, Ruler, Paperclip, Shield, Clipboard,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { usePacientes } from '@/hooks/useSupabaseData';
import { useSupabaseQuery } from '@/hooks/useSupabaseData';
import { EtiquetaPaciente } from '@/components/EtiquetaPaciente';
import { PatientStats, PatientListTable } from '@/components/patients';
import { PatientPhoto, PatientTimeline, VitalSignsChart, AllergyAlert, Cid10Search, ClinicalProtocols, AnexosProntuario, DigitalSignature } from '@/components/clinical';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Paciente } from '@/types';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { gerarProntuarioPDF, downloadPDF, openPDF } from '@/lib/pdfGenerator';

interface PacienteFormData {
  nome: string;
  nome_social: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  sexo: string;
  estado_civil: string;
  profissao: string;
  tipo_sanguineo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  convenio_id: string;
  numero_carteira: string;
  validade_carteira: string;
  alergias: string[];
  observacoes: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  parentesco_responsavel: string;
  is_menor: boolean;
}

const initialFormData: PacienteFormData = {
  nome: '', nome_social: '', cpf: '', data_nascimento: '', telefone: '', email: '',
  sexo: '', estado_civil: '', profissao: '', tipo_sanguineo: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  convenio_id: '', numero_carteira: '', validade_carteira: '',
  alergias: [], observacoes: '',
  nome_responsavel: '', cpf_responsavel: '', parentesco_responsavel: '',
  is_menor: false,
};

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
];

const ESTADO_CIVIL_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

const TIPO_SANGUINEO_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const isMinor = (dataNascimento: string): boolean => {
  if (!dataNascimento) return false;
  const birth = new Date(dataNascimento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
};

const calcularIdade = (dataNascimento: string | null) => {
  if (!dataNascimento) return 0;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
};

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PacienteFormData>(initialFormData);
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [viewTab, setViewTab] = useState('dados');
  const [cepLoading, setCepLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSexo, setFilterSexo] = useState<string>('todos');
  const [filterConvenio, setFilterConvenio] = useState<string>('todos');
  const [filterIdade, setFilterIdade] = useState<string>('todos');
  const [formSection, setFormSection] = useState<string>('pessoal');
  // Prontuário inline state
  const [prontuarioList, setProntuarioList] = useState<any[]>([]);
  const [loadingProntuarios, setLoadingProntuarios] = useState(false);
  const [activeProntuario, setActiveProntuario] = useState<any>(null);
  const [isEditingProntuario, setIsEditingProntuario] = useState(false);
  const [prontuarioForm, setProntuarioForm] = useState<Record<string, any>>({});
  const [prontuarioSinais, setProntuarioSinais] = useState<Record<string, string>>({});
  const [prontuarioPrescricoes, setProntuarioPrescricoes] = useState<any[]>([]);
  const [prontuarioTab, setProntuarioTab] = useState('lista');
  const [savingProntuario, setSavingProntuario] = useState(false);

  const { toast } = useToast();
  const { profile: authProfile } = useSupabaseAuth();
  const { medicoId, isMedicoOnly } = useCurrentMedico();
  const { data: pacientes = [], isLoading, refetch } = usePacientes();
  const { data: convenios = [] } = useSupabaseQuery<any>('convenios', { orderBy: { column: 'nome', ascending: true } });
  const { data: medicos = [] } = useSupabaseQuery<any>('medicos', { orderBy: { column: 'nome', ascending: true } });

  // Load prontuários when patient changes
  const loadProntuarios = useCallback(async (pacienteId: string) => {
    setLoadingProntuarios(true);
    const { data } = await supabase
      .from('prontuarios')
      .select('id, data, queixa_principal, hipotese_diagnostica, diagnostico_principal, conduta, sinais_vitais, plano_terapeutico, historia_doenca_atual, historia_patologica_pregressa, historia_familiar, historia_social, revisao_sistemas, alergias_relatadas, medicamentos_em_uso, exames_fisicos, exame_cabeca_pescoco, exame_torax, exame_abdomen, exame_membros, exame_neurologico, exame_pele, orientacoes_paciente, observacoes_internas, diagnosticos_secundarios, medico_id, paciente_id, medicos(nome, crm, especialidade)')
      .eq('paciente_id', pacienteId)
      .order('data', { ascending: false })
      .limit(50);
    setProntuarioList(data || []);
    setLoadingProntuarios(false);
  }, []);

  // Reset prontuário state when view opens
  const handleViewWithProntuario = useCallback((paciente: any) => {
    setSelectedPacienteId(paciente.id);
    setViewTab('dados');
    setProntuarioTab('lista');
    setActiveProntuario(null);
    setIsEditingProntuario(false);
    setIsViewOpen(true);
    loadProntuarios(paciente.id);
  }, [loadProntuarios]);

  const handleNewProntuario = () => {
    const paciente = pacientes.find(p => p.id === selectedPacienteId);
    setProntuarioForm({
      paciente_id: selectedPacienteId,
      medico_id: medicoId || authProfile?.id || '',
      data: format(new Date(), 'yyyy-MM-dd'),
      queixa_principal: '',
      historia_doenca_atual: '',
      historia_patologica_pregressa: '',
      historia_familiar: '',
      historia_social: '',
      revisao_sistemas: '',
      alergias_relatadas: paciente?.alergias?.join(', ') || '',
      medicamentos_em_uso: '',
      exames_fisicos: '',
      exame_cabeca_pescoco: '', exame_torax: '', exame_abdomen: '',
      exame_membros: '', exame_neurologico: '', exame_pele: '',
      hipotese_diagnostica: '',
      diagnostico_principal: '',
      diagnosticos_secundarios: [],
      conduta: '',
      plano_terapeutico: '',
      orientacoes_paciente: '',
      observacoes_internas: '',
    });
    setProntuarioSinais({});
    setProntuarioPrescricoes([]);
    setActiveProntuario(null);
    setIsEditingProntuario(true);
    setProntuarioTab('editor');
  };

  const handleOpenProntuario = async (pront: any) => {
    setProntuarioForm(pront);
    setProntuarioSinais(pront.sinais_vitais || {});
    const { data: prescs } = await supabase.from('prescricoes').select('*').eq('prontuario_id', pront.id);
    setProntuarioPrescricoes((prescs || []).map((p: any) => ({
      medicamento: p.medicamento, dosagem: p.dosagem || '', posologia: p.posologia || '',
      duracao: p.duracao || '', quantidade: p.quantidade || '', observacoes: p.observacoes || '',
    })));
    setActiveProntuario(pront);
    setIsEditingProntuario(false);
    setProntuarioTab('editor');
  };

  const handleSaveProntuario = async () => {
    if (!prontuarioForm.queixa_principal) {
      toast({ title: 'Erro', description: 'Preencha a queixa principal.', variant: 'destructive' });
      return;
    }
    setSavingProntuario(true);
    try {
      const payload = {
        queixa_principal: prontuarioForm.queixa_principal,
        historia_doenca_atual: prontuarioForm.historia_doenca_atual,
        historia_patologica_pregressa: prontuarioForm.historia_patologica_pregressa,
        historia_familiar: prontuarioForm.historia_familiar,
        historia_social: prontuarioForm.historia_social,
        revisao_sistemas: prontuarioForm.revisao_sistemas,
        alergias_relatadas: prontuarioForm.alergias_relatadas,
        medicamentos_em_uso: prontuarioForm.medicamentos_em_uso,
        sinais_vitais: JSON.parse(JSON.stringify(prontuarioSinais)),
        exames_fisicos: prontuarioForm.exames_fisicos,
        exame_cabeca_pescoco: prontuarioForm.exame_cabeca_pescoco,
        exame_torax: prontuarioForm.exame_torax,
        exame_abdomen: prontuarioForm.exame_abdomen,
        exame_membros: prontuarioForm.exame_membros,
        exame_neurologico: prontuarioForm.exame_neurologico,
        exame_pele: prontuarioForm.exame_pele,
        hipotese_diagnostica: prontuarioForm.hipotese_diagnostica,
        diagnostico_principal: prontuarioForm.diagnostico_principal,
        diagnosticos_secundarios: prontuarioForm.diagnosticos_secundarios || [],
        conduta: prontuarioForm.conduta,
        plano_terapeutico: prontuarioForm.plano_terapeutico,
        orientacoes_paciente: prontuarioForm.orientacoes_paciente,
        observacoes_internas: prontuarioForm.observacoes_internas,
      };

      let prontuarioId = activeProntuario?.id;
      if (activeProntuario?.id) {
        const { error } = await supabase.from('prontuarios').update(payload).eq('id', activeProntuario.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('prontuarios').insert({
          ...payload,
          paciente_id: prontuarioForm.paciente_id,
          medico_id: prontuarioForm.medico_id,
          data: prontuarioForm.data,
        }).select().single();
        if (error) throw error;
        prontuarioId = data.id;
      }

      if (!activeProntuario?.id) {
        for (const presc of prontuarioPrescricoes) {
          if (presc.medicamento) {
            await supabase.from('prescricoes').insert({
              paciente_id: prontuarioForm.paciente_id,
              medico_id: prontuarioForm.medico_id,
              prontuario_id: prontuarioId,
              medicamento: presc.medicamento,
              dosagem: presc.dosagem || null,
              posologia: presc.posologia || null,
              duracao: presc.duracao || null,
              quantidade: presc.quantidade || null,
              observacoes: presc.observacoes || null,
              data_emissao: format(new Date(), 'yyyy-MM-dd'),
              tipo: 'simples',
            });
          }
        }
      }

      try {
        await supabase.from('audit_log').insert({
          action: activeProntuario?.id ? 'update' : 'create',
          collection: 'prontuarios',
          record_id: prontuarioId,
          record_name: pacientes.find(p => p.id === selectedPacienteId)?.nome || '',
          user_id: authProfile?.id || null,
          user_name: authProfile?.nome || null,
        });
      } catch { /* silent */ }

      toast({ title: 'Prontuário salvo com sucesso!' });
      if (selectedPacienteId) loadProntuarios(selectedPacienteId);
      setProntuarioTab('lista');
      setIsEditingProntuario(false);
      setActiveProntuario(null);
    } catch (error) {
      console.error('Error saving prontuario:', error);
      toast({ title: 'Erro ao salvar prontuário', variant: 'destructive' });
    } finally {
      setSavingProntuario(false);
    }
  };

  const updateProntuarioField = (field: string, value: any) => setProntuarioForm(prev => ({ ...prev, [field]: value }));
  const updateSinal = (field: string, value: string) => {
    const next = { ...prontuarioSinais, [field]: value };
    if (field === 'peso' || field === 'altura') {
      const p = parseFloat(field === 'peso' ? value : next.peso || '0');
      const a = parseFloat(field === 'altura' ? value : next.altura || '0');
      if (p && a) { const altM = a > 3 ? a / 100 : a; next.imc = (p / (altM * altM)).toFixed(1); }
    }
    setProntuarioSinais(next);
  };

  const buscarCep = useCallback(async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch { /* silently fail */ } finally {
      setCepLoading(false);
    }
  }, []);

  const selectedPaciente = useMemo(
    () => pacientes.find((p) => p.id === selectedPacienteId),
    [pacientes, selectedPacienteId]
  );

  const filteredPacientes = useMemo(() => {
    let result = pacientes;

    // Text search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        (p.cpf && p.cpf.includes(searchTerm)) ||
        (p.telefone && p.telefone.includes(searchTerm)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }

    // Sexo filter
    if (filterSexo !== 'todos') {
      result = result.filter(p => p.sexo === filterSexo);
    }

    // Convenio filter
    if (filterConvenio === 'particular') {
      result = result.filter(p => !p.convenio_id);
    } else if (filterConvenio !== 'todos') {
      result = result.filter(p => p.convenio_id === filterConvenio);
    }

    // Age filter
    if (filterIdade === 'crianca') {
      result = result.filter(p => calcularIdade(p.data_nascimento) < 12);
    } else if (filterIdade === 'adolescente') {
      result = result.filter(p => { const a = calcularIdade(p.data_nascimento); return a >= 12 && a < 18; });
    } else if (filterIdade === 'adulto') {
      result = result.filter(p => { const a = calcularIdade(p.data_nascimento); return a >= 18 && a < 60; });
    } else if (filterIdade === 'idoso') {
      result = result.filter(p => calcularIdade(p.data_nascimento) >= 60);
    }

    return result;
  }, [pacientes, searchTerm, filterSexo, filterConvenio, filterIdade]);

  // Stats
  const stats = useMemo(() => {
    const total = pacientes.length;
    const comConvenio = pacientes.filter(p => p.convenio_id).length;
    const menores = pacientes.filter(p => calcularIdade(p.data_nascimento) < 18).length;
    const comAlergias = pacientes.filter(p => p.alergias && p.alergias.length > 0).length;
    return { total, comConvenio, menores, comAlergias };
  }, [pacientes]);

  const activeFilters = [filterSexo !== 'todos', filterConvenio !== 'todos', filterIdade !== 'todos'].filter(Boolean).length;

  const handleNew = () => {
    setSelectedPacienteId(null);
    setFormData(initialFormData);
    setFormSection('pessoal');
    setIsFormOpen(true);
  };

  const handleEdit = (paciente: any) => {
    setSelectedPacienteId(paciente.id);
    setFormData({
      nome: paciente.nome,
      nome_social: paciente.nome_social || '',
      cpf: paciente.cpf || '',
      data_nascimento: paciente.data_nascimento || '',
      telefone: paciente.telefone || '',
      email: paciente.email || '',
      sexo: paciente.sexo || '',
      estado_civil: '',
      profissao: '',
      tipo_sanguineo: '',
      cep: paciente.cep || '',
      logradouro: paciente.logradouro || '',
      numero: paciente.numero || '',
      complemento: paciente.complemento || '',
      bairro: paciente.bairro || '',
      cidade: paciente.cidade || '',
      estado: paciente.estado || '',
      convenio_id: paciente.convenio_id || '',
      numero_carteira: paciente.numero_carteira || '',
      validade_carteira: paciente.validade_carteira || '',
      alergias: paciente.alergias || [],
      observacoes: paciente.observacoes || '',
      nome_responsavel: paciente.nome_responsavel || '',
      cpf_responsavel: paciente.cpf_responsavel || '',
      parentesco_responsavel: paciente.parentesco_responsavel || '',
      is_menor: !!paciente.nome_responsavel || isMinor(paciente.data_nascimento || ''),
    });
    setFormSection('pessoal');
    setIsFormOpen(true);
  };

  const handleView = handleViewWithProntuario;

  const handleDeleteClick = (paciente: any) => {
    setSelectedPacienteId(paciente.id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPacienteId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', selectedPacienteId);
      if (error) throw error;
      toast({ title: 'Paciente excluído com sucesso' });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ title: 'Erro ao excluir paciente', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cpf || !formData.telefone || !formData.data_nascimento) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios (Nome, CPF, Nascimento, Telefone).', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave: any = {
        nome: formData.nome,
        nome_social: formData.nome_social || null,
        cpf: formData.cpf,
        data_nascimento: formData.data_nascimento,
        telefone: formData.telefone,
        email: formData.email || null,
        sexo: formData.sexo || null,
        cep: formData.cep || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        convenio_id: formData.convenio_id || null,
        numero_carteira: formData.numero_carteira || null,
        validade_carteira: formData.validade_carteira || null,
        alergias: formData.alergias,
        observacoes: formData.observacoes || null,
        nome_responsavel: formData.nome_responsavel || null,
        cpf_responsavel: formData.cpf_responsavel || null,
        parentesco_responsavel: formData.parentesco_responsavel || null,
      };

      if (selectedPacienteId) {
        const { error } = await supabase.from('pacientes').update(dataToSave).eq('id', selectedPacienteId);
        if (error) throw error;
        toast({ title: 'Paciente atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('pacientes').insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Paciente cadastrado com sucesso' });
      }
      refetch();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar paciente', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePortalLink = async (pacienteId: string, pacienteNome: string) => {
    try {
      const { data, error } = await supabase
        .from('paciente_portal_tokens')
        .insert({ paciente_id: pacienteId })
        .select('token')
        .single();
      if (error) throw error;
      const portalUrl = `${window.location.origin}/portal-paciente?token=${data.token}`;
      await navigator.clipboard.writeText(portalUrl);
      toast({ title: 'Link copiado!', description: `Link do portal de ${pacienteNome} copiado.` });
    } catch {
      toast({ title: 'Erro ao gerar link do portal', variant: 'destructive' });
    }
  };

  const getConvenioNome = (convenioId: string | null) => {
    if (!convenioId) return 'Particular';
    const c = convenios.find((cv: any) => cv.id === convenioId);
    return c?.nome || 'Particular';
  };

  const pacientesForEtiqueta: Paciente[] = filteredPacientes.map((p) => ({
    id: p.id, nome: p.nome, cpf: p.cpf || '', dataNascimento: p.data_nascimento || '',
    telefone: p.telefone || '', email: p.email || '', convenio: null,
    endereco: { cep: p.cep || '', logradouro: p.logradouro || '', numero: p.numero || '', bairro: p.bairro || '', cidade: p.cidade || '', estado: p.estado || '' },
    alergias: p.alergias || [], observacoes: p.observacoes || '', criadoEm: p.created_at,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gestão completa do cadastro de pacientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsEtiquetaOpen(true)} className="gap-2">
            <Tag className="h-4 w-4" />
            Etiquetas
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <PatientStats total={stats.total} comConvenio={stats.comConvenio} menores={stats.menores} comAlergias={stats.comAlergias} />

      {/* Search & Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              Lista de Pacientes
              <Badge variant="secondary" className="text-xs">{filteredPacientes.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nome, CPF, telefone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="h-4 w-4" />
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t mt-3">
              <div className="space-y-1">
                <Label className="text-xs">Sexo</Label>
                <Select value={filterSexo} onValueChange={setFilterSexo}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {SEXO_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Convênio</Label>
                <Select value={filterConvenio} onValueChange={setFilterConvenio}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                    {convenios.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Faixa Etária</Label>
                <Select value={filterIdade} onValueChange={setFilterIdade}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="crianca">Criança (0-11)</SelectItem>
                    <SelectItem value="adolescente">Adolescente (12-17)</SelectItem>
                    <SelectItem value="adulto">Adulto (18-59)</SelectItem>
                    <SelectItem value="idoso">Idoso (60+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilters > 0 && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" className="text-xs h-8 gap-1" onClick={() => { setFilterSexo('todos'); setFilterConvenio('todos'); setFilterIdade('todos'); }}>
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden sm:table-cell">Contato</TableHead>
                  <TableHead className="hidden lg:table-cell">Convênio</TableHead>
                  <TableHead className="hidden lg:table-cell">Idade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map((paciente) => {
                    const idade = calcularIdade(paciente.data_nascimento);
                    return (
                      <TableRow key={paciente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(paciente)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <PatientPhoto
                              pacienteId={paciente.id}
                              pacienteNome={paciente.nome}
                              currentPhotoUrl={paciente.foto_url}
                              size="sm"
                              editable={false}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{paciente.nome}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {paciente.sexo && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {paciente.sexo === 'masculino' ? 'M' : paciente.sexo === 'feminino' ? 'F' : 'O'}
                                  </Badge>
                                )}
                                {idade < 18 && <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0">Menor</Badge>}
                              </div>
                              {paciente.alergias && paciente.alergias.length > 0 && (
                                <AllergyAlert alergias={paciente.alergias} compact className="mt-1" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{paciente.cpf || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-0.5 text-sm">
                            {paciente.telefone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3" />{paciente.telefone}
                              </div>
                            )}
                            {paciente.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[180px]">
                                <Mail className="h-3 w-3" />{paciente.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {getConvenioNome(paciente.convenio_id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm tabular-nums">{idade} anos</span>
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(paciente)} title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleGeneratePortalLink(paciente.id, paciente.nome)} title="Link do portal">
                              <Link className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(paciente)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(paciente)} title="Excluir">
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
        </CardContent>
      </Card>

      {/* ─── Form Dialog ─── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPacienteId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>

          {/* Section nav */}
          <div className="flex gap-1 flex-wrap border-b pb-2">
            {[
              { key: 'pessoal', label: 'Dados Pessoais', icon: User2 },
              { key: 'endereco', label: 'Endereço', icon: MapPin },
              { key: 'convenio', label: 'Convênio', icon: Building2 },
              { key: 'clinico', label: 'Dados Clínicos', icon: Heart },
            ].map(s => (
              <Button
                key={s.key}
                variant={formSection === s.key ? 'default' : 'ghost'}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setFormSection(s.key)}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </Button>
            ))}
          </div>

          <div className="py-2 space-y-4">
            {/* Dados Pessoais */}
            {formSection === 'pessoal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      Nome Social
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">Opcional</Badge>
                    </Label>
                    <Input value={formData.nome_social} onChange={e => setFormData({ ...formData, nome_social: e.target.value })} placeholder="Nome pelo qual prefere ser chamado(a)" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento *</Label>
                    <Input type="date" value={formData.data_nascimento} onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={formData.sexo} onValueChange={v => setFormData({ ...formData, sexo: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {SEXO_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado Civil</Label>
                    <Select value={formData.estado_civil} onValueChange={v => setFormData({ ...formData, estado_civil: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {ESTADO_CIVIL_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Profissão</Label>
                    <Input value={formData.profissao} onChange={e => setFormData({ ...formData, profissao: e.target.value })} placeholder="Profissão do paciente" />
                  </div>
                </div>

                {/* Toggle menor de idade */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Baby className="h-4 w-4 text-amber-500" />
                      Paciente menor de idade ou dependente?
                    </h4>
                    <Button
                      type="button"
                      variant={formData.is_menor ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, is_menor: !formData.is_menor })}
                    >
                      {formData.is_menor ? 'Sim' : 'Não'}
                    </Button>
                  </div>
                  {isMinor(formData.data_nascimento) && !formData.is_menor && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ A data de nascimento indica menor de idade. Considere ativar esta opção.
                    </p>
                  )}
                </div>

                {formData.is_menor && (
                  <div className="border rounded-lg p-4 bg-amber-500/5 border-amber-500/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Baby className="h-4 w-4" />
                      Dados do Responsável Legal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Responsável *</Label>
                        <Input value={formData.nome_responsavel} onChange={e => setFormData({ ...formData, nome_responsavel: e.target.value })} placeholder="Nome completo" />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF do Responsável</Label>
                        <Input value={formData.cpf_responsavel} onChange={e => setFormData({ ...formData, cpf_responsavel: e.target.value })} placeholder="000.000.000-00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Parentesco</Label>
                        <Select value={formData.parentesco_responsavel} onValueChange={v => setFormData({ ...formData, parentesco_responsavel: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mae">Mãe</SelectItem>
                            <SelectItem value="pai">Pai</SelectItem>
                            <SelectItem value="avo">Avó/Avô</SelectItem>
                            <SelectItem value="tio">Tio(a)</SelectItem>
                            <SelectItem value="tutor">Tutor Legal</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Endereço */}
            {formSection === 'endereco' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={e => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={e => buscarCep(e.target.value)}
                      placeholder="00000-000"
                      className="pr-8"
                    />
                    {cepLoading ? (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Sai do campo para preencher automaticamente</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={formData.complemento} onChange={e => setFormData({ ...formData, complemento: e.target.value })} placeholder="Apto, Bloco, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.estado} onValueChange={v => setFormData({ ...formData, estado: v })}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Convênio */}
            {formSection === 'convenio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Convênio</Label>
                   <Select value={formData.convenio_id || '__particular__'} onValueChange={v => setFormData({ ...formData, convenio_id: v === '__particular__' ? '' : v })}>
                     <SelectTrigger><SelectValue placeholder="Particular (sem convênio)" /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="__particular__">Particular</SelectItem>
                       {convenios.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                     </SelectContent>
                   </Select>
                </div>
                {formData.convenio_id && (
                  <>
                    <div className="space-y-2">
                      <Label>Número da Carteira</Label>
                      <Input value={formData.numero_carteira} onChange={e => setFormData({ ...formData, numero_carteira: e.target.value })} placeholder="Número da carteirinha" />
                    </div>
                    <div className="space-y-2">
                      <Label>Validade da Carteira</Label>
                      <Input type="date" value={formData.validade_carteira} onChange={e => setFormData({ ...formData, validade_carteira: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Dados Clínicos */}
            {formSection === 'clinico' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Sanguíneo</Label>
                    <Select value={formData.tipo_sanguineo} onValueChange={v => setFormData({ ...formData, tipo_sanguineo: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {TIPO_SANGUINEO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alergias (separadas por vírgula)</Label>
                  <Input
                    value={formData.alergias.join(', ')}
                    onChange={e => setFormData({ ...formData, alergias: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                    placeholder="Penicilina, Dipirona, Ibuprofeno, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações Gerais</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais relevantes sobre o paciente..."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">Salvar</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Dialog (with Prontuário) ─── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              Ficha do Paciente
            </DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Patient header summary */}
              <div className="flex items-center gap-3 px-1 py-2 flex-shrink-0">
                <PatientPhoto
                  pacienteId={selectedPaciente.id}
                  pacienteNome={selectedPaciente.nome}
                  currentPhotoUrl={selectedPaciente.foto_url}
                  size="md"
                  editable={false}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold truncate">{(selectedPaciente as any).nome_social || selectedPaciente.nome}</h3>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span>{calcularIdade(selectedPaciente.data_nascimento)}a</span>
                    {selectedPaciente.sexo && <span>• {selectedPaciente.sexo === 'masculino' ? '♂' : '♀'}</span>}
                    {selectedPaciente.cpf && <span>• {selectedPaciente.cpf}</span>}
                    <span>• {getConvenioNome(selectedPaciente.convenio_id)}</span>
                  </div>
                </div>
                {selectedPaciente.alergias && selectedPaciente.alergias.length > 0 && (
                  <AllergyAlert alergias={selectedPaciente.alergias} compact />
                )}
              </div>

              <Tabs value={viewTab} onValueChange={setViewTab} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="flex-shrink-0 grid w-full grid-cols-5 h-auto p-0.5 bg-muted/40 rounded-xl">
                  <TabsTrigger value="dados" className="text-[11px] gap-1 py-1.5 rounded-lg"><User2 className="h-3 w-3" />Dados</TabsTrigger>
                  <TabsTrigger value="prontuario" className="text-[11px] gap-1 py-1.5 rounded-lg"><Stethoscope className="h-3 w-3" />Prontuário</TabsTrigger>
                  <TabsTrigger value="endereco" className="text-[11px] gap-1 py-1.5 rounded-lg"><MapPin className="h-3 w-3" />Endereço</TabsTrigger>
                  <TabsTrigger value="historico" className="text-[11px] gap-1 py-1.5 rounded-lg"><History className="h-3 w-3" />Timeline</TabsTrigger>
                  <TabsTrigger value="sinais" className="text-[11px] gap-1 py-1.5 rounded-lg"><Activity className="h-3 w-3" />Sinais</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 mt-3">
                  {/* Tab: Dados */}
                  <TabsContent value="dados" className="space-y-5 pt-1 mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <InfoField icon={FileText} label="CPF" value={selectedPaciente.cpf} />
                      <InfoField icon={Calendar} label="Nascimento" value={selectedPaciente.data_nascimento ? new Date(selectedPaciente.data_nascimento + 'T12:00').toLocaleDateString('pt-BR') : null} />
                      <InfoField icon={Phone} label="Telefone" value={selectedPaciente.telefone} />
                      <InfoField icon={Mail} label="Email" value={selectedPaciente.email} />
                      <InfoField icon={Building2} label="Convênio" value={getConvenioNome(selectedPaciente.convenio_id)} />
                      <InfoField icon={CreditCard} label="Carteira" value={selectedPaciente.numero_carteira} />
                    </div>
                    {selectedPaciente.nome_responsavel && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Baby className="h-4 w-4 text-amber-500" /> Responsável Legal</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <InfoField icon={User2} label="Nome" value={selectedPaciente.nome_responsavel} />
                            <InfoField icon={FileText} label="CPF" value={selectedPaciente.cpf_responsavel} />
                            <InfoField icon={Users} label="Parentesco" value={selectedPaciente.parentesco_responsavel} />
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPaciente.observacoes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-sm mb-1">Observações</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPaciente.observacoes}</p>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Tab: Prontuário */}
                  <TabsContent value="prontuario" className="mt-0 space-y-3">
                    {prontuarioTab === 'lista' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <ClipboardList className="h-3.5 w-3.5" />
                            Evoluções ({prontuarioList.length})
                          </span>
                          <Button size="sm" onClick={handleNewProntuario} className="gap-1.5 rounded-xl text-xs">
                            <Plus className="h-3.5 w-3.5" />Novo Atendimento
                          </Button>
                        </div>

                        {loadingProntuarios ? (
                          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
                        ) : prontuarioList.length === 0 ? (
                          <div className="flex flex-col items-center py-14 text-muted-foreground">
                            <FileText className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-xs">Nenhuma evolução registrada</p>
                            <Button variant="link" size="sm" onClick={handleNewProntuario} className="text-xs mt-1">Iniciar primeiro atendimento</Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prontuarioList.map((p, idx) => (
                              <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="group border border-border/40 rounded-xl p-3.5 hover:border-primary/30 cursor-pointer transition-all hover:bg-primary/[0.02]"
                                onClick={() => handleOpenProntuario(p)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-1.5 py-0">
                                        {format(new Date(p.data), 'dd/MM/yyyy')}
                                      </Badge>
                                      {p.diagnostico_principal && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.diagnostico_principal}</Badge>
                                      )}
                                      {p.medicos && (
                                        <span className="text-[10px] text-muted-foreground">Dr(a). {p.medicos.nome || p.medicos.crm}</span>
                                      )}
                                    </div>
                                    <p className="text-xs font-semibold text-foreground truncate">{p.queixa_principal}</p>
                                    {p.conduta && <p className="text-[11px] text-muted-foreground line-clamp-1">Conduta: {p.conduta}</p>}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {prontuarioTab === 'editor' && (
                      <div className="space-y-4">
                        {/* Editor header */}
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm" onClick={() => { setProntuarioTab('lista'); setIsEditingProntuario(false); }} className="gap-1 text-xs">
                            ← Voltar
                          </Button>
                          <div className="flex items-center gap-2">
                            {activeProntuario && !isEditingProntuario && (
                              <Button variant="outline" size="sm" onClick={() => setIsEditingProntuario(true)} className="gap-1 text-xs h-7">
                                <PenLine className="h-3 w-3" />Editar
                              </Button>
                            )}
                            {isEditingProntuario && (
                              <LoadingButton
                                onClick={handleSaveProntuario}
                                isLoading={savingProntuario}
                                loadingText="Salvando..."
                                size="sm"
                                className="gap-1 text-xs h-7 rounded-xl"
                              >
                                <Save className="h-3 w-3" />Salvar
                              </LoadingButton>
                            )}
                          </div>
                        </div>

                        {/* Read-only banner */}
                        {activeProntuario && !isEditingProntuario && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border/40 rounded-xl text-xs text-muted-foreground">
                            <Lock className="h-3 w-3 flex-shrink-0" />
                            Somente leitura — CFM nº 1.821/07
                          </div>
                        )}

                        <fieldset disabled={activeProntuario ? !isEditingProntuario : false} className="space-y-4">
                          {/* Queixa Principal */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-destructive" />Queixa Principal *</Label>
                            <Textarea placeholder="Queixa principal..." value={prontuarioForm.queixa_principal || ''} onChange={e => updateProntuarioField('queixa_principal', e.target.value)} rows={2} />
                          </div>

                          {/* HDA */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><FileText className="h-3 w-3" />História da Doença Atual</Label>
                            <Textarea placeholder="Evolução cronológica..." value={prontuarioForm.historia_doenca_atual || ''} onChange={e => updateProntuarioField('historia_doenca_atual', e.target.value)} rows={3} />
                          </div>

                          {/* Sinais Vitais */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><Activity className="h-3 w-3 text-primary" />Sinais Vitais</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                              {[
                                { label: 'PA Sist.', field: 'pressao_sistolica', placeholder: '120', icon: Heart, accent: 'text-red-500' },
                                { label: 'PA Diast.', field: 'pressao_diastolica', placeholder: '80', icon: Heart, accent: 'text-red-500' },
                                { label: 'FC (bpm)', field: 'frequencia_cardiaca', placeholder: '72', icon: Heart, accent: 'text-rose-500' },
                                { label: 'FR (irpm)', field: 'frequencia_respiratoria', placeholder: '16', icon: Activity, accent: 'text-blue-500' },
                                { label: 'Temp (°C)', field: 'temperatura', placeholder: '36.5', icon: Thermometer, accent: 'text-orange-500' },
                                { label: 'SpO₂ (%)', field: 'saturacao', placeholder: '98', icon: Droplets, accent: 'text-cyan-500' },
                                { label: 'Peso (kg)', field: 'peso', placeholder: '70', icon: Scale, accent: 'text-emerald-500' },
                                { label: 'Alt (cm)', field: 'altura', placeholder: '170', icon: Ruler, accent: 'text-violet-500' },
                                { label: 'Glasgow', field: 'glasgow', placeholder: '15', icon: Brain, accent: 'text-purple-500' },
                                { label: 'Dor (0-10)', field: 'dor', placeholder: '0', icon: AlertTriangle, accent: 'text-yellow-500' },
                              ].map(f => {
                                const Icon = f.icon;
                                return (
                                  <div key={f.field} className="rounded-xl border border-border/60 bg-card p-2 space-y-0.5">
                                    <Label className={`text-[9px] font-semibold flex items-center gap-0.5 ${f.accent}`}>
                                      <Icon className="h-2.5 w-2.5" />{f.label}
                                    </Label>
                                    <Input
                                      placeholder={f.placeholder}
                                      value={prontuarioSinais[f.field] || ''}
                                      onChange={e => updateSinal(f.field, e.target.value)}
                                      className="h-7 text-xs px-2"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Exame Físico */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><Stethoscope className="h-3 w-3" />Exame Físico</Label>
                            <Textarea placeholder="Estado geral, ausculta..." value={prontuarioForm.exames_fisicos || ''} onChange={e => updateProntuarioField('exames_fisicos', e.target.value)} rows={3} />
                          </div>

                          {/* Alergias + Medicamentos */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-destructive" />Alergias Relatadas</Label>
                              <Textarea placeholder="Alergias..." value={prontuarioForm.alergias_relatadas || ''} onChange={e => updateProntuarioField('alergias_relatadas', e.target.value)} rows={2} className="border-destructive/30" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><Pill className="h-3 w-3" />Medicamentos em Uso</Label>
                              <Textarea placeholder="Medicamentos..." value={prontuarioForm.medicamentos_em_uso || ''} onChange={e => updateProntuarioField('medicamentos_em_uso', e.target.value)} rows={2} />
                            </div>
                          </div>

                          {/* Hipótese + Diagnóstico */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><BookOpen className="h-3 w-3" />Hipótese Diagnóstica</Label>
                              <Input placeholder="CID-10 / Hipótese" value={prontuarioForm.hipotese_diagnostica || ''} onChange={e => updateProntuarioField('hipotese_diagnostica', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><FileCheck className="h-3 w-3" />Diagnóstico Principal</Label>
                              <Input placeholder="Diagnóstico" value={prontuarioForm.diagnostico_principal || ''} onChange={e => updateProntuarioField('diagnostico_principal', e.target.value)} />
                            </div>
                          </div>

                          {/* Conduta */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><FileCheck className="h-3 w-3" />Conduta</Label>
                            <Textarea placeholder="Conduta terapêutica, exames, encaminhamentos..." value={prontuarioForm.conduta || ''} onChange={e => updateProntuarioField('conduta', e.target.value)} rows={3} />
                          </div>

                          {/* Plano + Orientações */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><ClipboardList className="h-3 w-3" />Plano Terapêutico</Label>
                              <Textarea placeholder="Plano detalhado..." value={prontuarioForm.plano_terapeutico || ''} onChange={e => updateProntuarioField('plano_terapeutico', e.target.value)} rows={2} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><User2 className="h-3 w-3" />Orientações ao Paciente</Label>
                              <Textarea placeholder="Cuidados, retorno, sinais de alarme..." value={prontuarioForm.orientacoes_paciente || ''} onChange={e => updateProntuarioField('orientacoes_paciente', e.target.value)} rows={2} />
                            </div>
                          </div>

                          {/* Prescrições */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-bold flex items-center gap-1.5"><Pill className="h-3 w-3" />Prescrições ({prontuarioPrescricoes.length})</Label>
                              {isEditingProntuario && (
                                <Button variant="outline" size="sm" onClick={() => setProntuarioPrescricoes([...prontuarioPrescricoes, { medicamento: '', dosagem: '', posologia: '', duracao: '', quantidade: '', observacoes: '' }])} className="text-[10px] h-6 gap-1">
                                  <Plus className="h-3 w-3" />Adicionar
                                </Button>
                              )}
                            </div>
                            {prontuarioPrescricoes.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-3 text-center">Nenhuma prescrição</p>
                            ) : (
                              <div className="space-y-2">
                                {prontuarioPrescricoes.map((presc, i) => (
                                  <div key={i} className="border rounded-lg p-2.5 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-semibold">#{i + 1}</span>
                                      {isEditingProntuario && (
                                        <Button variant="ghost" size="sm" onClick={() => setProntuarioPrescricoes(prontuarioPrescricoes.filter((_, idx) => idx !== i))} className="text-destructive h-5 w-5 p-0">
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                                      <div className="col-span-2 md:col-span-3">
                                        <Input placeholder="Medicamento *" value={presc.medicamento} onChange={e => { const u = [...prontuarioPrescricoes]; u[i] = { ...u[i], medicamento: e.target.value }; setProntuarioPrescricoes(u); }} className="text-xs h-7" />
                                      </div>
                                      <Input placeholder="Dosagem" value={presc.dosagem} onChange={e => { const u = [...prontuarioPrescricoes]; u[i] = { ...u[i], dosagem: e.target.value }; setProntuarioPrescricoes(u); }} className="text-xs h-7" />
                                      <Input placeholder="Posologia" value={presc.posologia} onChange={e => { const u = [...prontuarioPrescricoes]; u[i] = { ...u[i], posologia: e.target.value }; setProntuarioPrescricoes(u); }} className="text-xs h-7" />
                                      <Input placeholder="Duração" value={presc.duracao} onChange={e => { const u = [...prontuarioPrescricoes]; u[i] = { ...u[i], duracao: e.target.value }; setProntuarioPrescricoes(u); }} className="text-xs h-7" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Observações internas */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold flex items-center gap-1.5"><Shield className="h-3 w-3" />Observações Internas</Label>
                            <Textarea placeholder="Anotações internas (não imprime)..." value={prontuarioForm.observacoes_internas || ''} onChange={e => updateProntuarioField('observacoes_internas', e.target.value)} rows={2} className="border-dashed" />
                          </div>
                        </fieldset>

                        {/* LGPD badge */}
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 rounded-lg p-2">
                          <ShieldCheck className="h-3 w-3" />
                          <span>LGPD • CFM nº 1.821/07 • Todos os acessos registrados</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Endereço */}
                  <TabsContent value="endereco" className="pt-1 mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <InfoField icon={MapPin} label="CEP" value={selectedPaciente.cep} />
                      <InfoField icon={MapPin} label="Logradouro" value={selectedPaciente.logradouro} />
                      <InfoField icon={MapPin} label="Número" value={selectedPaciente.numero} />
                      <InfoField icon={MapPin} label="Complemento" value={(selectedPaciente as any).complemento} />
                      <InfoField icon={MapPin} label="Bairro" value={selectedPaciente.bairro} />
                      <InfoField icon={MapPin} label="Cidade" value={selectedPaciente.cidade} />
                      <InfoField icon={MapPin} label="Estado" value={selectedPaciente.estado} />
                    </div>
                  </TabsContent>

                  <TabsContent value="historico" className="pt-1 mt-0">
                    <PatientTimeline pacienteId={selectedPaciente.id} />
                  </TabsContent>
                  <TabsContent value="sinais" className="pt-1 mt-0">
                    <VitalSignsChart pacienteId={selectedPaciente.id} />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente "{selectedPaciente?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <LoadingButton onClick={handleDelete} isLoading={isDeleting} loadingText="Excluindo..." variant="destructive">
              Excluir
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Etiquetas */}
      <EtiquetaPaciente pacientes={pacientesForEtiqueta} open={isEtiquetaOpen} onOpenChange={setIsEtiquetaOpen} />
    </div>
  );
}

// Helper component for info display
function InfoField({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
