import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Activity, Heart, Scale, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { usePacientes, useAgendamentos, useFilaAtendimento, useSupabaseQuery } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Triagem {
  id: string;
  paciente_id: string;
  agendamento_id: string;
  enfermeiro_id: string;
  pressao_arterial: string | null;
  frequencia_cardiaca: number | null;
  frequencia_respiratoria: number | null;
  temperatura: number | null;
  saturacao: number | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  queixa_principal: string | null;
  classificacao_risco: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | null;
  observacoes: string | null;
  data_hora: string | null;
}

const CLASSIFICACAO_COLORS: Record<string, string> = {
  verde: 'bg-green-500 text-white',
  amarelo: 'bg-yellow-500 text-white',
  laranja: 'bg-orange-500 text-white',
  vermelho: 'bg-red-500 text-white',
};

const CLASSIFICACAO_LABELS: Record<string, string> = {
  verde: 'Não Urgente',
  amarelo: 'Pouco Urgente',
  laranja: 'Urgente',
  vermelho: 'Emergência',
};


const RISCO_COLORS = {
  vermelho: 'bg-red-500 text-white border-red-600',
  laranja: 'bg-orange-500 text-white border-orange-600',
  amarelo: 'bg-yellow-400 text-yellow-900 border-yellow-500',
  verde: 'bg-green-500 text-white border-green-600',
};

const RISCO_LABELS = {
  vermelho: 'Emergência',
  laranja: 'Muito Urgente',
  amarelo: 'Urgente',
  verde: 'Pouco Urgente',
};

export default function TriagemPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: '',
    agendamento_id: '',
    pressao_arterial: '',
    frequencia_cardiaca: '',
    frequencia_respiratoria: '',
    temperatura: '',
    saturacao: '',
    peso: '',
    altura: '',
    queixa_principal: '',
    classificacao_risco: 'verde' as 'verde' | 'amarelo' | 'laranja' | 'vermelho',
    observacoes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: triagens = [], isLoading: loadingTriagens } = useSupabaseQuery<Triagem>('triagens', {
    orderBy: { column: 'data_hora', ascending: false },
    staleTime: 1000 * 15, // 15 seconds for real-time triage
  });
  const { data: pacientes = [] } = usePacientes();
  const { data: agendamentos = [] } = useAgendamentos(today);
  const { data: fila = [] } = useFilaAtendimento();

  const isLoading = loadingTriagens;

  const filaAguardando = fila.filter(f => f.status === 'aguardando');
  const triagenHoje = triagens.filter(t => t.data_hora?.startsWith(today));

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
      paciente_id: pacienteId || '',
      agendamento_id: agendamentoId || '',
      pressao_arterial: '',
      frequencia_cardiaca: '',
      frequencia_respiratoria: '',
      temperatura: '',
      saturacao: '',
      peso: '',
      altura: '',
      queixa_principal: '',
      classificacao_risco: 'verde',
      observacoes: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paciente_id || !formData.pressao_arterial) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const imc = calcularIMC(formData.peso, formData.altura);

      const { error } = await supabase.from('triagens').insert({
        paciente_id: formData.paciente_id,
        agendamento_id: formData.agendamento_id || null,
        enfermeiro_id: user?.id || '',
        pressao_arterial: formData.pressao_arterial,
        frequencia_cardiaca: parseInt(formData.frequencia_cardiaca) || null,
        frequencia_respiratoria: parseInt(formData.frequencia_respiratoria) || null,
        temperatura: parseFloat(formData.temperatura) || null,
        saturacao: parseFloat(formData.saturacao) || null,
        peso: parseFloat(formData.peso) || null,
        altura: parseFloat(formData.altura) || null,
        imc: imc || null,
        queixa_principal: formData.queixa_principal || null,
        classificacao_risco: formData.classificacao_risco,
        observacoes: formData.observacoes || null,
        data_hora: new Date().toISOString(),
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['triagens'] });
      setIsDialogOpen(false);
      toast.success('Triagem realizada com sucesso.');
    } catch (error) {
      console.error('Error saving triagem:', error);
      toast.error('Erro ao salvar triagem.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPacienteNome = (id: string) => pacientes.find(p => p.id === id)?.nome || 'Desconhecido';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

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
                  <p className="text-3xl font-bold">{triagenHoje.filter(t => t.classificacao_risco === cor).length}</p>
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
                const ag = agendamentos.find(a => a.id === item.agendamento_id);
                const agData = ag as any;
                const paciente = agData ? pacientes.find(p => p.id === agData.paciente_id) : null;
                const jaTriado = triagens.some(t => t.agendamento_id === item.agendamento_id);
                
                if (jaTriado || !paciente) return null;
                
                return (
                  <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" 
                        onClick={() => handleOpenDialog(paciente.id, item.agendamento_id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{paciente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Chegada: {item.horario_chegada ? format(new Date(item.horario_chegada), 'HH:mm') : '-'}
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
                      <TableCell>{triagem.data_hora ? format(new Date(triagem.data_hora), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="font-medium">{getPacienteNome(triagem.paciente_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{triagem.pressao_arterial} mmHg</TableCell>
                      <TableCell className="hidden md:table-cell">{triagem.frequencia_cardiaca} bpm</TableCell>
                      <TableCell className="hidden lg:table-cell">{triagem.temperatura}°C</TableCell>
                      <TableCell className="hidden lg:table-cell">{triagem.saturacao}%</TableCell>
                      <TableCell>
                        <Badge className={CLASSIFICACAO_COLORS[triagem.classificacao_risco || 'verde']}>
                          {CLASSIFICACAO_LABELS[triagem.classificacao_risco || 'verde']}
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
              <Select value={formData.paciente_id} onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}>
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
                    value={formData.pressao_arterial}
                    onChange={(e) => setFormData({ ...formData, pressao_arterial: e.target.value })}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência Cardíaca</Label>
                  <Input
                    type="number"
                    value={formData.frequencia_cardiaca}
                    onChange={(e) => setFormData({ ...formData, frequencia_cardiaca: e.target.value })}
                    placeholder="bpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Freq. Respiratória</Label>
                  <Input
                    type="number"
                    value={formData.frequencia_respiratoria}
                    onChange={(e) => setFormData({ ...formData, frequencia_respiratoria: e.target.value })}
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
                  value={formData.queixa_principal}
                  onChange={(e) => setFormData({ ...formData, queixa_principal: e.target.value })}
                  placeholder="Descreva a queixa principal do paciente..."
                />
              </div>
              <div className="space-y-2">
                <Label>Classificação de Risco *</Label>
                <Select 
                  value={formData.classificacao_risco} 
                  onValueChange={(v: 'verde' | 'amarelo' | 'laranja' | 'vermelho') => 
                    setFormData({ ...formData, classificacao_risco: v })
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Triagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
