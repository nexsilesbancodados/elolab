import { useState, useEffect } from 'react';
import { Plus, Search, Activity, Heart, Thermometer, Scale, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Triagem, Paciente, User, Agendamento, FilaAtendimento } from '@/types';
import { getAll, generateId, setItem } from '@/lib/localStorage';
import { format } from 'date-fns';

const CLASSIFICACAO_COLORS = {
  verde: 'bg-green-500 text-white',
  amarelo: 'bg-yellow-500 text-white',
  laranja: 'bg-orange-500 text-white',
  vermelho: 'bg-red-500 text-white',
};

const CLASSIFICACAO_LABELS = {
  verde: 'Não Urgente',
  amarelo: 'Pouco Urgente',
  laranja: 'Urgente',
  vermelho: 'Emergência',
};

export default function TriagemPage() {
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [fila, setFila] = useState<FilaAtendimento[]>([]);
  const [enfermeiros, setEnfermeiros] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    agendamentoId: '',
    pressaoArterial: '',
    frequenciaCardiaca: '',
    frequenciaRespiratoria: '',
    temperatura: '',
    saturacao: '',
    peso: '',
    altura: '',
    queixaPrincipal: '',
    classificacaoRisco: 'verde' as 'verde' | 'amarelo' | 'laranja' | 'vermelho',
    observacoes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTriagens(getAll<Triagem>('triagens'));
    setPacientes(getAll<Paciente>('pacientes'));
    setAgendamentos(getAll<Agendamento>('agendamentos'));
    setFila(getAll<FilaAtendimento>('fila'));
    setEnfermeiros(getAll<User>('users').filter(u => u.role === 'enfermagem'));
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const filaAguardando = fila.filter(f => f.status === 'aguardando');

  const calcularIMC = (peso: string, altura: string): number => {
    const p = parseFloat(peso);
    const h = parseFloat(altura) / 100;
    if (p > 0 && h > 0) {
      return parseFloat((p / (h * h)).toFixed(1));
    }
    return 0;
  };

  const handleOpenDialog = (pacienteId?: string, agendamentoId?: string) => {
    setFormData({
      pacienteId: pacienteId || '',
      agendamentoId: agendamentoId || '',
      pressaoArterial: '',
      frequenciaCardiaca: '',
      frequenciaRespiratoria: '',
      temperatura: '',
      saturacao: '',
      peso: '',
      altura: '',
      queixaPrincipal: '',
      classificacaoRisco: 'verde',
      observacoes: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.pacienteId || !formData.pressaoArterial) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('elolab_clinic_currentUser') || '{}');
    const imc = calcularIMC(formData.peso, formData.altura);

    const novaTriagem: Triagem = {
      id: generateId(),
      pacienteId: formData.pacienteId,
      agendamentoId: formData.agendamentoId,
      enfermeiroId: currentUser.id || 'enf-1',
      pressaoArterial: formData.pressaoArterial,
      frequenciaCardiaca: parseInt(formData.frequenciaCardiaca) || 0,
      frequenciaRespiratoria: parseInt(formData.frequenciaRespiratoria) || 0,
      temperatura: parseFloat(formData.temperatura) || 0,
      saturacao: parseFloat(formData.saturacao) || 0,
      peso: parseFloat(formData.peso) || 0,
      altura: parseFloat(formData.altura) || 0,
      imc,
      queixaPrincipal: formData.queixaPrincipal,
      classificacaoRisco: formData.classificacaoRisco,
      observacoes: formData.observacoes,
      dataHora: new Date().toISOString(),
    };

    const allTriagens = getAll<Triagem>('triagens');
    allTriagens.push(novaTriagem);
    setItem('triagens', allTriagens);

    loadData();
    setIsDialogOpen(false);
    toast({
      title: 'Triagem realizada',
      description: 'Os dados foram registrados com sucesso.',
    });
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';
  const getEnfermeiroNome = (id: string) => enfermeiros.find(e => e.id === id)?.nome || 'Desconhecido';

  const triagenHoje = triagens.filter(t => t.dataHora.startsWith(today));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Triagem</h1>
          <p className="text-muted-foreground">Aferição de sinais vitais e classificação de risco</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Triagem
        </Button>
      </div>

      {/* Cards de Classificação */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['verde', 'amarelo', 'laranja', 'vermelho'] as const).map(cor => (
          <Card key={cor}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{triagenHoje.filter(t => t.classificacaoRisco === cor).length}</p>
                  <p className="text-sm text-muted-foreground">{CLASSIFICACAO_LABELS[cor]}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${CLASSIFICACAO_COLORS[cor]} flex items-center justify-center`}>
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pacientes Aguardando Triagem */}
      {filaAguardando.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aguardando Triagem</CardTitle>
            <CardDescription>Pacientes na fila que ainda não foram triados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filaAguardando.map(item => {
                const ag = agendamentos.find(a => a.id === item.agendamentoId);
                const paciente = ag ? pacientes.find(p => p.id === ag.pacienteId) : null;
                const jaTriado = triagens.some(t => t.agendamentoId === item.agendamentoId);
                
                if (jaTriado || !paciente) return null;
                
                return (
                  <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" 
                        onClick={() => handleOpenDialog(paciente.id, item.agendamentoId)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{paciente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Chegada: {format(new Date(item.horarioChegada), 'HH:mm')}
                          </p>
                        </div>
                        <Button size="sm">Triar</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triagens de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Triagens de Hoje ({triagenHoje.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">PA</TableHead>
                  <TableHead className="hidden md:table-cell">FC</TableHead>
                  <TableHead className="hidden lg:table-cell">Temp</TableHead>
                  <TableHead className="hidden lg:table-cell">SpO2</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triagenHoje.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma triagem realizada hoje
                    </TableCell>
                  </TableRow>
                ) : (
                  triagenHoje.map((triagem) => (
                    <TableRow key={triagem.id}>
                      <TableCell>{format(new Date(triagem.dataHora), 'HH:mm')}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(triagem.pacienteId)}</TableCell>
                      <TableCell className="hidden md:table-cell">{triagem.pressaoArterial} mmHg</TableCell>
                      <TableCell className="hidden md:table-cell">{triagem.frequenciaCardiaca} bpm</TableCell>
                      <TableCell className="hidden lg:table-cell">{triagem.temperatura}°C</TableCell>
                      <TableCell className="hidden lg:table-cell">{triagem.saturacao}%</TableCell>
                      <TableCell>
                        <Badge className={CLASSIFICACAO_COLORS[triagem.classificacaoRisco]}>
                          {CLASSIFICACAO_LABELS[triagem.classificacaoRisco]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Triagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Paciente */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={formData.pacienteId} onValueChange={(v) => setFormData({ ...formData, pacienteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sinais Vitais */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Sinais Vitais
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Pressão Arterial *</Label>
                  <Input
                    value={formData.pressaoArterial}
                    onChange={(e) => setFormData({ ...formData, pressaoArterial: e.target.value })}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência Cardíaca</Label>
                  <Input
                    type="number"
                    value={formData.frequenciaCardiaca}
                    onChange={(e) => setFormData({ ...formData, frequenciaCardiaca: e.target.value })}
                    placeholder="bpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Freq. Respiratória</Label>
                  <Input
                    type="number"
                    value={formData.frequenciaRespiratoria}
                    onChange={(e) => setFormData({ ...formData, frequenciaRespiratoria: e.target.value })}
                    placeholder="irpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperatura</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                    placeholder="°C"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saturação O₂</Label>
                  <Input
                    type="number"
                    value={formData.saturacao}
                    onChange={(e) => setFormData({ ...formData, saturacao: e.target.value })}
                    placeholder="%"
                  />
                </div>
              </div>
            </div>

            {/* Antropometria */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Antropometria
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    placeholder="kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    placeholder="cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IMC</Label>
                  <Input
                    value={calcularIMC(formData.peso, formData.altura) || '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Queixa e Classificação */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Queixa Principal</Label>
                <Textarea
                  value={formData.queixaPrincipal}
                  onChange={(e) => setFormData({ ...formData, queixaPrincipal: e.target.value })}
                  placeholder="Descreva a queixa principal do paciente..."
                />
              </div>
              <div className="space-y-2">
                <Label>Classificação de Risco *</Label>
                <Select 
                  value={formData.classificacaoRisco} 
                  onValueChange={(v: 'verde' | 'amarelo' | 'laranja' | 'vermelho') => 
                    setFormData({ ...formData, classificacaoRisco: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verde">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Verde - Não Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="amarelo">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        Amarelo - Pouco Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="laranja">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        Laranja - Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="vermelho">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Vermelho - Emergência
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Triagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
