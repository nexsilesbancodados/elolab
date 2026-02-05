import { useState, useMemo } from 'react';
import { Search, FileText, Plus, Save, CalendarCheck, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { 
  AllergyAlert, 
  Cid10Search, 
  ClinicalProtocols, 
  ReturnScheduler,
  DischargeReport 
} from '@/components/clinical';
import { usePacientes, useMedicos, useAgendamentos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PrescricaoForm {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
}

export default function Prontuarios() {
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProntuarioOpen, setIsProntuarioOpen] = useState(false);
  const [currentProntuario, setCurrentProntuario] = useState<Record<string, any>>({});
  const [prescricoes, setPrescricoes] = useState<PrescricaoForm[]>([]);
  const [showProtocols, setShowProtocols] = useState(false);
  const [showDischargeReport, setShowDischargeReport] = useState(false);
  const { toast } = useToast();
  const { profile: user } = useSupabaseAuth();

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [] } = useMedicos();
  const { data: agendamentos = [] } = useAgendamentos(format(new Date(), 'yyyy-MM-dd'));
  const { data: prontuarios = [], isLoading: loadingProntuarios, refetch: refetchProntuarios } = useSupabaseQuery<Record<string, any>>('prontuarios', {
    orderBy: { column: 'data', ascending: false }
  });

  const selectedPaciente = useMemo(() => {
    return pacientes.find(p => p.id === selectedPacienteId);
  }, [pacientes, selectedPacienteId]);

  const filteredPacientes = useMemo(() => {
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cpf && p.cpf.includes(searchTerm))
    );
  }, [pacientes, searchTerm]);

  const pacienteProntuarios = useMemo(() => {
    if (!selectedPacienteId) return [];
    return prontuarios
      .filter((p) => p.paciente_id === selectedPacienteId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [prontuarios, selectedPacienteId]);

  const handleNovoProntuario = () => {
    if (!selectedPacienteId) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setCurrentProntuario({
      paciente_id: selectedPacienteId,
      medico_id: user?.id || '',
      data: today,
      queixa_principal: '',
      historia_doenca_atual: '',
      exames_fisicos: '',
      hipotese_diagnostica: '',
      conduta: '',
    });
    setPrescricoes([]);
    setIsProntuarioOpen(true);
  };

  const handleViewProntuario = async (prontuario: Record<string, any>) => {
    setCurrentProntuario(prontuario);
    const { data: prescricoesData } = await supabase
      .from('prescricoes')
      .select('*')
      .eq('prontuario_id', prontuario.id);
    
    if (prescricoesData) {
      setPrescricoes(prescricoesData.map(p => ({
        medicamento: p.medicamento,
        dosagem: p.dosagem || '',
        posologia: p.posologia || '',
        duracao: p.duracao || '',
      })));
    } else {
      setPrescricoes([]);
    }
    setIsProntuarioOpen(true);
  };

  const handleAddPrescricao = () => {
    setPrescricoes([...prescricoes, { medicamento: '', dosagem: '', posologia: '', duracao: '' }]);
  };

  const handleUpdatePrescricao = (index: number, field: keyof PrescricaoForm, value: string) => {
    const updated = [...prescricoes];
    updated[index] = { ...updated[index], [field]: value };
    setPrescricoes(updated);
  };

  const handleRemovePrescricao = (index: number) => {
    setPrescricoes(prescricoes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentProntuario.queixa_principal) {
      toast({ title: 'Erro', description: 'Preencha a queixa principal.', variant: 'destructive' });
      return;
    }

    try {
      let prontuarioId = currentProntuario.id;

      if (currentProntuario.id) {
        const { error } = await supabase
          .from('prontuarios')
          .update({
            queixa_principal: currentProntuario.queixa_principal,
            historia_doenca_atual: currentProntuario.historia_doenca_atual,
            exames_fisicos: currentProntuario.exames_fisicos,
            hipotese_diagnostica: currentProntuario.hipotese_diagnostica,
            conduta: currentProntuario.conduta,
          })
          .eq('id', currentProntuario.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('prontuarios')
          .insert({
            paciente_id: currentProntuario.paciente_id,
            medico_id: currentProntuario.medico_id,
            data: currentProntuario.data,
            queixa_principal: currentProntuario.queixa_principal,
            historia_doenca_atual: currentProntuario.historia_doenca_atual,
            exames_fisicos: currentProntuario.exames_fisicos,
            hipotese_diagnostica: currentProntuario.hipotese_diagnostica,
            conduta: currentProntuario.conduta,
          })
          .select()
          .single();
        if (error) throw error;
        prontuarioId = data.id;
      }

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
            data_emissao: format(new Date(), 'yyyy-MM-dd'),
            tipo: 'simples',
          });
        }
      }

      refetchProntuarios();
      setIsProntuarioOpen(false);
      toast({ title: 'Prontuário salvo', description: 'O prontuário foi salvo com sucesso.' });
    } catch (error) {
      console.error('Error saving prontuario:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar prontuário.', variant: 'destructive' });
    }
  };

  const handleApplyProtocol = (protocol: any) => {
    if (protocol.medicamentos_sugeridos?.length > 0) {
      const novas = protocol.medicamentos_sugeridos.map((med: any) => ({
        medicamento: med.nome,
        dosagem: '',
        posologia: med.posologia,
        duracao: '',
      }));
      setPrescricoes([...prescricoes, ...novas]);
    }
    let conduta = currentProntuario.conduta || '';
    if (protocol.orientacoes) {
      conduta += `\n\n[Protocolo: ${protocol.nome}]\n${protocol.orientacoes}`;
    }
    setCurrentProntuario({ ...currentProntuario, conduta: conduta.trim() });
    setShowProtocols(false);
    toast({ title: 'Protocolo aplicado', description: `O protocolo "${protocol.nome}" foi aplicado.` });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Prontuário Eletrônico</h1>
        <p className="text-muted-foreground">Gerencie os prontuários dos pacientes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pacientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {filteredPacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedPacienteId === paciente.id ? 'bg-primary/10' : ''}`}
                  onClick={() => setSelectedPacienteId(paciente.id)}
                >
                  <p className="font-medium">{paciente.nome}</p>
                  <p className="text-sm text-muted-foreground">{calcularIdade(paciente.data_nascimento)} anos • {paciente.cpf || 'Sem CPF'}</p>
                  {paciente.alergias?.length > 0 && <AllergyAlert alergias={paciente.alergias} compact className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">{selectedPaciente?.nome || 'Selecione um paciente'}</CardTitle>
                {selectedPaciente?.alergias?.length > 0 && <AllergyAlert alergias={selectedPaciente.alergias} className="mt-2" />}
              </div>
              {selectedPaciente && <Button onClick={handleNovoProntuario} className="gap-2"><Plus className="h-4 w-4" />Novo Atendimento</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPaciente ? (
              <p className="text-center text-muted-foreground py-12">Selecione um paciente</p>
            ) : pacienteProntuarios.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum prontuário registrado</p>
            ) : (
              <div className="space-y-4">
                {pacienteProntuarios.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer" onClick={() => handleViewProntuario(p)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{format(new Date(p.data), 'dd/MM/yyyy')}</p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{p.queixa_principal}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isProntuarioOpen} onOpenChange={setIsProntuarioOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{currentProntuario.id ? 'Visualizar Prontuário' : 'Novo Atendimento'}</span>
              <div className="flex gap-2">
                {selectedPaciente && user?.id && <ReturnScheduler pacienteId={selectedPaciente.id} prontuarioId={currentProntuario.id} medicoId={user.id} compact />}
                <Button variant="outline" size="sm" onClick={() => setShowDischargeReport(true)}><FileDown className="h-4 w-4 mr-2" />Relatório de Alta</Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPaciente?.alergias?.length > 0 && <AllergyAlert alergias={selectedPaciente.alergias} className="mb-4" />}

          <Tabs defaultValue="anamnese" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
              <TabsTrigger value="exames">Exame Físico</TabsTrigger>
              <TabsTrigger value="prescricao">Prescrição</TabsTrigger>
            </TabsList>

            <TabsContent value="anamnese" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Queixa Principal *</Label>
                <Textarea value={currentProntuario.queixa_principal || ''} onChange={(e) => setCurrentProntuario({ ...currentProntuario, queixa_principal: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>História da Doença Atual</Label>
                <Textarea value={currentProntuario.historia_doenca_atual || ''} onChange={(e) => setCurrentProntuario({ ...currentProntuario, historia_doenca_atual: e.target.value })} rows={4} />
              </div>
            </TabsContent>

            <TabsContent value="exames" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Exame Físico</Label>
                <Textarea value={currentProntuario.exames_fisicos || ''} onChange={(e) => setCurrentProntuario({ ...currentProntuario, exames_fisicos: e.target.value })} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Hipótese Diagnóstica (CID-10)</Label>
                <Cid10Search value={currentProntuario.hipotese_diagnostica || ''} onChange={(value) => setCurrentProntuario({ ...currentProntuario, hipotese_diagnostica: value })} />
              </div>
              <div className="space-y-2">
                <Label>Conduta</Label>
                <Textarea value={currentProntuario.conduta || ''} onChange={(e) => setCurrentProntuario({ ...currentProntuario, conduta: e.target.value })} rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="prescricao" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <Label>Prescrições</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowProtocols(true)}><CalendarCheck className="h-4 w-4 mr-2" />Protocolos</Button>
                  <Button variant="outline" size="sm" onClick={handleAddPrescricao}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
                </div>
              </div>
              {prescricoes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma prescrição adicionada</p>
              ) : (
                <div className="space-y-4">
                  {prescricoes.map((presc, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Medicamento {index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePrescricao(index)} className="text-destructive">Remover</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Input placeholder="Nome do medicamento" value={presc.medicamento} onChange={(e) => handleUpdatePrescricao(index, 'medicamento', e.target.value)} /></div>
                        <Input placeholder="Dosagem" value={presc.dosagem} onChange={(e) => handleUpdatePrescricao(index, 'dosagem', e.target.value)} />
                        <Input placeholder="Posologia" value={presc.posologia} onChange={(e) => handleUpdatePrescricao(index, 'posologia', e.target.value)} />
                        <Input placeholder="Duração" value={presc.duracao} onChange={(e) => handleUpdatePrescricao(index, 'duracao', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProntuarioOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
