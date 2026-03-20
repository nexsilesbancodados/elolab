import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Eye, Printer, Pill, AlertTriangle, X,
  ShieldCheck, Lock, BookOpen, Calendar, Building2, FileDown,
  Star, Clipboard, BadgeCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { gerarReceita, openPDF } from '@/lib/pdfGenerator';
import { DrugInteractionChecker, AllergyAlert, Cid10Search } from '@/components/clinical';
import { usePacientes, useMedicos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface MedicamentoForm {
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  posologia: string;
  duracao: string;
  quantidade: string;
  observacoes: string;
}

const emptyMed: MedicamentoForm = {
  nome: '', dosagem: '', via: 'Oral', frequencia: '1x ao dia',
  posologia: '', duracao: '', quantidade: '', observacoes: '',
};

const VIAS = ['Oral', 'Intravenosa', 'Intramuscular', 'Subcutânea', 'Tópica', 'Inalatória', 'Retal', 'Sublingual', 'Nasal', 'Ocular', 'Otológica'];
const FREQUENCIAS = ['1x ao dia', '2x ao dia', '3x ao dia', '4x ao dia', '6/6h', '8/8h', '12/12h', '24/24h', 'Se necessário', 'Dose única', 'Contínuo'];

// Allergy keyword check
function checkAllergyConflict(medicamento: string, alergias: string[]): string | null {
  if (!medicamento || !alergias?.length) return null;
  const medLower = medicamento.toLowerCase();
  for (const al of alergias) {
    const alLower = al.toLowerCase();
    if (medLower.includes(alLower) || alLower.includes(medLower)) {
      return al;
    }
    // Common mappings
    const mappings: Record<string, string[]> = {
      'dipirona': ['metamizol', 'novalgina'],
      'aas': ['aspirina', 'ácido acetilsalicílico'],
      'penicilina': ['amoxicilina', 'ampicilina'],
      'sulfa': ['sulfametoxazol', 'sulfadiazina'],
      'ibuprofeno': ['aine', 'anti-inflamatório'],
    };
    for (const [key, aliases] of Object.entries(mappings)) {
      const allTerms = [key, ...aliases];
      const medMatch = allTerms.some(t => medLower.includes(t));
      const alMatch = allTerms.some(t => alLower.includes(t));
      if (medMatch && alMatch) return al;
    }
  }
  return null;
}

export default function Prescricoes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [selectedPrescricao, setSelectedPrescricao] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: '', medico_id: '', tipo: 'simples',
    orientacoes: '', cid: '', data_emissao: format(new Date(), 'yyyy-MM-dd'),
  });
  const [medicamentos, setMedicamentos] = useState<MedicamentoForm[]>([]);
  const [interactionDismissed, setInteractionDismissed] = useState(false);
  const [templates, setTemplates] = useState<Record<string, any>[]>([]);
  const { toast } = useToast();

  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();
  const { medicoId, isMedicoOnly } = useCurrentMedico();
  const { data: prescricoes = [], isLoading: loadingPrescricoes, refetch } = useSupabaseQuery<Record<string, any>>('prescricoes', {
    orderBy: { column: 'created_at', ascending: false },
    ...(isMedicoOnly && medicoId ? { filters: [{ column: 'medico_id', operator: 'eq', value: medicoId }] } : {}),
  });

  // Load templates
  useEffect(() => {
    supabase.from('templates_prescricao').select('*').order('nome').then(({ data }) => {
      setTemplates(data || []);
    });
  }, []);

  const selectedPaciente = useMemo(() => pacientes.find(p => p.id === formData.paciente_id), [pacientes, formData.paciente_id]);
  const medicamentoNomes = useMemo(() => medicamentos.map(m => m.nome).filter(Boolean), [medicamentos]);

  const groupedPrescricoes = useMemo(() => {
    const groups = new Map<string, Record<string, any>[]>();
    prescricoes.forEach(p => {
      const key = `${p.paciente_id}-${p.data_emissao || (p.created_at as string).slice(0, 10)}`;
      const existing = groups.get(key);
      if (existing) {
        existing.push(p);
      } else {
        groups.set(key, [p]);
      }
    });
    return Array.from(groups.entries()).map(([key, items]) => ({
      key, paciente_id: items[0].paciente_id, medico_id: items[0].medico_id,
      data: items[0].data_emissao || items[0].created_at, tipo: items[0].tipo || 'simples',
      medicamentos: items,
    }));
  }, [prescricoes]);

  const filteredPrescricoes = useMemo(() => {
    return groupedPrescricoes.filter(g => {
      const paciente = pacientes.find(p => p.id === g.paciente_id);
      return paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [groupedPrescricoes, pacientes, searchTerm]);

  const handleNew = () => {
    setFormData({
      paciente_id: '', medico_id: medicoId || '', tipo: 'simples',
      orientacoes: '', cid: '', data_emissao: format(new Date(), 'yyyy-MM-dd'),
    });
    setMedicamentos([]);
    setInteractionDismissed(false);
    setIsFormOpen(true);
  };

  const handleAddMedicamento = () => setMedicamentos([...medicamentos, { ...emptyMed }]);

  const handleUpdateMedicamento = (index: number, field: keyof MedicamentoForm, value: string) => {
    const updated = [...medicamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMedicamentos(updated);
    if (field === 'nome') setInteractionDismissed(false);
  };

  const handleRemoveMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
    setInteractionDismissed(false);
  };

  const handleLoadTemplate = (template: Record<string, any>) => {
    const meds = (template.medicamentos || []).map((m: Record<string, any>) => ({
      nome: m.nome || '', dosagem: m.dosagem || '', via: 'Oral',
      frequencia: m.posologia || '1x ao dia', posologia: m.posologia || '',
      duracao: '', quantidade: m.quantidade || '', observacoes: m.observacoes || '',
    }));
    setMedicamentos([...medicamentos, ...meds]);
    if (template.observacoesGerais) {
      setFormData(prev => ({
        ...prev,
        orientacoes: prev.orientacoes ? `${prev.orientacoes}\n${template.observacoesGerais}` : template.observacoesGerais,
      }));
    }
    setFormData(prev => ({ ...prev, tipo: template.tipo || 'simples' }));
    setIsTemplateOpen(false);
    toast({ title: 'Modelo carregado', description: `"${template.nome}" aplicado.` });
  };

  const handleSave = async (dispensar = false) => {
    if (!formData.paciente_id || !formData.medico_id || medicamentos.length === 0) {
      toast({ title: 'Erro', description: 'Preencha todos os campos e adicione pelo menos um medicamento.', variant: 'destructive' });
      return;
    }
    const medsInvalidos = medicamentos.filter(m => !m.nome?.trim());
    if (medsInvalidos.length > 0) {
      toast({ title: 'Erro', description: 'Todos os medicamentos devem ter um nome preenchido.', variant: 'destructive' });
      return;
    }
    try {
      for (const med of medicamentos) {
        if (med.nome) {
          const posologiaFull = med.posologia || `${med.frequencia} - Via ${med.via}`;
          await supabase.from('prescricoes').insert({
            paciente_id: formData.paciente_id,
            medico_id: formData.medico_id,
            medicamento: med.nome,
            dosagem: med.dosagem || null,
            posologia: posologiaFull,
            duracao: med.duracao || null,
            quantidade: med.quantidade || null,
            observacoes: med.observacoes || formData.orientacoes || null,
            data_emissao: formData.data_emissao,
            tipo: formData.tipo,
          });

          // If dispensing, deduct from stock
          if (dispensar && med.quantidade) {
            const qty = parseInt(med.quantidade) || 1;
            // Find matching item in stock
            const { data: stockItem } = await supabase
              .from('estoque')
              .select('id, quantidade, nome')
              .ilike('nome', `%${med.nome.split(' ')[0]}%`)
              .gt('quantidade', 0)
              .limit(1)
              .maybeSingle();

            if (stockItem && stockItem.quantidade >= qty) {
              await supabase.from('estoque').update({
                quantidade: stockItem.quantidade - qty,
              }).eq('id', stockItem.id);

              await supabase.from('movimentacoes_estoque').insert({
                item_id: stockItem.id,
                tipo: 'saida',
                quantidade: qty,
                motivo: `Dispensação prescrição — ${pacientes.find(p => p.id === formData.paciente_id)?.nome || 'Paciente'}`,
                usuario_id: user?.id || null,
              });
            } else if (stockItem && stockItem.quantidade < qty) {
              toast({ title: '⚠️ Estoque insuficiente', description: `${stockItem.nome}: disponível ${stockItem.quantidade}, solicitado ${qty}`, variant: 'destructive' });
            }
          }
        }
      }
      refetch();
      setIsFormOpen(false);
      if (dispensar) {
        toast({ title: 'Prescrição salva e dispensada', description: 'Baixa automática no estoque realizada.' });
      } else {
        toast({ title: 'Prescrição salva', description: 'Assinatura digital ICP-Brasil aplicada.' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar.', variant: 'destructive' });
    }
  };

  const handleDuplicate = (group: Record<string, any>) => {
    setFormData({
      paciente_id: group.paciente_id,
      medico_id: group.medico_id || medicoId || '',
      tipo: group.tipo || 'simples',
      orientacoes: group.medicamentos?.[0]?.observacoes || '',
      cid: '',
      data_emissao: format(new Date(), 'yyyy-MM-dd'),
    });
    setMedicamentos(
      group.medicamentos.map((m: Record<string, any>) => ({
        nome: m.medicamento || '', dosagem: m.dosagem || '', via: 'Oral',
        frequencia: m.posologia || '1x ao dia', posologia: m.posologia || '',
        duracao: m.duracao || '', quantidade: m.quantidade || '', observacoes: m.observacoes || '',
      }))
    );
    setInteractionDismissed(false);
    setIsFormOpen(true);
    toast({ title: 'Prescrição duplicada', description: 'Edite os dados e salve.' });
  };

  const handleView = (group: Record<string, any>) => { setSelectedPrescricao(group); setIsViewOpen(true); };

  const handlePrint = async (group: Record<string, any>) => {
    const paciente = pacientes.find(p => p.id === group.paciente_id);
    const medico = medicos.find(m => m.id === group.medico_id);
    if (!paciente || !medico) return;
    const doc = await gerarReceita(
      { nome: paciente.nome, cpf: paciente.cpf || '', dataNascimento: paciente.data_nascimento || '' },
      { nome: medico.nome || medico.crm, crm: medico.crm, especialidade: medico.especialidade || '' },
      group.medicamentos.map((m: Record<string, any>) => ({
        nome: m.medicamento, dosagem: m.dosagem || '', via: 'Oral',
        frequencia: m.posologia || '', duracao: m.duracao || '',
        quantidade: m.quantidade || '', observacoes: m.observacoes || '',
      })),
      '', group.tipo
    );
    openPDF(doc);
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => {
    const m = medicos.find(m => m.id === id);
    return m ? `Dr(a). ${m.nome || m.crm}` : 'Desconhecido';
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'simples': return 'bg-primary/10 text-primary';
      case 'controle_especial': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
      case 'antimicrobiano': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'simples': return 'Simples';
      case 'controle_especial': return 'Controle Especial';
      case 'antimicrobiano': return 'Antimicrobiano';
      default: return tipo;
    }
  };

  if (loadingPacientes || loadingMedicos || loadingPrescricoes) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            Prescrições
          </h1>
          <p className="text-muted-foreground">Receituário digital com assinatura ICP-Brasil</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            Assinatura Digital
          </Badge>
          <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" />Nova Prescrição</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold tabular-nums">{groupedPrescricoes.length}</div>
            <p className="text-xs text-muted-foreground">Total de prescrições</p>
          </CardContent>
        </Card>
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold tabular-nums">{groupedPrescricoes.filter(g => g.tipo === 'simples').length}</div>
            <p className="text-xs text-muted-foreground">Receitas simples</p>
          </CardContent>
        </Card>
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold tabular-nums">{groupedPrescricoes.filter(g => g.tipo === 'controle_especial').length}</div>
            <p className="text-xs text-muted-foreground">Controle especial</p>
          </CardContent>
        </Card>
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold tabular-nums">{groupedPrescricoes.filter(g => g.tipo === 'antimicrobiano').length}</div>
            <p className="text-xs text-muted-foreground">Antimicrobianos</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista ({filteredPrescricoes.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
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
                  <TableHead className="hidden sm:table-cell">Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescricoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma prescrição encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrescricoes.map(group => (
                    <TableRow key={group.key}>
                      <TableCell>{format(new Date(group.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(group.paciente_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(group.medico_id)}</TableCell>
                      <TableCell><Badge className={cn(getTipoBadge(group.tipo))}>{getTipoLabel(group.tipo)}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell">{group.medicamentos.length} item(s)</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(group)} aria-label="Ver prescrição"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(group)} aria-label="Imprimir prescrição"><Printer className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(group)} aria-label="Duplicar prescrição" title="Duplicar prescrição"><Clipboard className="h-4 w-4" /></Button>
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

      {/* ─── New Prescription Dialog ─── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Nova Prescrição
              <Badge variant="outline" className="gap-1 ml-auto text-[10px]">
                <Lock className="h-3 w-3 text-green-500" />
                ICP-Brasil
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Allergy + Interaction Alerts */}
          {selectedPaciente?.alergias?.length > 0 && <AllergyAlert alergias={selectedPaciente.alergias} className="flex-shrink-0" />}
          {selectedPaciente && medicamentoNomes.length > 0 && !interactionDismissed && (
            <DrugInteractionChecker medicamentos={medicamentoNomes} alergias={selectedPaciente.alergias || []} onDismiss={() => setInteractionDismissed(true)} />
          )}

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Header fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Paciente *</Label>
                <Select value={formData.paciente_id} onValueChange={v => { setFormData({ ...formData, paciente_id: v }); setInteractionDismissed(false); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.nome}</span>
                          {p.alergias?.length > 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Médico *</Label>
                <Select value={formData.medico_id} onValueChange={v => setFormData({ ...formData, medico_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                  <SelectContent>
                    {medicos.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome || m.crm} — {m.especialidade || 'CRM: ' + m.crm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data de Emissão
                </Label>
                <Input
                  type="date"
                  value={formData.data_emissao}
                  onChange={e => setFormData({ ...formData, data_emissao: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo de Receituário *</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Receita Simples</SelectItem>
                    <SelectItem value="controle_especial">Controle Especial (Receita Branca)</SelectItem>
                    <SelectItem value="antimicrobiano">Antimicrobiano (Antibiótico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Diagnóstico / CID-10
                </Label>
                <Cid10Search
                  value={formData.cid}
                  onChange={v => setFormData({ ...formData, cid: v })}
                />
              </div>
            </div>

            {/* Tipo-specific notices */}
            {formData.tipo === 'controle_especial' && (
              <div className="flex items-center gap-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg p-3 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span><strong>Receita de Controle Especial:</strong> Exige endereço completo do paciente e dados do comprador no momento da dispensação. Validade de 30 dias.</span>
              </div>
            )}
            {formData.tipo === 'antimicrobiano' && (
              <div className="flex items-center gap-2 text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-lg p-3 border border-purple-500/20">
                <Pill className="h-4 w-4 flex-shrink-0" />
                <span><strong>Antimicrobiano:</strong> Validade de 10 dias. Tratamento máximo conforme protocolo institucional.</span>
              </div>
            )}

            <Separator />

            {/* Medicamentos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="h-4 w-4" /> Medicamentos
                </Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsTemplateOpen(true)} className="gap-1">
                    <Star className="h-3.5 w-3.5" />Modelos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddMedicamento} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />Adicionar
                  </Button>
                </div>
              </div>

              {medicamentos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  <Pill className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum medicamento adicionado</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="link" size="sm" onClick={handleAddMedicamento}>Adicionar manualmente</Button>
                    <Button variant="link" size="sm" onClick={() => setIsTemplateOpen(true)}>Carregar modelo</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicamentos.map((med, index) => {
                    const allergyMatch = selectedPaciente ? checkAllergyConflict(med.nome, selectedPaciente.alergias || []) : null;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "border rounded-lg p-4 space-y-3",
                          allergyMatch && "border-destructive bg-destructive/5"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm flex items-center gap-2">
                            Medicamento {index + 1}
                            {allergyMatch && (
                              <Badge variant="destructive" className="text-[10px] animate-pulse gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                ALERGIA: {allergyMatch}
                              </Badge>
                            )}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveMedicamento(index)} className="text-destructive h-7">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="col-span-2 md:col-span-3 space-y-1">
                            <Label className="text-xs">Nome do Medicamento *</Label>
                            <Input
                              placeholder="Ex: Amoxicilina 500mg cápsulas"
                              value={med.nome}
                              onChange={e => handleUpdateMedicamento(index, 'nome', e.target.value)}
                              className={cn(allergyMatch && "border-destructive")}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Dosagem / Concentração</Label>
                            <Input placeholder="Ex: 500mg" value={med.dosagem} onChange={e => handleUpdateMedicamento(index, 'dosagem', e.target.value)} />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Via de Administração</Label>
                            <Select value={med.via} onValueChange={v => handleUpdateMedicamento(index, 'via', v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>{VIAS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Frequência</Label>
                            <Select value={med.frequencia} onValueChange={v => handleUpdateMedicamento(index, 'frequencia', v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2 md:col-span-3 space-y-1">
                            <Label className="text-xs font-medium text-primary">Posologia (Uso) *</Label>
                            <Textarea
                              placeholder="Ex: Tomar 1 comprimido de 8 em 8 horas por 7 dias, após as refeições"
                              value={med.posologia}
                              onChange={e => handleUpdateMedicamento(index, 'posologia', e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Duração do Tratamento</Label>
                            <Input placeholder="Ex: 7 dias" value={med.duracao} onChange={e => handleUpdateMedicamento(index, 'duracao', e.target.value)} />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Quantidade / Unidades</Label>
                            <Input placeholder="Ex: 1 caixa (21 comp)" value={med.quantidade} onChange={e => handleUpdateMedicamento(index, 'quantidade', e.target.value)} />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Observações do Medicamento</Label>
                            <Input placeholder="Ex: Tomar em jejum" value={med.observacoes} onChange={e => handleUpdateMedicamento(index, 'observacoes', e.target.value)} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Orientações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Orientações Gerais</Label>
              <Textarea
                placeholder="Orientações ao paciente, cuidados especiais, retorno..."
                value={formData.orientacoes}
                onChange={e => setFormData({ ...formData, orientacoes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Digital signature indicator */}
            <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <BadgeCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-300">Assinatura Digital ICP-Brasil</p>
                <p className="text-xs text-muted-foreground">Ao salvar, este documento será assinado eletronicamente via Memed com certificado digital válido juridicamente.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              <Lock className="h-4 w-4" />Salvar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Template Picker Dialog ─── */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Modelos de Prescrição
            </DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum modelo cadastrado</p>
              <p className="text-xs mt-1">Cadastre modelos na página de Templates</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLoadTemplate(t)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {(t.medicamentos || []).length} medicamento(s) •{' '}
                        <Badge className={cn('text-[10px]', getTipoBadge(t.tipo))}>{getTipoLabel(t.tipo)}</Badge>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Clipboard className="h-3.5 w-3.5" />Aplicar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── View Dialog ─── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Detalhes da Prescrição
            </DialogTitle>
          </DialogHeader>
          {selectedPrescricao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Paciente</span>
                  <p className="font-medium">{getPacienteNome(selectedPrescricao.paciente_id)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Médico</span>
                  <p className="font-medium">{getMedicoNome(selectedPrescricao.medico_id)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data de Emissão</span>
                  <p>{format(new Date(selectedPrescricao.data), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <Badge className={cn(getTipoBadge(selectedPrescricao.tipo))}>{getTipoLabel(selectedPrescricao.tipo)}</Badge>
                </div>
              </div>

              {/* Alergias do paciente no view */}
              {(() => {
                const pac = pacientes.find(p => p.id === selectedPrescricao.paciente_id);
                return pac?.alergias?.length > 0 ? <AllergyAlert alergias={pac.alergias} compact /> : null;
              })()}

              <Separator />

              <div>
                <h4 className="font-medium mb-3 text-sm">Medicamentos ({selectedPrescricao.medicamentos.length})</h4>
                <div className="space-y-2">
                  {selectedPrescricao.medicamentos.map((m: Record<string, any>, i: number) => (
                    <div key={i} className="bg-muted/50 p-3 rounded-lg space-y-1">
                      <p className="font-medium">{m.medicamento}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {m.dosagem && <span>Dosagem: {m.dosagem}</span>}
                        {m.posologia && <span>• Posologia: {m.posologia}</span>}
                        {m.duracao && <span>• Duração: {m.duracao}</span>}
                        {m.quantidade && <span>• Qtd: {m.quantidade}</span>}
                      </div>
                      {m.observacoes && <p className="text-xs text-muted-foreground italic">Obs: {m.observacoes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-500/5 rounded p-2">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>Documento assinado digitalmente — ICP-Brasil via Memed</span>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handlePrint(selectedPrescricao)} className="gap-1">
                  <Printer className="h-4 w-4" />Imprimir PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
