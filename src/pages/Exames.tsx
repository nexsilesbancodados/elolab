import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, FileText, Loader2, PlusCircle } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePacientes, useMedicos } from '@/hooks/useSupabaseData';
import { useCurrentMedico } from '@/hooks/useCurrentMedico';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Database } from '@/integrations/supabase/types';

type StatusExame = Database['public']['Enums']['status_exame'];

const STATUS_COLORS: Record<StatusExame, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  realizado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  laudo_disponivel: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelado: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<StatusExame, string> = {
  solicitado: 'Solicitado',
  agendado: 'Agendado',
  realizado: 'Realizado',
  laudo_disponivel: 'Laudo Disponível',
  cancelado: 'Cancelado',
};

const TIPOS_EXAME_DEFAULT = [
  // Hematologia
  'Hemograma Completo',
  'Coagulograma',
  'VHS',
  'Reticulócitos',
  'Tipagem Sanguínea (ABO/Rh)',
  // Bioquímica
  'Glicemia em Jejum',
  'Glicemia Pós-Prandial',
  'Hemoglobina Glicada (HbA1c)',
  'Curva Glicêmica',
  'Colesterol Total e Frações',
  'Triglicerídeos',
  'Ureia',
  'Creatinina',
  'Ácido Úrico',
  'TGO (AST)',
  'TGP (ALT)',
  'Gama GT',
  'Fosfatase Alcalina',
  'Bilirrubinas (Total e Frações)',
  'Proteínas Totais e Frações',
  'Albumina',
  'Amilase',
  'Lipase',
  'LDH (Desidrogenase Láctica)',
  'CPK (Creatinoquinase)',
  'Ferro Sérico',
  'Ferritina',
  'Transferrina',
  'Cálcio Total',
  'Cálcio Iônico',
  'Fósforo',
  'Magnésio',
  'Sódio',
  'Potássio',
  'Cloro',
  // Hormônios
  'TSH',
  'T4 Livre',
  'T3 Total',
  'T3 Livre',
  'Anti-TPO',
  'Anti-Tireoglobulina',
  'FSH',
  'LH',
  'Estradiol',
  'Progesterona',
  'Testosterona Total',
  'Testosterona Livre',
  'Prolactina',
  'Cortisol',
  'DHEA-S',
  'Insulina',
  'PTH (Paratormônio)',
  'GH (Hormônio do Crescimento)',
  'IGF-1',
  'Beta-HCG',
  // Urinálise
  'EAS (Urina Tipo I)',
  'Urina 24h (Proteínas)',
  'Urina 24h (Creatinina)',
  'Urocultura',
  'Microalbuminúria',
  // Parasitologia e Fezes
  'Parasitológico de Fezes (EPF)',
  'Pesquisa de Sangue Oculto',
  'Coprocultura',
  // Sorologia e Imunologia
  'Anti-HIV',
  'VDRL',
  'FTA-Abs',
  'HBsAg (Hepatite B)',
  'Anti-HBs',
  'Anti-HBc Total',
  'Anti-HCV (Hepatite C)',
  'Toxoplasmose (IgG e IgM)',
  'Rubéola (IgG e IgM)',
  'Citomegalovírus (IgG e IgM)',
  'Dengue (IgG e IgM)',
  'PCR (Proteína C Reativa)',
  'Fator Reumatoide',
  'FAN (Fator Antinuclear)',
  'ASLO',
  'Complemento C3',
  'Complemento C4',
  'Imunoglobulinas (IgA, IgG, IgM, IgE)',
  'PSA Total',
  'PSA Livre',
  // Marcadores Tumorais
  'CEA',
  'CA 125',
  'CA 19-9',
  'CA 15-3',
  'AFP (Alfafetoproteína)',
  // Coagulação
  'TAP (Tempo de Protrombina)',
  'TTPA',
  'INR',
  'Fibrinogênio',
  'D-Dímero',
  // Vitaminas e Nutrientes
  'Vitamina D (25-OH)',
  'Vitamina B12',
  'Ácido Fólico',
  'Zinco',
  // Gasometria
  'Gasometria Arterial',
  'Gasometria Venosa',
  // Microbiologia
  'Hemocultura',
  'Cultura de Secreção',
  'Antibiograma',
  // Imagem
  'Raio-X Tórax',
  'Raio-X Coluna',
  'Raio-X Membros',
  'Raio-X Seios da Face',
  'Ultrassom Abdominal Total',
  'Ultrassom Pélvico',
  'Ultrassom Transvaginal',
  'Ultrassom Obstétrico',
  'Ultrassom de Tireoide',
  'Ultrassom de Mama',
  'Ultrassom de Próstata',
  'Ultrassom Doppler Vascular',
  'Ecocardiograma',
  'Tomografia Computadorizada',
  'Ressonância Magnética',
  'Mamografia',
  'Densitometria Óssea',
  'Cintilografia',
  // Cardiologia
  'Eletrocardiograma (ECG)',
  'Teste Ergométrico',
  'Holter 24h',
  'MAPA 24h',
  // Endoscopia
  'Endoscopia Digestiva Alta',
  'Colonoscopia',
  'Retossigmoidoscopia',
  // Outros
  'Espirometria',
  'Audiometria',
  'Polissonografia',
  'Eletroencefalograma (EEG)',
  'Eletroneuromiografia',
  'Biópsia',
  'Citopatológico (Papanicolau)',
  'Colposcopia',
];

