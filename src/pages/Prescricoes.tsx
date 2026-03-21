import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import {
  Pill, Plus, Search, Eye, FileDown, ExternalLink, Clipboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePacientes, useMedicos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { supabase } from '@/integrations/supabase/client';

/* ─── PDF Builder ─── */
function buildReceitaPdf(data: {
  pacienteNome: string;
  cpf: string;
  dataEmissao: string;
  medicoNome: string;
  crm: string;
  especialidade: string;
  medicamentosTexto: string;
}): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = 210;
  const margin = 20;

  // ── Border ──
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.7);
  doc.rect(10, 10, w - 20, 277);

  // ── Header / letterhead ──
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 204);
  doc.text('EloLab Clínica Médica', w / 2, 25, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Av. Principal, 1000 — Centro — São Paulo/SP', w / 2, 31, { align: 'center' });
  doc.text('Tel: (11) 3000-0000 | CNPJ: 00.000.000/0001-00', w / 2, 36, { align: 'center' });

  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.4);
  doc.line(margin, 42, w - margin, 42);

  // ── Title ──
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEITUÁRIO MÉDICO', w / 2, 52, { align: 'center' });

  // ── Patient info ──
  let y = 64;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const addField = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + doc.getTextWidth(label) + 2, y);
    y += 6;
  };

  addField('Paciente: ', data.pacienteNome);
  if (data.cpf) addField('CPF: ', data.cpf);
  addField('Data: ', data.dataEmissao);

  y += 4;
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(margin, y, w - margin, y);
  y += 8;

  // ── Medications ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Medicamentos e Posologia', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(data.medicamentosTexto, w - margin * 2);
  for (const line of lines) {
    if (y > 240) {
      doc.addPage();
      y = 25;
    }
    doc.text(line, margin, y);
    y += 5.5;
  }

  // ── Doctor signature area ──
  y = Math.max(y + 20, 210);
  if (y > 250) { doc.addPage(); y = 60; }

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 40, y, w / 2 + 40, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.medicoNome, w / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CRM: ${data.crm}${data.especialidade ? ` — ${data.especialidade}` : ''}`, w / 2, y, { align: 'center' });

  // ── Footer — digital signature notice ──
  const footerY = 280;
  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.text(
    'Documento assinado digitalmente. Valide a autenticidade em assinaturadigital.iti.gov.br',
    w / 2, footerY, { align: 'center' },
  );
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    w / 2, footerY + 4, { align: 'center' },
  );
  doc.setTextColor(0);

  return doc;
}

/* ─── Component ─── */
export default function Prescricoes() {
  
  const { data: pacientes = [], isLoading: loadingPac } = usePacientes();
  const { data: medicos = [], isLoading: loadingMed } = useMedicos();
  const { medicoId, isMedicoOnly } = useCurrentMedico();

  const { data: prescricoes = [], isLoading: loadingPresc, refetch } = useSupabaseQuery<Record<string, any>>('prescricoes', {
    orderBy: { column: 'created_at', ascending: false },
    ...(isMedicoOnly && medicoId ? { filters: [{ column: 'medico_id', operator: 'eq', value: medicoId }] } : {}),
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');

  const [form, setForm] = useState({
    paciente_id: '',
    medico_id: medicoId || '',
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    medicamentos_texto: '',
  });

  const selectedPaciente = useMemo(() => pacientes.find(p => p.id === form.paciente_id), [pacientes, form.paciente_id]);

  const filteredPrescricoes = useMemo(() => {
    if (!searchTerm) return prescricoes;
    const lower = searchTerm.toLowerCase();
    return prescricoes.filter(p => {
      const pac = pacientes.find(x => x.id === p.paciente_id);
      return pac?.nome?.toLowerCase().includes(lower);
    });
  }, [prescricoes, pacientes, searchTerm]);

  const handleOpen = () => {
    setForm({ paciente_id: '', medico_id: medicoId || '', data_emissao: format(new Date(), 'yyyy-MM-dd'), medicamentos_texto: '' });
    setIsFormOpen(true);
  };

  const handleSaveAndGenerate = async () => {
    if (!form.paciente_id || !form.medico_id || !form.medicamentos_texto.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    const paciente = pacientes.find(p => p.id === form.paciente_id);
    const medico = medicos.find(m => m.id === form.medico_id);
    if (!paciente || !medico) return;

    // Save to database
    await supabase.from('prescricoes').insert({
      paciente_id: form.paciente_id,
      medico_id: form.medico_id,
      medicamento: form.medicamentos_texto.slice(0, 100),
      posologia: form.medicamentos_texto,
      data_emissao: form.data_emissao,
      tipo: 'simples',
    });
    refetch();

    // Generate PDF
    const doc = buildReceitaPdf({
      pacienteNome: paciente.nome,
      cpf: paciente.cpf || '',
      dataEmissao: format(new Date(form.data_emissao + 'T12:00:00'), 'dd/MM/yyyy'),
      medicoNome: medico.nome || medico.crm,
      crm: medico.crm,
      especialidade: medico.especialidade || '',
      medicamentosTexto: form.medicamentos_texto,
    });

    const blob = doc.output('blob');
    const safeName = paciente.nome.replace(/\s+/g, '_').slice(0, 25);
    setPdfBlob(blob);
    setPdfFileName(`receita_${safeName}_${form.data_emissao}.pdf`);
    setIsFormOpen(false);
    setIsResultOpen(true);
    toast.success('Receita gerada com sucesso!');
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenAssinador = () => {
    window.open('https://assinaturadigital.iti.gov.br/', '_blank');
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || '—';
  const getMedicoNome = (id: string) => { const m = medicos.find(x => x.id === id); return m ? `Dr(a). ${m.nome || m.crm}` : '—'; };

  if (loadingPac || loadingMed || loadingPresc) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            Prescrições
          </h1>
          <p className="text-muted-foreground">Receituário digital com assinatura via ITI</p>
        </div>
        <Button onClick={handleOpen} className="gap-2"><Plus className="h-4 w-4" />Nova Prescrição</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total', value: prescricoes.length, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Hoje', value: prescricoes.filter(p => p.data_emissao === format(new Date(), 'yyyy-MM-dd')).length, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          { label: 'Pacientes', value: new Set(prescricoes.map(p => p.paciente_id)).size, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('border', s.border)}>
              <CardContent className="py-4 px-5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={cn('text-2xl font-black mt-0.5 tabular-nums', s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Histórico</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
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
                  <TableHead className="hidden sm:table-cell">Medicamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescricoes.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <Pill className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground">Nenhuma prescrição</p>
                      <p className="text-sm text-muted-foreground mt-1">Crie sua primeira prescrição médica</p>
                    </div>
                  </TableCell></TableRow>
                ) : filteredPrescricoes.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.data_emissao ? format(new Date(p.data_emissao + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="font-medium">{getPacienteNome(p.paciente_id)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getMedicoNome(p.medico_id)}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{p.medicamento || p.posologia || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── New Prescription Dialog ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" />Nova Prescrição</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={form.paciente_id} onValueChange={v => setForm(f => ({ ...f, paciente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}{p.cpf ? ` — ${p.cpf}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaciente?.cpf && (
                <p className="text-xs text-muted-foreground">CPF: {selectedPaciente.cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Médico Prescritor *</Label>
              <Select value={form.medico_id} onValueChange={v => setForm(f => ({ ...f, medico_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                <SelectContent>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome || m.crm} — CRM {m.crm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Emissão</Label>
              <Input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Medicamentos e Posologia *</Label>
              <Textarea
                placeholder={`1) Amoxicilina 500mg — Tomar 1 cápsula de 8/8h por 7 dias\n2) Ibuprofeno 400mg — Tomar 1 comprimido de 12/12h por 5 dias\n3) Omeprazol 20mg — Tomar 1 cápsula em jejum por 30 dias`}
                value={form.medicamentos_texto}
                onChange={e => setForm(f => ({ ...f, medicamentos_texto: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAndGenerate} className="gap-2">
              <FileDown className="h-4 w-4" />Gerar Receita PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Result Dialog (Download + Assinar) ── */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <Clipboard className="h-5 w-5 text-primary" />
              Receita Gerada!
            </DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground text-sm">
            O PDF da receita está pronto. Baixe o arquivo e, em seguida, assine digitalmente gratuitamente pelo portal do ITI (Gov.br).
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={handleDownload} size="lg" className="gap-2 w-full">
              <FileDown className="h-5 w-5" />Baixar Receita PDF
            </Button>

            <Button onClick={handleOpenAssinador} variant="premium" size="lg" className="gap-2 w-full">
              <ExternalLink className="h-5 w-5" />Ir para Assinador Digital (Grátis)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            O assinador digital do ITI utiliza certificado ICP-Brasil via Gov.br, sem custo adicional.
          </p>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
