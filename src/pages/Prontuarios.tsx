import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, Plus, Save, CalendarCheck, FileDown, History,
  Heart, Thermometer, Activity, Scale, Ruler, Droplets,
  Stethoscope, Brain, Bone, Eye as EyeIcon, Pill, Paperclip,
  ClipboardList, AlertTriangle, User, Clock, ChevronDown, ChevronRight,
  Printer, BookOpen, ShieldCheck, FileCheck, X, Clipboard
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gerarProntuarioPDF, downloadPDF } from '@/lib/pdfGenerator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  AllergyAlert, Cid10Search, ClinicalProtocols,
  ReturnScheduler, DischargeReport, AnexosProntuario,
  VitalSignsChart, PatientTimeline, PatientPhoto,
} from '@/components/clinical';
import { usePacientes, useMedicos, useAgendamentos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ─────────────────────────────────────────────────
interface PrescricaoForm {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
  quantidade: string;
  observacoes: string;
}

interface SinaisVitais {
  pressao_sistolica: string;
  pressao_diastolica: string;
  frequencia_cardiaca: string;
  frequencia_respiratoria: string;
  temperatura: string;
  saturacao: string;
  peso: string;
  altura: string;
  imc: string;
  glasgow: string;
  dor: string;
}

const emptySinaisVitais: SinaisVitais = {
  pressao_sistolica: '', pressao_diastolica: '',
  frequencia_cardiaca: '', frequencia_respiratoria: '',
  temperatura: '', saturacao: '',
  peso: '', altura: '', imc: '',
  glasgow: '', dor: '',
};

const emptyProntuario = {
  paciente_id: '', medico_id: '', data: '',
  queixa_principal: '', historia_doenca_atual: '',
  historia_patologica_pregressa: '', historia_familiar: '',
  historia_social: '', revisao_sistemas: '',
  alergias_relatadas: '', medicamentos_em_uso: '',
  sinais_vitais: {} as SinaisVitais,
  exames_fisicos: '',
  exame_cabeca_pescoco: '', exame_torax: '',
  exame_abdomen: '', exame_membros: '',
  exame_neurologico: '', exame_pele: '',
  hipotese_diagnostica: '', diagnostico_principal: '',
  diagnosticos_secundarios: [] as string[],
  conduta: '', plano_terapeutico: '',
  orientacoes_paciente: '', observacoes_internas: '',
};

// ─── Helpers ───────────────────────────────────────────────
function calcularIdade(dn: string | null) {
  if (!dn) return 0;
  const hoje = new Date(), nasc = new Date(dn);
  let i = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) i--;
  return i;
}

function calcularIMC(peso: string, altura: string) {
  const p = parseFloat(peso), a = parseFloat(altura);
  if (!p || !a || a === 0) return '';
  const altM = a > 3 ? a / 100 : a; // handle cm or m
  return (p / (altM * altM)).toFixed(1);
}

