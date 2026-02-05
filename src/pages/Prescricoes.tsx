import { useState, useMemo } from 'react';
import { Plus, Search, Eye, Printer, Pill, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { gerarReceita, openPDF } from '@/lib/pdfGenerator';
import { DrugInteractionChecker, AllergyAlert } from '@/components/clinical';
import { usePacientes, useMedicos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface MedicamentoForm {
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  quantidade: string;
}

const VIAS = ['Oral', 'Intravenosa', 'Intramuscular', 'Subcutânea', 'Tópica', 'Inalatória', 'Retal'];
const FREQUENCIAS = ['1x ao dia', '2x ao dia', '3x ao dia', '4x ao dia', '6/6h', '8/8h', '12/12h', 'Se necessário'];

export default function Prescricoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPrescricao, setSelectedPrescricao] = useState<any>(null);
  const [formData, setFormData] = useState({ paciente_id: '', medico_id: '', tipo: 'simples', orientacoes: '' });
  const [medicamentos, setMedicamentos] = useState<MedicamentoForm[]>([]);
  const [interactionDismissed, setInteractionDismissed] = useState(false);
  const { toast } = useToast();

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { data: prescricoes = [], isLoading: loadingPrescricoes, refetch } = useSupabaseQuery<Record<string, any>>('prescricoes', { orderBy: { column: 'created_at', ascending: false } });

  const selectedPaciente = useMemo(() => pacientes.find(p => p.id === formData.paciente_id), [pacientes, formData.paciente_id]);
  const medicamentoNomes = useMemo(() => medicamentos.map(m => m.nome).filter(Boolean), [medicamentos]);

  const groupedPrescricoes = useMemo(() => {
    const groups = new Map<string, any[]>();
    prescricoes.forEach(p => {
      const key = `${p.paciente_id}-${p.data_emissao || p.created_at.slice(0, 10)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({
      key, paciente_id: items[0].paciente_id, medico_id: items[0].medico_id, data: items[0].data_emissao || items[0].created_at, tipo: items[0].tipo || 'simples', medicamentos: items,
    }));
  }, [prescricoes]);

  const filteredPrescricoes = useMemo(() => {
    return groupedPrescricoes.filter(g => {
      const paciente = pacientes.find(p => p.id === g.paciente_id);
      return paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [groupedPrescricoes, pacientes, searchTerm]);

  const handleNew = () => {
    setFormData({ paciente_id: '', medico_id: '', tipo: 'simples', orientacoes: '' });
    setMedicamentos([]);
    setInteractionDismissed(false);
    setIsFormOpen(true);
  };

  const handleAddMedicamento = () => setMedicamentos([...medicamentos, { nome: '', dosagem: '', via: 'Oral', frequencia: '1x ao dia', duracao: '', quantidade: '' }]);
  const handleUpdateMedicamento = (index: number, field: keyof MedicamentoForm, value: string) => {
    const updated = [...medicamentos]; updated[index] = { ...updated[index], [field]: value }; setMedicamentos(updated);
    if (field === 'nome') setInteractionDismissed(false);
  };
  const handleRemoveMedicamento = (index: number) => { setMedicamentos(medicamentos.filter((_, i) => i !== index)); setInteractionDismissed(false); };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.medico_id || medicamentos.length === 0) {
      toast({ title: 'Erro', description: 'Preencha todos os campos e adicione pelo menos um medicamento.', variant: 'destructive' });
      return;
    }
    try {
      for (const med of medicamentos) {
        if (med.nome) {
          await supabase.from('prescricoes').insert({
            paciente_id: formData.paciente_id, medico_id: formData.medico_id, medicamento: med.nome,
            dosagem: med.dosagem || null, posologia: `${med.frequencia} - ${med.via}`, duracao: med.duracao || null,
            quantidade: med.quantidade || null, observacoes: formData.orientacoes || null, data_emissao: format(new Date(), 'yyyy-MM-dd'), tipo: formData.tipo,
          });
        }
      }
      refetch();
      setIsFormOpen(false);
      toast({ title: 'Prescrição criada' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar.', variant: 'destructive' });
    }
  };

  const handleView = (group: any) => { setSelectedPrescricao(group); setIsViewOpen(true); };

  const handlePrint = (group: any) => {
    const paciente = pacientes.find(p => p.id === group.paciente_id);
    const medico = medicos.find(m => m.id === group.medico_id);
    if (!paciente || !medico) return;
    const doc = gerarReceita(
      { nome: paciente.nome, cpf: paciente.cpf || '', dataNascimento: paciente.data_nascimento || '' },
      { nome: medico.crm, crm: medico.crm, especialidade: medico.especialidade || '' },
      group.medicamentos.map((m: any) => ({ nome: m.medicamento, dosagem: m.dosagem || '', via: 'Oral', frequencia: m.posologia || '', duracao: m.duracao || '', quantidade: m.quantidade || '', observacoes: '' })),
      '', group.tipo
    );
    openPDF(doc);
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => medicos.find(m => m.id === id)?.crm || 'Desconhecido';
  const getTipoBadge = (tipo: string) => ({ simples: 'bg-blue-100 text-blue-800', controle_especial: 'bg-yellow-100 text-yellow-800', antimicrobiano: 'bg-purple-100 text-purple-800' }[tipo] || 'bg-gray-100 text-gray-800');

  if (loadingPacientes || loadingMedicos || loadingPrescricoes) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold text-foreground">Prescrições</h1><p className="text-muted-foreground">Gerencie receitas e prescrições</p></div>
        <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" />Nova Prescrição</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista ({filteredPrescricoes.length})</CardTitle>
            <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead className="hidden md:table-cell">Médico</TableHead><TableHead>Tipo</TableHead><TableHead className="hidden sm:table-cell">Itens</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescricoes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Pill className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma prescrição encontrada</p></TableCell></TableRow>
                ) : (
                  filteredPrescricoes.map((group) => (
                    <TableRow key={group.key}>
                      <TableCell>{format(new Date(group.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(group.paciente_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(group.medico_id)}</TableCell>
                      <TableCell><Badge className={cn(getTipoBadge(group.tipo))}>{group.tipo.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell">{group.medicamentos.length} item(s)</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(group)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(group)}><Printer className="h-4 w-4" /></Button>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Prescrição</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            {selectedPaciente?.alergias?.length > 0 && <AllergyAlert alergias={selectedPaciente.alergias} />}
            {selectedPaciente && medicamentoNomes.length > 0 && !interactionDismissed && <DrugInteractionChecker medicamentos={medicamentoNomes} alergias={selectedPaciente.alergias || []} onDismiss={() => setInteractionDismissed(true)} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select value={formData.paciente_id} onValueChange={(v) => { setFormData({ ...formData, paciente_id: v }); setInteractionDismissed(false); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pacientes.map((p) => <SelectItem key={p.id} value={p.id}><div className="flex items-center gap-2"><span>{p.nome}</span>{p.alergias?.length > 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Médico *</Label>
                <Select value={formData.medico_id} onValueChange={(v) => setFormData({ ...formData, medico_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{medicos.map((m) => <SelectItem key={m.id} value={m.id}>{m.crm} - {m.especialidade}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples</SelectItem>
                    <SelectItem value="controle_especial">Controle Especial</SelectItem>
                    <SelectItem value="antimicrobiano">Antimicrobiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg">Medicamentos</Label>
                <Button variant="outline" size="sm" onClick={handleAddMedicamento}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
              </div>
              {medicamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg"><Pill className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum medicamento</p></div>
              ) : (
                <div className="space-y-4">
                  {medicamentos.map((med, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center"><span className="font-medium">Medicamento {index + 1}</span><Button variant="ghost" size="sm" onClick={() => handleRemoveMedicamento(index)} className="text-destructive">Remover</Button></div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="col-span-2 md:col-span-1 space-y-1"><Label className="text-xs">Nome *</Label><Input value={med.nome} onChange={(e) => handleUpdateMedicamento(index, 'nome', e.target.value)} /></div>
                        <div className="space-y-1"><Label className="text-xs">Dosagem</Label><Input value={med.dosagem} onChange={(e) => handleUpdateMedicamento(index, 'dosagem', e.target.value)} /></div>
                        <div className="space-y-1"><Label className="text-xs">Via</Label><Select value={med.via} onValueChange={(v) => handleUpdateMedicamento(index, 'via', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{VIAS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label className="text-xs">Frequência</Label><Select value={med.frequencia} onValueChange={(v) => handleUpdateMedicamento(index, 'frequencia', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{FREQUENCIAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label className="text-xs">Duração</Label><Input value={med.duracao} onChange={(e) => handleUpdateMedicamento(index, 'duracao', e.target.value)} /></div>
                        <div className="space-y-1"><Label className="text-xs">Quantidade</Label><Input value={med.quantidade} onChange={(e) => handleUpdateMedicamento(index, 'quantidade', e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <Label>Orientações Gerais</Label>
              <Textarea value={formData.orientacoes} onChange={(e) => setFormData({ ...formData, orientacoes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes</DialogTitle></DialogHeader>
          {selectedPrescricao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Paciente:</span><p className="font-medium">{getPacienteNome(selectedPrescricao.paciente_id)}</p></div>
                <div><span className="text-sm text-muted-foreground">Médico:</span><p className="font-medium">{getMedicoNome(selectedPrescricao.medico_id)}</p></div>
                <div><span className="text-sm text-muted-foreground">Data:</span><p>{format(new Date(selectedPrescricao.data), 'dd/MM/yyyy')}</p></div>
                <div><span className="text-sm text-muted-foreground">Tipo:</span><Badge className={cn(getTipoBadge(selectedPrescricao.tipo))}>{selectedPrescricao.tipo.replace('_', ' ')}</Badge></div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Medicamentos ({selectedPrescricao.medicamentos.length})</h4>
                <div className="space-y-2">
                  {selectedPrescricao.medicamentos.map((m: any, i: number) => (
                    <div key={i} className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium">{m.medicamento}</p>
                      <p className="text-sm text-muted-foreground">{m.dosagem} - {m.posologia}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
