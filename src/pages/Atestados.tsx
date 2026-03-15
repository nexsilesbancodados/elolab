import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Printer, FileText, Loader2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { usePacientes, useMedicos, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { gerarAtestado, openPDF } from '@/lib/pdfGenerator';
import { Skeleton } from '@/components/ui/skeleton';

interface Atestado {
  id: string;
  tipo: string | null;
  paciente_id: string;
  medico_id: string;
  data_emissao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  dias: number | null;
  motivo: string | null;
  cid: string | null;
  observacoes: string | null;
  created_at: string | null;
}

const TIPOS_ATESTADO = [
  { value: 'comparecimento', label: 'Atestado de Comparecimento' },
  { value: 'afastamento', label: 'Atestado Médico (Afastamento)' },
  { value: 'aptidao', label: 'Atestado de Aptidão Física' },
  { value: 'acompanhante', label: 'Declaração de Acompanhante' },
];

export default function Atestados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAtestado, setSelectedAtestado] = useState<Atestado | null>(null);
  const [formData, setFormData] = useState<Partial<Atestado & { incluirCid: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const { medicoId, isMedicoOnly } = useCurrentMedico();
  const { data: atestados = [], isLoading: loadingAtestados } = useSupabaseQuery<Atestado>('atestados', {
    orderBy: { column: 'created_at', ascending: false },
    ...(isMedicoOnly && medicoId ? { filters: [{ column: 'medico_id', operator: 'eq', value: medicoId }] } : {}),
  });
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();

  const isLoading = loadingAtestados || loadingPacientes || loadingMedicos;

  const filteredAtestados = useMemo(() => {
    return atestados.filter(a => {
      const paciente = pacientes.find(p => p.id === a.paciente_id);
      return paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [atestados, pacientes, searchTerm]);

  const handleNew = () => {
    setSelectedAtestado(null);
    setFormData({
      tipo: 'comparecimento',
      data_emissao: format(new Date(), 'yyyy-MM-dd'),
      incluirCid: false,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.medico_id) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('atestados').insert({
        tipo: formData.tipo,
        paciente_id: formData.paciente_id,
        medico_id: formData.medico_id,
        data_emissao: formData.data_emissao,
        data_inicio: formData.data_inicio,
        dias: formData.dias,
        cid: formData.incluirCid ? formData.cid : null,
        observacoes: formData.observacoes,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['atestados'] });
      setIsFormOpen(false);
      toast.success('Atestado emitido com sucesso.');
    } catch (error) {
      console.error('Error saving atestado:', error);
      toast.error('Erro ao emitir atestado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = (atestado: Atestado) => {
    setSelectedAtestado(atestado);
    setIsViewOpen(true);
  };

  const handlePrint = (atestado: Atestado) => {
    const paciente = pacientes.find(p => p.id === atestado.paciente_id);
    const medico = medicos.find(m => m.id === atestado.medico_id);
    
    if (!paciente || !medico) {
      toast.error('Dados do paciente ou médico não encontrados.');
      return;
    }

    const doc = gerarAtestado(
      { nome: paciente.nome, cpf: paciente.cpf || '' },
      { nome: medico.crm, crm: medico.crm, especialidade: medico.especialidade || '' },
      {
        tipo: atestado.tipo as any,
        dataAtendimento: atestado.data_emissao || '',
        diasAfastamento: atestado.dias || undefined,
        cid: atestado.cid || undefined,
        observacoes: atestado.observacoes || '',
      }
    );
    openPDF(doc);
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => {
    const medico = medicos.find(m => m.id === id);
    return medico ? `Dr(a). ${medico.crm}` : 'Desconhecido';
  };
  const getTipoLabel = (tipo: string | null) => TIPOS_ATESTADO.find(t => t.value === tipo)?.label || tipo;

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
          <h1 className="text-3xl font-bold text-foreground">Atestados e Documentos</h1>
          <p className="text-muted-foreground">Emissão de atestados e declarações médicas</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Atestado
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIPOS_ATESTADO.map((tipo) => (
          <Card
            key={tipo.value}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setFormData({ tipo: tipo.value, data_emissao: format(new Date(), 'yyyy-MM-dd'), incluirCid: false });
              setIsFormOpen(true);
            }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium">{tipo.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Documentos Emitidos</CardTitle>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Médico</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtestados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum atestado encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtestados.map((atestado) => (
                    <TableRow key={atestado.id}>
                      <TableCell>{atestado.data_emissao ? format(new Date(atestado.data_emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTipoLabel(atestado.tipo)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getPacienteNome(atestado.paciente_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(atestado.medico_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(atestado)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(atestado)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir Atestado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ATESTADO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id || ''}
                onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Médico *</Label>
              <Select
                value={formData.medico_id || ''}
                onValueChange={(v) => setFormData({ ...formData, medico_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.crm} - {m.especialidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Atendimento</Label>
                <Input
                  type="date"
                  value={formData.data_emissao || ''}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                />
              </div>
              {formData.tipo === 'afastamento' && (
                <div className="space-y-2">
                  <Label>Dias de Afastamento</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.dias || ''}
                    onChange={(e) => setFormData({ ...formData, dias: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {formData.tipo === 'afastamento' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="incluirCid"
                  checked={formData.incluirCid || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, incluirCid: checked as boolean })}
                />
                <Label htmlFor="incluirCid" className="text-sm">Incluir CID-10 no documento</Label>
              </div>
            )}

            {formData.incluirCid && (
              <div className="space-y-2">
                <Label>CID-10</Label>
                <Input
                  value={formData.cid || ''}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  placeholder="Ex: J11 - Influenza"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Emitir Atestado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Atestado</DialogTitle>
          </DialogHeader>
          {selectedAtestado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{getTipoLabel(selectedAtestado.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{selectedAtestado.data_emissao ? format(new Date(selectedAtestado.data_emissao), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{getPacienteNome(selectedAtestado.paciente_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Médico</p>
                  <p className="font-medium">{getMedicoNome(selectedAtestado.medico_id)}</p>
                </div>
                {selectedAtestado.dias && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dias de Afastamento</p>
                    <p className="font-medium">{selectedAtestado.dias} dias</p>
                  </div>
                )}
              </div>
              {selectedAtestado.observacoes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedAtestado.observacoes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
            {selectedAtestado && (
              <Button onClick={() => handlePrint(selectedAtestado)}>
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