function classificarIMC(imc: string) {
  const v = parseFloat(imc);
  if (!v) return null;
  if (v < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' };
  if (v < 25) return { label: 'Normal', color: 'text-green-500' };
  if (v < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
  return { label: 'Obesidade', color: 'text-red-500' };
}

// ─── Vital Signs Input Component ───────────────────────────
function VitalSignsInput({ sinais, onChange }: { sinais: SinaisVitais; onChange: (s: SinaisVitais) => void }) {
  const update = (field: keyof SinaisVitais, value: string) => {
    const next = { ...sinais, [field]: value };
    if (field === 'peso' || field === 'altura') {
      next.imc = calcularIMC(
        field === 'peso' ? value : next.peso,
        field === 'altura' ? value : next.altura
      );
    }
    onChange(next);
  };

  const imcClass = classificarIMC(sinais.imc);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Activity className="h-4 w-4" /> Sinais Vitais
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" />PA (mmHg)</Label>
          <div className="flex gap-1 items-center">
            <Input placeholder="120" value={sinais.pressao_sistolica} onChange={e => update('pressao_sistolica', e.target.value)} className="h-8 text-sm" />
            <span className="text-muted-foreground">/</span>
            <Input placeholder="80" value={sinais.pressao_diastolica} onChange={e => update('pressao_diastolica', e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />FC (bpm)</Label>
          <Input placeholder="72" value={sinais.frequencia_cardiaca} onChange={e => update('frequencia_cardiaca', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Activity className="h-3 w-3 text-blue-400" />FR (irpm)</Label>
          <Input placeholder="16" value={sinais.frequencia_respiratoria} onChange={e => update('frequencia_respiratoria', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Thermometer className="h-3 w-3 text-orange-400" />Temp (°C)</Label>
          <Input placeholder="36.5" value={sinais.temperatura} onChange={e => update('temperatura', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" />SpO₂ (%)</Label>
          <Input placeholder="98" value={sinais.saturacao} onChange={e => update('saturacao', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Scale className="h-3 w-3" />Peso (kg)</Label>
          <Input placeholder="70" value={sinais.peso} onChange={e => update('peso', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Ruler className="h-3 w-3" />Altura (cm)</Label>
          <Input placeholder="170" value={sinais.altura} onChange={e => update('altura', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">IMC</Label>
          <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
            {sinais.imc || '—'}
            {imcClass && <span className={`ml-1.5 text-xs ${imcClass.color}`}>({imcClass.label})</span>}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Brain className="h-3 w-3 text-purple-400" />Glasgow</Label>
          <Input placeholder="15" value={sinais.glasgow} onChange={e => update('glasgow', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" />Dor (0-10)</Label>
          <Input placeholder="0" value={sinais.dor} onChange={e => update('dor', e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── Section Component ─────────────────────────────────────
function Section({ icon: Icon, title, children, collapsible = false }: {
  icon: React.ElementType; title: string; children: React.ReactNode; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => collapsible && setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide w-full"
      >
        <Icon className="h-4 w-4" />
        {title}
        {collapsible && (open ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />)}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function Prontuarios() {
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProntuarioOpen, setIsProntuarioOpen] = useState(false);
  const [currentProntuario, setCurrentProntuario] = useState<Record<string, any>>({});
  const [prescricoes, setPrescricoes] = useState<PrescricaoForm[]>([]);
  const [showProtocols, setShowProtocols] = useState(false);
  const [showDischargeReport, setShowDischargeReport] = useState(false);
  const [sinaisVitais, setSinaisVitais] = useState<SinaisVitais>(emptySinaisVitais);
  const { toast } = useToast();
  const { profile: user } = useSupabaseAuth();

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  const { medicoId, isMedicoOnly } = useCurrentMedico();
  const [historicoEvolucoes, setHistoricoEvolucoes] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (!selectedPacienteId) { setHistoricoEvolucoes([]); return; }
    setLoadingHistorico(true);
    let query = supabase
      .from('prontuarios')
      .select('id, data, queixa_principal, historia_doenca_atual, exames_fisicos, hipotese_diagnostica, conduta, sinais_vitais, diagnostico_principal, plano_terapeutico, medicos(nome, crm, especialidade)')
      .eq('paciente_id', selectedPacienteId)
      .order('data', { ascending: false })
      .limit(50);
    if (isMedicoOnly && medicoId) query = query.eq('medico_id', medicoId);
    query.then(({ data }) => { setHistoricoEvolucoes(data ?? []); setLoadingHistorico(false); });
  }, [selectedPacienteId, isMedicoOnly, medicoId]);

  const { data: prontuarios = [], isLoading: loadingProntuarios, refetch: refetchProntuarios } = useSupabaseQuery<Record<string, any>>('prontuarios', {
    orderBy: { column: 'data', ascending: false },
    ...(isMedicoOnly && medicoId ? { filters: [{ column: 'medico_id', operator: 'eq', value: medicoId }] } : {}),
  });

  const selectedPaciente = useMemo(() => pacientes.find(p => p.id === selectedPacienteId), [pacientes, selectedPacienteId]);

  const filteredPacientes = useMemo(() => {
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm))
    );
  }, [pacientes, searchTerm]);

  const pacienteProntuarios = useMemo(() => {
    if (!selectedPacienteId) return [];
    return prontuarios
      .filter(p => p.paciente_id === selectedPacienteId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [prontuarios, selectedPacienteId]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleNovoProntuario = () => {
    if (!selectedPacienteId) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setCurrentProntuario({
      ...emptyProntuario,
      paciente_id: selectedPacienteId,
      medico_id: medicoId || user?.id || '',
      data: today,
      alergias_relatadas: selectedPaciente?.alergias?.join(', ') || '',
    });
    setSinaisVitais(emptySinaisVitais);
    setPrescricoes([]);
    setIsProntuarioOpen(true);
  };

  const handleViewProntuario = async (prontuario: Record<string, any>) => {
    setCurrentProntuario(prontuario);
    // Parse sinais vitais
    const sv = prontuario.sinais_vitais || {};
    setSinaisVitais({ ...emptySinaisVitais, ...sv });
    // Load prescriptions
    const { data: prescricoesData } = await supabase
      .from('prescricoes')
      .select('*')
      .eq('prontuario_id', prontuario.id);
    setPrescricoes((prescricoesData || []).map((p: any) => ({
      medicamento: p.medicamento, dosagem: p.dosagem || '',
      posologia: p.posologia || '', duracao: p.duracao || '',
      quantidade: p.quantidade || '', observacoes: p.observacoes || '',
    })));
    setIsProntuarioOpen(true);
  };

  const handleAddPrescricao = () => {
    setPrescricoes([...prescricoes, { medicamento: '', dosagem: '', posologia: '', duracao: '', quantidade: '', observacoes: '' }]);
  };

  const handleUpdatePrescricao = (i: number, field: keyof PrescricaoForm, value: string) => {
    const u = [...prescricoes]; u[i] = { ...u[i], [field]: value }; setPrescricoes(u);
  };

  const handleRemovePrescricao = (i: number) => setPrescricoes(prescricoes.filter((_, idx) => idx !== i));

  const updateField = (field: string, value: any) => setCurrentProntuario(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!currentProntuario.queixa_principal) {
      toast({ title: 'Erro', description: 'Preencha a queixa principal.', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        queixa_principal: currentProntuario.queixa_principal,
        historia_doenca_atual: currentProntuario.historia_doenca_atual,
        historia_patologica_pregressa: currentProntuario.historia_patologica_pregressa,
        historia_familiar: currentProntuario.historia_familiar,
        historia_social: currentProntuario.historia_social,
        revisao_sistemas: currentProntuario.revisao_sistemas,
        alergias_relatadas: currentProntuario.alergias_relatadas,
        medicamentos_em_uso: currentProntuario.medicamentos_em_uso,
        sinais_vitais: JSON.parse(JSON.stringify(sinaisVitais)),
        exames_fisicos: currentProntuario.exames_fisicos,
        exame_cabeca_pescoco: currentProntuario.exame_cabeca_pescoco,
        exame_torax: currentProntuario.exame_torax,
        exame_abdomen: currentProntuario.exame_abdomen,
        exame_membros: currentProntuario.exame_membros,
        exame_neurologico: currentProntuario.exame_neurologico,
        exame_pele: currentProntuario.exame_pele,
        hipotese_diagnostica: currentProntuario.hipotese_diagnostica,
        diagnostico_principal: currentProntuario.diagnostico_principal,
        diagnosticos_secundarios: currentProntuario.diagnosticos_secundarios || [],
        conduta: currentProntuario.conduta,
        plano_terapeutico: currentProntuario.plano_terapeutico,
        orientacoes_paciente: currentProntuario.orientacoes_paciente,
        observacoes_internas: currentProntuario.observacoes_internas,
      };

      let prontuarioId = currentProntuario.id;

      if (currentProntuario.id) {
        const { error } = await supabase.from('prontuarios').update(payload).eq('id', currentProntuario.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('prontuarios').insert({
          ...payload,
          paciente_id: currentProntuario.paciente_id,
          medico_id: currentProntuario.medico_id,
          data: currentProntuario.data,
        }).select().single();
        if (error) throw error;
        prontuarioId = data.id;
      }

      // Save prescriptions
      if (!currentProntuario.id) {
        for (const presc of prescricoes) {
          if (presc.medicamento) {
            await supabase.from('prescricoes').insert({
              paciente_id: currentProntuario.paciente_id,
              medico_id: currentProntuario.medico_id,
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

      refetchProntuarios();
      setIsProntuarioOpen(false);
      toast({ title: 'Prontuário salvo', description: 'Prontuário salvo com sucesso.' });
    } catch (error) {
      console.error('Error saving prontuario:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar prontuário.', variant: 'destructive' });
    }
  };

  const handleApplyProtocol = (protocol: any) => {
    if (protocol.medicamentos_sugeridos?.length > 0) {
      const novas = protocol.medicamentos_sugeridos.map((med: any) => ({
        medicamento: med.nome, dosagem: '', posologia: med.posologia, duracao: '', quantidade: '', observacoes: '',
      }));
      setPrescricoes([...prescricoes, ...novas]);
    }
    let conduta = currentProntuario.conduta || '';
    if (protocol.orientacoes) conduta += `\n\n[Protocolo: ${protocol.nome}]\n${protocol.orientacoes}`;
    updateField('conduta', conduta.trim());
    setShowProtocols(false);
    toast({ title: 'Protocolo aplicado', description: `"${protocol.nome}" aplicado.` });
  };

  const getDischargeReportData = () => ({
    paciente: {
      nome: selectedPaciente?.nome || '',
      dataNascimento: selectedPaciente?.data_nascimento,
      cpf: selectedPaciente?.cpf,
    },
    medico: { nome: user?.nome || 'Médico' },
    consulta: {
      data: currentProntuario.data || format(new Date(), 'yyyy-MM-dd'),
      queixaPrincipal: currentProntuario.queixa_principal,
      hipoteseDiagnostica: currentProntuario.hipotese_diagnostica,
      conduta: currentProntuario.conduta,
    },
    prescricoes: prescricoes.filter(p => p.medicamento),
  });

  // ─── Loading ─────────────────────────────────────────────
  if (loadingPacientes || loadingProntuarios) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Prontuário Eletrônico
          </h1>
          <p className="text-muted-foreground">Prontuário médico completo com anamnese, exame físico, diagnóstico e conduta</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Patient List ─── */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-4 w-4" />Pacientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              {filteredPacientes.map(pac => (
                <div
                  key={pac.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedPacienteId === pac.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                  onClick={() => setSelectedPacienteId(pac.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {pac.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pac.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {calcularIdade(pac.data_nascimento)} anos • {pac.sexo === 'M' ? '♂' : pac.sexo === 'F' ? '♀' : ''} • {pac.cpf || 'Sem CPF'}
                      </p>
                    </div>
                  </div>
                  {pac.alergias && pac.alergias.length > 0 && <AllergyAlert alergias={pac.alergias} compact className="mt-2" />}
                </div>
              ))}
              {filteredPacientes.length === 0 && (
                <p className="text-center text-muted-foreground py-12 text-sm">Nenhum paciente encontrado</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ─── Patient Records ─── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {selectedPaciente && (
                  <PatientPhoto pacienteId={selectedPaciente.id} pacienteNome={selectedPaciente.nome} currentPhotoUrl={selectedPaciente.foto_url} size="md" />
                )}
                <div>
                  <CardTitle className="text-lg">{selectedPaciente?.nome || 'Selecione um paciente'}</CardTitle>
                  {selectedPaciente && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{calcularIdade(selectedPaciente.data_nascimento)} anos</span>
                      {selectedPaciente.telefone && <><span>•</span><span>{selectedPaciente.telefone}</span></>}
                      {selectedPaciente.email && <><span>•</span><span>{selectedPaciente.email}</span></>}
                    </div>
                  )}
                  {selectedPaciente?.alergias && selectedPaciente.alergias.length > 0 && (
                    <AllergyAlert alergias={selectedPaciente.alergias} className="mt-2" />
                  )}
                </div>
              </div>
              {selectedPaciente && (
                <Button onClick={handleNovoProntuario} className="gap-2">
                  <Plus className="h-4 w-4" />Novo Atendimento
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPaciente ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p>Selecione um paciente para ver o prontuário</p>
              </div>
            ) : (
              <Tabs defaultValue="evolucoes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="evolucoes" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Evoluções</TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-1.5"><History className="h-3.5 w-3.5" />Timeline</TabsTrigger>
                  <TabsTrigger value="vitais" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Sinais Vitais</TabsTrigger>
                </TabsList>

                <TabsContent value="evolucoes" className="pt-4">
                  {pacienteProntuarios.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Nenhuma evolução registrada</p>
                  ) : (
                    <div className="space-y-3">
                      {pacienteProntuarios.map(p => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => handleViewProntuario(p)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{format(new Date(p.data), 'dd/MM/yyyy')}</Badge>
                                {p.diagnostico_principal && <Badge variant="secondary" className="text-xs">{p.diagnostico_principal}</Badge>}
                              </div>
                              <p className="text-sm font-medium">{p.queixa_principal}</p>
                              {p.conduta && <p className="text-xs text-muted-foreground line-clamp-1">Conduta: {p.conduta}</p>}
                            </div>
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <PatientTimeline pacienteId={selectedPacienteId!} maxItems={30} />
                </TabsContent>

                <TabsContent value="vitais" className="pt-4">
                  <VitalSignsChart pacienteId={selectedPacienteId!} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Prontuário Dialog ─── */}
      <Dialog open={isProntuarioOpen} onOpenChange={setIsProntuarioOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                {currentProntuario.id ? 'Prontuário' : 'Novo Atendimento'}
                {selectedPaciente && <span className="text-muted-foreground font-normal">— {selectedPaciente.nome}</span>}
              </span>
              <div className="flex gap-2 flex-wrap">
                {selectedPaciente && (medicoId || user?.id) && (
                  <ReturnScheduler
                    pacienteId={selectedPaciente.id}
                    prontuarioId={currentProntuario.id}
                    medicoId={medicoId || user!.id}
                    compact
                  />
                )}
                {currentProntuario.id && (
                  <Button variant="outline" size="sm" onClick={() => {
                    const doc = gerarProntuarioPDF(
                      { nome: selectedPaciente?.nome || '', cpf: selectedPaciente?.cpf || undefined, dataNascimento: selectedPaciente?.data_nascimento || undefined, alergias: selectedPaciente?.alergias || [] },
                      { nome: user?.nome || 'Médico' },
                      { data: currentProntuario.data, queixaPrincipal: currentProntuario.queixa_principal, historiaDoencaAtual: currentProntuario.historia_doenca_atual, examesFisicos: currentProntuario.exames_fisicos, hipoteseDiagnostica: currentProntuario.hipotese_diagnostica, conduta: currentProntuario.conduta },
                      prescricoes.filter(p => p.medicamento)
                    );
                    downloadPDF(doc, `prontuario-${selectedPaciente?.nome?.replace(/\s+/g, '-') || 'paciente'}`);
                  }}>
                    <Printer className="h-4 w-4 mr-1" />PDF
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowDischargeReport(true)}>
                  <FileCheck className="h-4 w-4 mr-1" />Alta
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPaciente?.alergias && selectedPaciente.alergias.length > 0 && (
            <AllergyAlert alergias={selectedPaciente.alergias} className="flex-shrink-0" />
          )}

          <ScrollArea className="flex-1 pr-4">
            <Tabs defaultValue="anamnese" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-4">
                <TabsTrigger value="anamnese" className="text-xs gap-1"><ClipboardList className="h-3 w-3" />Anamnese</TabsTrigger>
                <TabsTrigger value="exame" className="text-xs gap-1"><Stethoscope className="h-3 w-3" />Exame</TabsTrigger>
                <TabsTrigger value="diagnostico" className="text-xs gap-1"><BookOpen className="h-3 w-3" />Diagnóstico</TabsTrigger>
                <TabsTrigger value="conduta" className="text-xs gap-1"><FileCheck className="h-3 w-3" />Conduta</TabsTrigger>
                <TabsTrigger value="prescricao" className="text-xs gap-1"><Pill className="h-3 w-3" />Prescrição</TabsTrigger>
                <TabsTrigger value="anexos" className="text-xs gap-1"><Paperclip className="h-3 w-3" />Anexos</TabsTrigger>
                <TabsTrigger value="historico" className="text-xs gap-1"><History className="h-3 w-3" />Histórico</TabsTrigger>
              </TabsList>

              {/* ─── Anamnese Tab ─── */}
              <TabsContent value="anamnese" className="space-y-6 pt-2">
                <Section icon={AlertTriangle} title="Queixa Principal *">
                  <Textarea
                    placeholder="Descreva a queixa principal do paciente..."
                    value={currentProntuario.queixa_principal || ''}
                    onChange={e => updateField('queixa_principal', e.target.value)}
                    rows={2}
                  />
                </Section>

                <Section icon={FileText} title="História da Doença Atual (HDA)">
                  <Textarea
                    placeholder="Evolução cronológica dos sintomas, fatores de melhora/piora, tratamentos anteriores..."
                    value={currentProntuario.historia_doenca_atual || ''}
                    onChange={e => updateField('historia_doenca_atual', e.target.value)}
                    rows={4}
                  />
                </Section>

                <Section icon={History} title="História Patológica Pregressa (HPP)" collapsible>
                  <Textarea
                    placeholder="Doenças prévias, cirurgias, internações, transfusões, traumas..."
                    value={currentProntuario.historia_patologica_pregressa || ''}
                    onChange={e => updateField('historia_patologica_pregressa', e.target.value)}
                    rows={3}
                  />
                </Section>

                <Section icon={ShieldCheck} title="Alergias e Medicamentos em Uso" collapsible>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Alergias Relatadas</Label>
                      <Textarea
                        placeholder="Medicamentos, alimentos, substâncias..."
                        value={currentProntuario.alergias_relatadas || ''}
                        onChange={e => updateField('alergias_relatadas', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Medicamentos em Uso</Label>
                      <Textarea
                        placeholder="Nome, dose, frequência..."
                        value={currentProntuario.medicamentos_em_uso || ''}
                        onChange={e => updateField('medicamentos_em_uso', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </Section>

                <Section icon={User} title="História Familiar (HF)" collapsible>
                  <Textarea
                    placeholder="Doenças familiares: DM, HAS, câncer, cardiopatias, doenças psiquiátricas..."
                    value={currentProntuario.historia_familiar || ''}
                    onChange={e => updateField('historia_familiar', e.target.value)}
                    rows={2}
                  />
                </Section>

                <Section icon={Clipboard} title="História Social (HS)" collapsible>
                  <Textarea
                    placeholder="Tabagismo, etilismo, drogas, profissão, atividade física, moradia, alimentação..."
                    value={currentProntuario.historia_social || ''}
                    onChange={e => updateField('historia_social', e.target.value)}
                    rows={2}
                  />
                </Section>

                <Section icon={ClipboardList} title="Revisão de Sistemas" collapsible>
                  <Textarea
                    placeholder="Cardiovascular, respiratório, gastrointestinal, geniturinário, neurológico, musculoesquelético, endócrino..."
                    value={currentProntuario.revisao_sistemas || ''}
                    onChange={e => updateField('revisao_sistemas', e.target.value)}
                    rows={3}
                  />
                </Section>
              </TabsContent>

              {/* ─── Exame Físico Tab ─── */}
              <TabsContent value="exame" className="space-y-6 pt-2">
                <VitalSignsInput sinais={sinaisVitais} onChange={setSinaisVitais} />

                <Separator />

                <Section icon={Stethoscope} title="Exame Físico Geral">
                  <Textarea
                    placeholder="Estado geral, nível de consciência, hidratação, coloração, postura..."
                    value={currentProntuario.exames_fisicos || ''}
                    onChange={e => updateField('exames_fisicos', e.target.value)}
                    rows={3}
                  />
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Section icon={EyeIcon} title="Cabeça e Pescoço" collapsible>
                    <Textarea
                      placeholder="Olhos, ouvidos, nariz, orofaringe, tireoide, linfonodos..."
                      value={currentProntuario.exame_cabeca_pescoco || ''}
                      onChange={e => updateField('exame_cabeca_pescoco', e.target.value)}
                      rows={3}
                    />
                  </Section>

                  <Section icon={Heart} title="Tórax (Cardiopulmonar)" collapsible>
                    <Textarea
                      placeholder="Ausculta cardíaca, ausculta pulmonar, percussão, inspeção..."
                      value={currentProntuario.exame_torax || ''}
                      onChange={e => updateField('exame_torax', e.target.value)}
                      rows={3}
                    />
                  </Section>

                  <Section icon={Activity} title="Abdome" collapsible>
                    <Textarea
                      placeholder="Inspeção, ausculta, percussão, palpação superficial e profunda..."
                      value={currentProntuario.exame_abdomen || ''}
                      onChange={e => updateField('exame_abdomen', e.target.value)}
                      rows={3}
                    />
                  </Section>

                  <Section icon={Bone} title="Membros / Extremidades" collapsible>
                    <Textarea
                      placeholder="Edema, pulsos, varizes, deformidades, mobilidade articular..."
                      value={currentProntuario.exame_membros || ''}
                      onChange={e => updateField('exame_membros', e.target.value)}
                      rows={3}
                    />
                  </Section>

                  <Section icon={Brain} title="Exame Neurológico" collapsible>
                    <Textarea
                      placeholder="Força, sensibilidade, reflexos, coordenação, marcha, pares cranianos..."
                      value={currentProntuario.exame_neurologico || ''}
                      onChange={e => updateField('exame_neurologico', e.target.value)}
                      rows={3}
                    />
                  </Section>

                  <Section icon={Stethoscope} title="Pele / Tegumentar" collapsible>
                    <Textarea
                      placeholder="Lesões, coloração, umidade, turgor, cicatrizes..."
                      value={currentProntuario.exame_pele || ''}
                      onChange={e => updateField('exame_pele', e.target.value)}
                      rows={3}
                    />
                  </Section>
                </div>
              </TabsContent>

              {/* ─── Diagnóstico Tab ─── */}
              <TabsContent value="diagnostico" className="space-y-6 pt-2">
                <Section icon={BookOpen} title="Hipótese Diagnóstica (CID-10)">
                  <Cid10Search
                    value={currentProntuario.hipotese_diagnostica || ''}
                    onChange={v => updateField('hipotese_diagnostica', v)}
                  />
                </Section>

                <Section icon={FileCheck} title="Diagnóstico Principal">
                  <Input
                    placeholder="Diagnóstico principal confirmado ou mais provável"
                    value={currentProntuario.diagnostico_principal || ''}
                    onChange={e => updateField('diagnostico_principal', e.target.value)}
                  />
                </Section>

                <Section icon={ClipboardList} title="Diagnósticos Secundários" collapsible>
                  <Textarea
                    placeholder="Comorbidades e diagnósticos associados, um por linha"
                    value={(currentProntuario.diagnosticos_secundarios || []).join('\n')}
                    onChange={e => updateField('diagnosticos_secundarios', e.target.value.split('\n').filter(Boolean))}
                    rows={3}
                  />
                </Section>
              </TabsContent>

              {/* ─── Conduta Tab ─── */}
              <TabsContent value="conduta" className="space-y-6 pt-2">
                <Section icon={FileCheck} title="Conduta">
                  <Textarea
                    placeholder="Conduta terapêutica, solicitação de exames, encaminhamentos..."
                    value={currentProntuario.conduta || ''}
                    onChange={e => updateField('conduta', e.target.value)}
                    rows={4}
                  />
                </Section>

                <Section icon={ClipboardList} title="Plano Terapêutico">
                  <Textarea
                    placeholder="Plano detalhado: medicamentoso, dietético, reabilitação, acompanhamento..."
                    value={currentProntuario.plano_terapeutico || ''}
                    onChange={e => updateField('plano_terapeutico', e.target.value)}
                    rows={3}
                  />
                </Section>

                <Section icon={User} title="Orientações ao Paciente">
                  <Textarea
                    placeholder="Orientações de cuidado, retorno, sinais de alarme, dieta..."
                    value={currentProntuario.orientacoes_paciente || ''}
                    onChange={e => updateField('orientacoes_paciente', e.target.value)}
                    rows={3}
                  />
                </Section>

                <Section icon={ShieldCheck} title="Observações Internas (não imprime)" collapsible>
                  <Textarea
                    placeholder="Anotações internas da equipe, não compartilhadas com o paciente..."
                    value={currentProntuario.observacoes_internas || ''}
                    onChange={e => updateField('observacoes_internas', e.target.value)}
                    rows={2}
                    className="border-dashed"
                  />
                </Section>
              </TabsContent>

              {/* ─── Prescrição Tab ─── */}
              <TabsContent value="prescricao" className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Pill className="h-4 w-4" /> Prescrições
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowProtocols(true)} className="gap-1">
                      <CalendarCheck className="h-4 w-4" />Protocolos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddPrescricao} className="gap-1">
                      <Plus className="h-4 w-4" />Adicionar
                    </Button>
                  </div>
                </div>
                {prescricoes.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Pill className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma prescrição adicionada</p>
                    <Button variant="link" size="sm" onClick={handleAddPrescricao}>Adicionar medicamento</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescricoes.map((presc, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Medicamento {i + 1}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemovePrescricao(i)} className="text-destructive h-7">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div className="col-span-2 md:col-span-3">
                            <Input placeholder="Nome do medicamento *" value={presc.medicamento} onChange={e => handleUpdatePrescricao(i, 'medicamento', e.target.value)} />
                          </div>
                          <Input placeholder="Dosagem (ex: 500mg)" value={presc.dosagem} onChange={e => handleUpdatePrescricao(i, 'dosagem', e.target.value)} />
                          <Input placeholder="Posologia (ex: 8/8h)" value={presc.posologia} onChange={e => handleUpdatePrescricao(i, 'posologia', e.target.value)} />
                          <Input placeholder="Duração (ex: 7 dias)" value={presc.duracao} onChange={e => handleUpdatePrescricao(i, 'duracao', e.target.value)} />
                          <Input placeholder="Quantidade" value={presc.quantidade} onChange={e => handleUpdatePrescricao(i, 'quantidade', e.target.value)} />
                          <div className="col-span-2">
                            <Input placeholder="Observações" value={presc.observacoes} onChange={e => handleUpdatePrescricao(i, 'observacoes', e.target.value)} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ─── Anexos Tab ─── */}
              <TabsContent value="anexos" className="pt-2">
                {currentProntuario.id && selectedPacienteId ? (
                  <AnexosProntuario pacienteId={selectedPacienteId} prontuarioId={currentProntuario.id} anexos={[]} onAnexoAdicionado={() => {}} onAnexoRemovido={() => {}} />
                ) : (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Paperclip className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Salve o prontuário primeiro para adicionar anexos</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── Histórico Tab ─── */}
              <TabsContent value="historico" className="pt-2">
                {loadingHistorico ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : historicoEvolucoes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Nenhum registro anterior</p>
                ) : (
                  <div className="space-y-3">
                    {historicoEvolucoes.map(ev => (
                      <div key={ev.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{format(new Date(ev.data), 'dd/MM/yyyy', { locale: ptBR })}</Badge>
                          {ev.medicos && <span className="text-xs text-muted-foreground">Dr(a). {ev.medicos.nome || ev.medicos.crm} — {ev.medicos.especialidade}</span>}
                          {ev.diagnostico_principal && <Badge variant="secondary" className="text-xs">{ev.diagnostico_principal}</Badge>}
                        </div>
                        {ev.queixa_principal && <p className="text-sm"><strong>QP:</strong> {ev.queixa_principal}</p>}
                        {ev.hipotese_diagnostica && <p className="text-sm"><strong>HD:</strong> {ev.hipotese_diagnostica}</p>}
                        {ev.conduta && <p className="text-sm"><strong>Conduta:</strong> {ev.conduta}</p>}
                        {ev.sinais_vitais && Object.keys(ev.sinais_vitais).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {ev.sinais_vitais.pressao_sistolica && (
                              <Badge variant="outline" className="text-xs">PA: {ev.sinais_vitais.pressao_sistolica}/{ev.sinais_vitais.pressao_diastolica}</Badge>
                            )}
                            {ev.sinais_vitais.frequencia_cardiaca && <Badge variant="outline" className="text-xs">FC: {ev.sinais_vitais.frequencia_cardiaca}</Badge>}
                            {ev.sinais_vitais.temperatura && <Badge variant="outline" className="text-xs">T: {ev.sinais_vitais.temperatura}°C</Badge>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsProntuarioOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Salvar Prontuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Protocols Dialog ─── */}
      <Dialog open={showProtocols} onOpenChange={setShowProtocols}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Protocolos Clínicos</DialogTitle></DialogHeader>
          <ClinicalProtocols onSelectProtocol={handleApplyProtocol} />
        </DialogContent>
      </Dialog>

      <DischargeReport isOpen={showDischargeReport} onClose={() => setShowDischargeReport(false)} data={getDischargeReportData()} />
    </div>
  );
}
