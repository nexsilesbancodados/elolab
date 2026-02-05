import { useState, useEffect } from 'react';
import { Search, FileText, Plus, Save, Printer, CalendarCheck, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Prontuario, Prescricao, Paciente, User, Agendamento } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { 
  AllergyAlert, 
  Cid10Search, 
  ClinicalProtocols, 
  ReturnScheduler,
  DischargeReport 
} from '@/components/clinical';

export default function Prontuarios() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProntuarioOpen, setIsProntuarioOpen] = useState(false);
  const [currentProntuario, setCurrentProntuario] = useState<Partial<Prontuario>>({});
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [showProtocols, setShowProtocols] = useState(false);
  const [showDischargeReport, setShowDischargeReport] = useState(false);
  const { toast } = useToast();
  const { profile: user } = useSupabaseAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPacientes(getAll<Paciente>('pacientes'));
    setProntuarios(getAll<Prontuario>('prontuarios'));
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setMedicos(getAll<User>('users').filter((u) => u.role === 'medico'));
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm)
  );

  const pacienteProntuarios = selectedPaciente
    ? prontuarios
        .filter((p) => p.pacienteId === selectedPaciente.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : [];

  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
  };

  const handleNovoProntuario = () => {
    if (!selectedPaciente) return;

    // Find today's appointment for this patient
    const today = format(new Date(), 'yyyy-MM-dd');
    const agendamentoHoje = agendamentos.find(
      (a) => a.pacienteId === selectedPaciente.id && a.data === today && a.status === 'em_atendimento'
    );

    setCurrentProntuario({
      pacienteId: selectedPaciente.id,
      medicoId: user?.id || '',
      agendamentoId: agendamentoHoje?.id || '',
      data: today,
      queixaPrincipal: '',
      historiaDoencaAtual: '',
      examesFisicos: '',
      hipoteseDiagnostica: '',
      conduta: '',
      prescricoes: [],
    });
    setPrescricoes([]);
    setIsProntuarioOpen(true);
  };

  const handleViewProntuario = (prontuario: Prontuario) => {
    setCurrentProntuario(prontuario);
    setPrescricoes(prontuario.prescricoes || []);
    setIsProntuarioOpen(true);
  };

  const handleAddPrescricao = () => {
    const novaPrescricao: Prescricao = {
      id: generateId(),
      medicamento: '',
      dosagem: '',
      posologia: '',
      duracao: '',
    };
    setPrescricoes([...prescricoes, novaPrescricao]);
  };

  const handleUpdatePrescricao = (index: number, field: keyof Prescricao, value: string) => {
    const updated = [...prescricoes];
    updated[index] = { ...updated[index], [field]: value };
    setPrescricoes(updated);
  };

  const handleRemovePrescricao = (index: number) => {
    setPrescricoes(prescricoes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!currentProntuario.queixaPrincipal) {
      toast({
        title: 'Erro',
        description: 'Preencha a queixa principal.',
        variant: 'destructive',
      });
      return;
    }

    const allProntuarios = getAll<Prontuario>('prontuarios');
    const prontuarioCompleto: Prontuario = {
      ...currentProntuario,
      id: currentProntuario.id || generateId(),
      prescricoes,
      criadoEm: currentProntuario.criadoEm || new Date().toISOString(),
    } as Prontuario;

    if (currentProntuario.id) {
      const index = allProntuarios.findIndex((p) => p.id === currentProntuario.id);
      if (index !== -1) {
        allProntuarios[index] = prontuarioCompleto;
      }
    } else {
      allProntuarios.push(prontuarioCompleto);
    }

    setCollection('prontuarios', allProntuarios);
    loadData();
    setIsProntuarioOpen(false);
    toast({
      title: 'Prontuário salvo',
      description: 'O prontuário foi salvo com sucesso.',
    });
  };

  const handleApplyProtocol = (protocol: any) => {
    // Apply protocol medications as prescriptions
    if (protocol.medicamentos_sugeridos && protocol.medicamentos_sugeridos.length > 0) {
      const novasPrescricoes = protocol.medicamentos_sugeridos.map((med: any) => ({
        id: generateId(),
        medicamento: med.nome,
        dosagem: '',
        posologia: med.posologia,
        duracao: '',
      }));
      setPrescricoes([...prescricoes, ...novasPrescricoes]);
    }

    // Add protocol info to conduta
    let condutaText = currentProntuario.conduta || '';
    if (protocol.orientacoes) {
      condutaText += `\n\n[Protocolo: ${protocol.nome}]\n${protocol.orientacoes}`;
    }
    setCurrentProntuario({ ...currentProntuario, conduta: condutaText.trim() });
    
    setShowProtocols(false);
    toast({
      title: 'Protocolo aplicado',
      description: `O protocolo "${protocol.nome}" foi aplicado ao prontuário.`,
    });
  };

  const getMedicoNome = (id: string) => medicos.find((m) => m.id === id)?.nome || 'Desconhecido';
  const getCurrentMedico = () => medicos.find((m) => m.id === user?.id);

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const getDischargeReportData = () => {
    const medico = getCurrentMedico();
    return {
      paciente: {
        nome: selectedPaciente?.nome || '',
        dataNascimento: selectedPaciente?.dataNascimento,
        cpf: selectedPaciente?.cpf,
      },
      medico: {
        nome: medico?.nome || user?.nome || 'Médico',
        crm: medico?.crm,
        especialidade: medico?.especialidade,
      },
      consulta: {
        data: currentProntuario.data || format(new Date(), 'yyyy-MM-dd'),
        queixaPrincipal: currentProntuario.queixaPrincipal,
        hipoteseDiagnostica: currentProntuario.hipoteseDiagnostica,
        conduta: currentProntuario.conduta,
      },
      prescricoes: prescricoes.filter(p => p.medicamento).map(p => ({
        medicamento: p.medicamento,
        dosagem: p.dosagem,
        posologia: p.posologia,
        duracao: p.duracao,
      })),
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Prontuário Eletrônico</h1>
        <p className="text-muted-foreground">Gerencie os prontuários dos pacientes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pacientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {filteredPacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedPaciente?.id === paciente.id ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => handleSelectPaciente(paciente)}
                >
                  <p className="font-medium">{paciente.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {calcularIdade(paciente.dataNascimento)} anos • {paciente.cpf}
                  </p>
                  {paciente.alergias && paciente.alergias.length > 0 && (
                    <AllergyAlert alergias={paciente.alergias} compact className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prontuários do Paciente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  {selectedPaciente ? selectedPaciente.nome : 'Selecione um paciente'}
                </CardTitle>
                {selectedPaciente && (
                  <div className="space-y-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {calcularIdade(selectedPaciente.dataNascimento)} anos •{' '}
                      {selectedPaciente.convenio?.nome || 'Particular'}
                    </p>
                    {selectedPaciente.alergias && selectedPaciente.alergias.length > 0 && (
                      <AllergyAlert alergias={selectedPaciente.alergias} className="mt-2" />
                    )}
                  </div>
                )}
              </div>
              {selectedPaciente && (
                <Button onClick={handleNovoProntuario} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Atendimento
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPaciente ? (
              <p className="text-center text-muted-foreground py-12">
                Selecione um paciente para visualizar os prontuários
              </p>
            ) : pacienteProntuarios.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Nenhum prontuário registrado para este paciente
              </p>
            ) : (
              <div className="space-y-4">
                {pacienteProntuarios.map((prontuario) => (
                  <div
                    key={prontuario.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleViewProntuario(prontuario)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {format(new Date(prontuario.data), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getMedicoNome(prontuario.medicoId)}
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{prontuario.queixaPrincipal}</p>
                    {prontuario.prescricoes.length > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {prontuario.prescricoes.length} prescrição(ões)
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prontuário Dialog */}
      <Dialog open={isProntuarioOpen} onOpenChange={setIsProntuarioOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{currentProntuario.id ? 'Visualizar Prontuário' : 'Novo Atendimento'}</span>
              <div className="flex gap-2">
                {selectedPaciente && user?.id && (
                  <ReturnScheduler
                    pacienteId={selectedPaciente.id}
                    prontuarioId={currentProntuario.id}
                    medicoId={user.id}
                    compact
                  />
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDischargeReport(true)}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Relatório de Alta
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Allergy Alert at top of dialog */}
          {selectedPaciente?.alergias && selectedPaciente.alergias.length > 0 && (
            <AllergyAlert alergias={selectedPaciente.alergias} className="mb-4" />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="anamnese" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="exames">Exame Físico</TabsTrigger>
                  <TabsTrigger value="prescricao">Prescrição</TabsTrigger>
                </TabsList>

                <TabsContent value="anamnese" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Queixa Principal *</Label>
                    <Textarea
                      value={currentProntuario.queixaPrincipal || ''}
                      onChange={(e) =>
                        setCurrentProntuario({ ...currentProntuario, queixaPrincipal: e.target.value })
                      }
                      rows={3}
                      placeholder="Descreva a queixa principal do paciente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>História da Doença Atual</Label>
                    <Textarea
                      value={currentProntuario.historiaDoencaAtual || ''}
                      onChange={(e) =>
                        setCurrentProntuario({
                          ...currentProntuario,
                          historiaDoencaAtual: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Descreva a evolução dos sintomas..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="exames" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Exame Físico</Label>
                    <Textarea
                      value={currentProntuario.examesFisicos || ''}
                      onChange={(e) =>
                        setCurrentProntuario({ ...currentProntuario, examesFisicos: e.target.value })
                      }
                      rows={4}
                      placeholder="Achados do exame físico..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hipótese Diagnóstica (CID-10)</Label>
                    <Cid10Search
                      value={currentProntuario.hipoteseDiagnostica || ''}
                      onChange={(value) =>
                        setCurrentProntuario({
                          ...currentProntuario,
                          hipoteseDiagnostica: value,
                        })
                      }
                      placeholder="Buscar CID-10..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conduta</Label>
                    <Textarea
                      value={currentProntuario.conduta || ''}
                      onChange={(e) =>
                        setCurrentProntuario({ ...currentProntuario, conduta: e.target.value })
                      }
                      rows={3}
                      placeholder="Plano terapêutico, orientações..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="prescricao" className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <Label>Prescrições</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowProtocols(true)}>
                        Usar Protocolo
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleAddPrescricao}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Medicamento
                      </Button>
                    </div>
                  </div>

                  {prescricoes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma prescrição adicionada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {prescricoes.map((prescricao, index) => (
                        <div key={prescricao.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Medicamento {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePrescricao(index)}
                              className="text-destructive"
                            >
                              Remover
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Medicamento</Label>
                              <Input
                                value={prescricao.medicamento}
                                onChange={(e) =>
                                  handleUpdatePrescricao(index, 'medicamento', e.target.value)
                                }
                                placeholder="Nome do medicamento"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Dosagem</Label>
                              <Input
                                value={prescricao.dosagem}
                                onChange={(e) =>
                                  handleUpdatePrescricao(index, 'dosagem', e.target.value)
                                }
                                placeholder="Ex: 500mg"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Posologia</Label>
                              <Input
                                value={prescricao.posologia}
                                onChange={(e) =>
                                  handleUpdatePrescricao(index, 'posologia', e.target.value)
                                }
                                placeholder="Ex: 1 comprimido de 8/8h"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Duração</Label>
                              <Input
                                value={prescricao.duracao}
                                onChange={(e) =>
                                  handleUpdatePrescricao(index, 'duracao', e.target.value)
                                }
                                placeholder="Ex: 7 dias"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Protocols Sidebar */}
            {showProtocols && (
              <div className="lg:col-span-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Protocolos Clínicos</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowProtocols(false)}>
                    ×
                  </Button>
                </div>
                <ClinicalProtocols 
                  onSelectProtocol={handleApplyProtocol}
                  className="h-[500px] overflow-hidden"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProntuarioOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Prontuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Protocols Dialog (for non-sidebar view) */}
      <Dialog open={showProtocols && !isProntuarioOpen} onOpenChange={setShowProtocols}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Protocolos Clínicos</DialogTitle>
          </DialogHeader>
          <ClinicalProtocols onSelectProtocol={handleApplyProtocol} />
        </DialogContent>
      </Dialog>

      {/* Discharge Report Dialog */}
      {showDischargeReport && (
        <DischargeReport
          isOpen={showDischargeReport}
          onClose={() => setShowDischargeReport(false)}
          data={getDischargeReportData()}
        />
      )}
    </div>
  );
}
