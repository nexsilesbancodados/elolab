import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Printer, FileText, Calendar } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Paciente, User } from '@/types';
import { getAll, generateId } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

interface Atestado {
  id: string;
  tipo: 'comparecimento' | 'afastamento' | 'aptidao' | 'acompanhante';
  pacienteId: string;
  medicoId: string;
  data: string;
  dataAtendimento: string;
  diasAfastamento?: number;
  dataInicio?: string;
  dataFim?: string;
  incluirCid: boolean;
  cid?: string;
  observacoes: string;
  status: 'ativo' | 'cancelado';
  criadoEm: string;
}

const TIPOS_ATESTADO = [
  { value: 'comparecimento', label: 'Atestado de Comparecimento' },
  { value: 'afastamento', label: 'Atestado Médico (Afastamento)' },
  { value: 'aptidao', label: 'Atestado de Aptidão Física' },
  { value: 'acompanhante', label: 'Declaração de Acompanhante' },
];

export default function Atestados() {
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAtestado, setSelectedAtestado] = useState<Atestado | null>(null);
  const [formData, setFormData] = useState<Partial<Atestado>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAtestados(getAll<Atestado>('atestados'));
    setPacientes(getAll<Paciente>('pacientes'));
    setMedicos(getAll<User>('users').filter(u => u.role === 'medico'));
  };

  const filteredAtestados = atestados.filter(a => {
    const paciente = pacientes.find(p => p.id === a.pacienteId);
    return paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleNew = () => {
    setSelectedAtestado(null);
    setFormData({
      tipo: 'comparecimento',
      data: format(new Date(), 'yyyy-MM-dd'),
      dataAtendimento: format(new Date(), 'yyyy-MM-dd'),
      incluirCid: false,
      status: 'ativo',
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.medicoId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const allAtestados = getAll<Atestado>('atestados');
    const newAtestado: Atestado = {
      ...formData,
      id: generateId(),
      observacoes: formData.observacoes || '',
      criadoEm: new Date().toISOString(),
    } as Atestado;

    allAtestados.push(newAtestado);
    localStorage.setItem('elolab_clinic_atestados', JSON.stringify(allAtestados));
    loadData();
    setIsFormOpen(false);
    toast({
      title: 'Atestado emitido',
      description: 'O documento foi gerado com sucesso.',
    });
  };

  const handleView = (atestado: Atestado) => {
    setSelectedAtestado(atestado);
    setIsViewOpen(true);
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getMedicoNome = (id: string) => medicos.find(m => m.id === id)?.nome || 'Desconhecido';
  const getTipoLabel = (tipo: string) => TIPOS_ATESTADO.find(t => t.value === tipo)?.label || tipo;

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
              setFormData({ ...formData, tipo: tipo.value as any });
              handleNew();
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtestados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum atestado encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtestados.map((atestado) => (
                    <TableRow key={atestado.id}>
                      <TableCell>{format(new Date(atestado.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTipoLabel(atestado.tipo)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getPacienteNome(atestado.pacienteId)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getMedicoNome(atestado.medicoId)}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          atestado.status === 'ativo' && 'bg-green-100 text-green-800',
                          atestado.status === 'cancelado' && 'bg-red-100 text-red-800'
                        )}>
                          {atestado.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(atestado)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
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
                value={formData.pacienteId}
                onValueChange={(v) => setFormData({ ...formData, pacienteId: v })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Atendimento</Label>
                <Input
                  type="date"
                  value={formData.dataAtendimento}
                  onChange={(e) => setFormData({ ...formData, dataAtendimento: e.target.value })}
                />
              </div>
              {formData.tipo === 'afastamento' && (
                <div className="space-y-2">
                  <Label>Dias de Afastamento</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.diasAfastamento || ''}
                    onChange={(e) => setFormData({ ...formData, diasAfastamento: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {formData.tipo === 'afastamento' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="incluirCid"
                  checked={formData.incluirCid}
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
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
                  <p className="font-medium">{format(new Date(selectedAtestado.data), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{getPacienteNome(selectedAtestado.pacienteId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Médico</p>
                  <p className="font-medium">{getMedicoNome(selectedAtestado.medicoId)}</p>
                </div>
                {selectedAtestado.diasAfastamento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dias de Afastamento</p>
                    <p className="font-medium">{selectedAtestado.diasAfastamento} dias</p>
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
            <Button>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
