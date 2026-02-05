import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Printer, Pill, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Paciente, User } from '@/types';
import { getAll, generateId, setCollection } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import { gerarReceita, openPDF, downloadPDF } from '@/lib/pdfGenerator';
import { DrugInteractionChecker, AllergyAlert } from '@/components/clinical';

interface Prescricao {
  id: string;
  pacienteId: string;
  medicoId: string;
  data: string;
  medicamentos: MedicamentoPrescrito[];
  orientacoes: string;
  tipo: 'simples' | 'controle_especial' | 'antimicrobiano';
  validade: string;
  status: 'ativa' | 'vencida' | 'suspensa';
  criadoEm: string;
}

interface MedicamentoPrescrito {
  id: string;
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  quantidade: string;
  observacoes: string;
}

const VIAS = ['Oral', 'Intravenosa', 'Intramuscular', 'Subcutânea', 'Tópica', 'Inalatória', 'Retal'];
const FREQUENCIAS = ['1x ao dia', '2x ao dia', '3x ao dia', '4x ao dia', '6/6h', '8/8h', '12/12h', 'Se necessário'];

export default function Prescricoes() {
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPrescricao, setSelectedPrescricao] = useState<Prescricao | null>(null);
  const [formData, setFormData] = useState<Partial<Prescricao>>({});
  const [medicamentos, setMedicamentos] = useState<MedicamentoPrescrito[]>([]);
  const [interactionDismissed, setInteractionDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPrescricoes(getAll<Prescricao>('prescricoes'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  };

  const filteredPrescricoes = prescricoes.filter(p => {
    const paciente = pacientes.find(pac => pac.id === p.pacienteId);
    return paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get selected patient and their allergies
  const selectedPaciente = useMemo(() => {
    return pacientes.find(p => p.id === formData.pacienteId);
  }, [pacientes, formData.pacienteId]);

  // Get list of medication names for interaction checking
  const medicamentoNomes = useMemo(() => {
    return medicamentos.map(m => m.nome).filter(Boolean);
  }, [medicamentos]);

  const handleNew = () => {
    setSelectedPrescricao(null);
    setFormData({
      data: format(new Date(), 'yyyy-MM-dd'),
      tipo: 'simples',
      validade: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'ativa',
    });
    setMedicamentos([]);
    setInteractionDismissed(false);
    setIsFormOpen(true);
  };

  const handleAddMedicamento = () => {
    setMedicamentos([
      ...medicamentos,
      {
        id: generateId(),
        nome: '',
        dosagem: '',
        via: 'Oral',
        frequencia: '1x ao dia',
        duracao: '',
        quantidade: '',
        observacoes: '',
      },
    ]);
  };

  const handleUpdateMedicamento = (index: number, field: keyof MedicamentoPrescrito, value: string) => {
    const updated = [...medicamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMedicamentos(updated);
    // Reset interaction dismissed when medications change
    if (field === 'nome') {
      setInteractionDismissed(false);
    }
  };

  const handleRemoveMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
    setInteractionDismissed(false);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.medicoId || medicamentos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios e adicione pelo menos um medicamento.',
        variant: 'destructive',
      });
      return;
    }

    const allPrescricoes = getAll<Prescricao>('prescricoes');
    const newPrescricao: Prescricao = {
      ...formData,
      id: generateId(),
      medicamentos,
      orientacoes: formData.orientacoes || '',
      criadoEm: new Date().toISOString(),
    } as Prescricao;

    allPrescricoes.push(newPrescricao);
    setCollection('prescricoes', allPrescricoes);
    loadData();
    setIsFormOpen(false);
    toast({
      title: 'Prescrição criada',
      description: 'A receita foi salva com sucesso.',
    });
  };

  const handleView = (prescricao: Prescricao) => {
    setSelectedPrescricao(prescricao);
    setIsViewOpen(true);
  };

  const handlePrint = (prescricao: Prescricao) => {
    const paciente = pacientes.find(p => p.id === prescricao.pacienteId);
    const medico = medicos.find(m => m.id === prescricao.medicoId);
    
    if (!paciente || !medico) {
      toast({
        title: 'Erro',
        description: 'Dados do paciente ou médico não encontrados.',
        variant: 'destructive',
      });
      return;
    }

    const doc = gerarReceita(
      { nome: paciente.nome, cpf: paciente.cpf, dataNascimento: paciente.dataNascimento },
      { nome: medico.nome, crm: medico.crm, especialidade: medico.especialidade },
      prescricao.medicamentos,
      prescricao.orientacoes,
      prescricao.tipo
    );
    openPDF(doc);
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => medicos.find(m => m.id === id)?.nome || 'Desconhecido';

  const getTipoBadge = (tipo: string) => {
    const badges = {
      simples: 'bg-blue-100 text-blue-800',
      controle_especial: 'bg-yellow-100 text-yellow-800',
      antimicrobiano: 'bg-purple-100 text-purple-800',
    };
    return badges[tipo as keyof typeof badges] || badges.simples;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescrições</h1>
          <p className="text-muted-foreground">Gerencie receitas e prescrições médicas</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Prescrição
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Prescrições</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Médico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Medicamentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescricoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma prescrição encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrescricoes.map((prescricao) => (
                    <TableRow key={prescricao.id}>
                      <TableCell>{format(new Date(prescricao.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(prescricao.pacienteId)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(prescricao.medicoId)}</TableCell>
                      <TableCell>
                        <Badge className={cn(getTipoBadge(prescricao.tipo))}>
                          {prescricao.tipo.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {prescricao.medicamentos.length} item(s)
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          prescricao.status === 'ativa' && 'bg-green-100 text-green-800',
                          prescricao.status === 'vencida' && 'bg-red-100 text-red-800',
                          prescricao.status === 'suspensa' && 'bg-gray-100 text-gray-800'
                        )}>
                          {prescricao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(prescricao)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(prescricao)}>
                            <Printer className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Prescrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Allergy Alert for selected patient */}
            {selectedPaciente?.alergias && selectedPaciente.alergias.length > 0 && (
              <AllergyAlert alergias={selectedPaciente.alergias} />
            )}

            {/* Drug Interaction Checker */}
            {selectedPaciente && medicamentoNomes.length > 0 && !interactionDismissed && (
              <DrugInteractionChecker
                medicamentos={medicamentoNomes}
                alergias={selectedPaciente.alergias || []}
                onDismiss={() => setInteractionDismissed(true)}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select
                  value={formData.pacienteId}
                  onValueChange={(v) => {
                    setFormData({ ...formData, pacienteId: v });
                    setInteractionDismissed(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.nome}</span>
                          {p.alergias && p.alergias.length > 0 && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Médico *</Label>
                <Select
                  value={formData.medicoId}
                  onValueChange={(v) => setFormData({ ...formData, medicoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Receita</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples</SelectItem>
                    <SelectItem value="controle_especial">Controle Especial</SelectItem>
                    <SelectItem value="antimicrobiano">Antimicrobiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={formData.validade}
                  onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                />
              </div>
            </div>

            {/* Medicamentos */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg">Medicamentos</Label>
                <Button variant="outline" size="sm" onClick={handleAddMedicamento}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {medicamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum medicamento adicionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicamentos.map((med, index) => (
                    <div key={med.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Medicamento {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicamento(index)}
                          className="text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="col-span-2 md:col-span-1 space-y-1">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            value={med.nome}
                            onChange={(e) => handleUpdateMedicamento(index, 'nome', e.target.value)}
                            placeholder="Nome do medicamento"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosagem</Label>
                          <Input
                            value={med.dosagem}
                            onChange={(e) => handleUpdateMedicamento(index, 'dosagem', e.target.value)}
                            placeholder="Ex: 500mg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Via</Label>
                          <Select
                            value={med.via}
                            onValueChange={(v) => handleUpdateMedicamento(index, 'via', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VIAS.map((via) => (
                                <SelectItem key={via} value={via}>{via}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequência</Label>
                          <Select
                            value={med.frequencia}
                            onValueChange={(v) => handleUpdateMedicamento(index, 'frequencia', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCIAS.map((freq) => (
                                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duração</Label>
                          <Input
                            value={med.duracao}
                            onChange={(e) => handleUpdateMedicamento(index, 'duracao', e.target.value)}
                            placeholder="Ex: 7 dias"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            value={med.quantidade}
                            onChange={(e) => handleUpdateMedicamento(index, 'quantidade', e.target.value)}
                            placeholder="Ex: 21 comprimidos"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Observações</Label>
                        <Textarea
                          value={med.observacoes}
                          onChange={(e) => handleUpdateMedicamento(index, 'observacoes', e.target.value)}
                          placeholder="Instruções especiais..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orientações */}
            <div className="border-t pt-4">
              <Label>Orientações Gerais</Label>
              <Textarea
                value={formData.orientacoes || ''}
                onChange={(e) => setFormData({ ...formData, orientacoes: e.target.value })}
                placeholder="Orientações adicionais para o paciente..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Pill className="h-4 w-4 mr-2" />
              Criar Prescrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Prescrição</DialogTitle>
          </DialogHeader>
          {selectedPrescricao && (
            <div className="space-y-4 py-4">
              {/* Patient Allergies */}
              {(() => {
                const paciente = pacientes.find(p => p.id === selectedPrescricao.pacienteId);
                return paciente?.alergias && paciente.alergias.length > 0 && (
                  <AllergyAlert alergias={paciente.alergias} />
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Paciente</Label>
                  <p className="font-medium">{getPacienteNome(selectedPrescricao.pacienteId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Médico</Label>
                  <p className="font-medium">{getMedicoNome(selectedPrescricao.medicoId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p>{format(new Date(selectedPrescricao.data), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Validade</Label>
                  <p>{format(new Date(selectedPrescricao.validade), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <Badge className={cn(getTipoBadge(selectedPrescricao.tipo))}>
                    {selectedPrescricao.tipo.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={cn(
                    selectedPrescricao.status === 'ativa' && 'bg-green-100 text-green-800',
                    selectedPrescricao.status === 'vencida' && 'bg-red-100 text-red-800',
                    selectedPrescricao.status === 'suspensa' && 'bg-gray-100 text-gray-800'
                  )}>
                    {selectedPrescricao.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Medicamentos</Label>
                <div className="space-y-3">
                  {selectedPrescricao.medicamentos.map((med, index) => (
                    <div key={med.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{index + 1}. {med.nome}</p>
                      <div className="text-sm text-muted-foreground mt-1 grid grid-cols-2 gap-2">
                        {med.dosagem && <span>Dosagem: {med.dosagem}</span>}
                        {med.via && <span>Via: {med.via}</span>}
                        {med.frequencia && <span>Frequência: {med.frequencia}</span>}
                        {med.duracao && <span>Duração: {med.duracao}</span>}
                        {med.quantidade && <span>Quantidade: {med.quantidade}</span>}
                      </div>
                      {med.observacoes && (
                        <p className="text-sm mt-2 italic">{med.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescricao.orientacoes && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Orientações</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedPrescricao.orientacoes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            {selectedPrescricao && (
              <Button onClick={() => handlePrint(selectedPrescricao)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