interface FormData {
  paciente_id: string;
  medico_solicitante_id: string;
  tipo_exame: string;
  descricao: string;
  observacoes: string;
}

const initialFormData: FormData = {
  paciente_id: '',
  medico_solicitante_id: '',
  tipo_exame: '',
  descricao: '',
  observacoes: '',
};

export default function Exames() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customExames, setCustomExames] = useState<string[]>([]);
  const [customExameInput, setCustomExameInput] = useState('');

  const TIPOS_EXAME = [...TIPOS_EXAME_DEFAULT, ...customExames].sort();

  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: medicos = [], isLoading: loadingMedicos } = useMedicos();

  const { data: exames = [], isLoading: loadingExames } = useQuery({
    queryKey: ['exames'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exames')
        .select('*, pacientes(nome), medicos(crm, especialidade)')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = loadingExames || loadingPacientes || loadingMedicos;

  const filteredExames = useMemo(() => {
    return exames.filter(e => {
      const paciente = (e as any).pacientes;
      const matchesSearch = 
        paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tipo_exame.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exames, searchTerm, statusFilter]);

  const selectedExame = useMemo(() => 
    exames.find(e => e.id === selectedId),
    [exames, selectedId]
  );

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setIsViewOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.medico_solicitante_id || !formData.tipo_exame) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('exames').insert({
        paciente_id: formData.paciente_id,
        medico_solicitante_id: formData.medico_solicitante_id,
        tipo_exame: formData.tipo_exame,
        descricao: formData.descricao || null,
        observacoes: formData.observacoes || null,
        status: 'solicitado' as StatusExame,
        data_solicitacao: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      
      toast.success('Exame solicitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['exames'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao solicitar exame:', error);
      toast.error(error.message || 'Erro ao solicitar exame');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StatusExame) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      if (newStatus === 'realizado') {
        updateData.data_realizacao = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('exames')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['exames'] });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const getPacienteNome = (exame: any) => {
    return exame.pacientes?.nome || 'Desconhecido';
  };

  const getMedicoInfo = (exame: any) => {
    const medico = exame.medicos;
    return medico ? `${medico.crm} - ${medico.especialidade || 'Clínico'}` : 'Desconhecido';
  };

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
          <h1 className="text-3xl font-bold text-foreground">Exames</h1>
          <p className="text-muted-foreground">Gerencie solicitações e resultados de exames</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exames ({filteredExames.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente ou exame..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum exame encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExames.map((exame) => (
                    <TableRow key={exame.id}>
                      <TableCell className="font-medium">{getPacienteNome(exame)}</TableCell>
                      <TableCell>{exame.tipo_exame}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {getMedicoInfo(exame)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {exame.data_solicitacao && format(new Date(exame.data_solicitacao), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_COLORS[exame.status || 'solicitado'])}>
                          {STATUS_LABELS[exame.status || 'solicitado']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(exame.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {exame.status === 'solicitado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'agendado')}
                            >
                              Agendar
                            </Button>
                          )}
                          {exame.status === 'agendado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'realizado')}
                            >
                              Realizado
                            </Button>
                          )}
                          {exame.status === 'realizado' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(exame.id, 'laudo_disponivel')}
                            >
                              Laudo OK
                            </Button>
                          )}
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

      {/* New Exam Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Exame</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.paciente_id}
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
              <Label>Médico Solicitante *</Label>
              <Select
                value={formData.medico_solicitante_id}
                onValueChange={(v) => setFormData({ ...formData, medico_solicitante_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.crm} - {m.especialidade || 'Clínico'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Exame *</Label>
              <Select
                value={formData.tipo_exame}
                onValueChange={(v) => setFormData({ ...formData, tipo_exame: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o exame" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIPOS_EXAME.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  value={customExameInput}
                  onChange={(e) => setCustomExameInput(e.target.value)}
                  placeholder="Ou digite um tipo personalizado..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!customExameInput.trim()}
                  onClick={() => {
                    const name = customExameInput.trim();
                    if (name && !TIPOS_EXAME.includes(name)) {
                      setCustomExames(prev => [...prev, name]);
                    }
                    setFormData({ ...formData, tipo_exame: name });
                    setCustomExameInput('');
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Informações adicionais sobre o exame..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações para o laboratório..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              Solicitar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Exame</DialogTitle>
          </DialogHeader>
          {selectedExame && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{getPacienteNome(selectedExame)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn(STATUS_COLORS[selectedExame.status || 'solicitado'])}>
                    {STATUS_LABELS[selectedExame.status || 'solicitado']}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Exame</p>
                <p className="font-medium">{selectedExame.tipo_exame}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Solicitação</p>
                  <p>{selectedExame.data_solicitacao && format(new Date(selectedExame.data_solicitacao), 'dd/MM/yyyy')}</p>
                </div>
                {selectedExame.data_realizacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data Realização</p>
                    <p>{format(new Date(selectedExame.data_realizacao), 'dd/MM/yyyy')}</p>
                  </div>
                )}
              </div>
              {selectedExame.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{selectedExame.descricao}</p>
                </div>
              )}
              {selectedExame.resultado && (
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p className="whitespace-pre-wrap">{selectedExame.resultado}</p>
                </div>
              )}
              {selectedExame.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p>{selectedExame.observacoes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
