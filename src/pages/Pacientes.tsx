import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Tag, Link, Copy, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/hooks/use-toast';
import { usePacientes } from '@/hooks/useSupabaseData';
import { EtiquetaPaciente } from '@/components/EtiquetaPaciente';
import { PatientPhoto, PatientTimeline, VitalSignsChart, AllergyAlert } from '@/components/clinical';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Paciente } from '@/types';

interface PacienteFormData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  alergias: string[];
  observacoes: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  parentesco_responsavel: string;
}

const initialFormData: PacienteFormData = {
  nome: '',
  cpf: '',
  data_nascimento: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  alergias: [],
  observacoes: '',
  nome_responsavel: '',
  cpf_responsavel: '',
  parentesco_responsavel: '',
};

const isMinor = (dataNascimento: string): boolean => {
  if (!dataNascimento) return false;
  const birth = new Date(dataNascimento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
};

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PacienteFormData>(initialFormData);
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [viewTab, setViewTab] = useState('dados');
  const [cepLoading, setCepLoading] = useState(false);

  const buscarCep = useCallback(async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch { /* silently fail */ } finally {
      setCepLoading(false);
    }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const { data: pacientes = [], isLoading, refetch } = usePacientes();

  const selectedPaciente = useMemo(
    () => pacientes.find((p) => p.id === selectedPacienteId),
    [pacientes, selectedPacienteId]
  );

  const filteredPacientes = useMemo(
    () =>
      pacientes.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.cpf && p.cpf.includes(searchTerm)) ||
          (p.telefone && p.telefone.includes(searchTerm))
      ),
    [pacientes, searchTerm]
  );

  const handleNew = () => {
    setSelectedPacienteId(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleEdit = (paciente: typeof pacientes[0]) => {
    setSelectedPacienteId(paciente.id);
    setFormData({
      nome: paciente.nome,
      cpf: paciente.cpf || '',
      data_nascimento: paciente.data_nascimento || '',
      telefone: paciente.telefone || '',
      email: paciente.email || '',
      cep: paciente.cep || '',
      logradouro: paciente.logradouro || '',
      numero: paciente.numero || '',
      bairro: paciente.bairro || '',
      cidade: paciente.cidade || '',
      estado: paciente.estado || '',
      alergias: paciente.alergias || [],
      observacoes: paciente.observacoes || '',
      nome_responsavel: (paciente as any).nome_responsavel || '',
      cpf_responsavel: (paciente as any).cpf_responsavel || '',
      parentesco_responsavel: (paciente as any).parentesco_responsavel || '',
    });
    setIsFormOpen(true);
  };

  const handleView = (paciente: typeof pacientes[0]) => {
    setSelectedPacienteId(paciente.id);
    setViewTab('dados');
    setIsViewOpen(true);
  };

  const handleDeleteClick = (paciente: typeof pacientes[0]) => {
    setSelectedPacienteId(paciente.id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPacienteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', selectedPacienteId);
      if (error) throw error;
      toast({ title: 'Paciente excluído com sucesso' });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ title: 'Erro ao excluir paciente', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cpf || !formData.telefone || !formData.data_nascimento) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        email: formData.email || null,
        cep: formData.cep || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes || null,
        nome_responsavel: formData.nome_responsavel || null,
        cpf_responsavel: formData.cpf_responsavel || null,
        parentesco_responsavel: formData.parentesco_responsavel || null,
      };

      if (selectedPacienteId) {
        const { error } = await supabase.from('pacientes').update(dataToSave).eq('id', selectedPacienteId);
        if (error) throw error;
        toast({ title: 'Paciente atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('pacientes').insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Paciente cadastrado com sucesso' });
      }
      refetch();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar paciente', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePortalLink = async (pacienteId: string, pacienteNome: string) => {
    try {
      const { data, error } = await supabase
        .from('paciente_portal_tokens')
        .insert({ paciente_id: pacienteId })
        .select('token')
        .single();

      if (error) throw error;

      const portalUrl = `${window.location.origin}/portal-paciente?token=${data.token}`;
      await navigator.clipboard.writeText(portalUrl);
      toast({
        title: 'Link copiado!',
        description: `Link do portal de ${pacienteNome} copiado para a área de transferência.`,
      });
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({ title: 'Erro ao gerar link do portal', variant: 'destructive' });
    }
  };

  const calcularIdade = (dataNascimento: string | null) => {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  // Convert to Paciente type for EtiquetaPaciente
  const pacientesForEtiqueta: Paciente[] = filteredPacientes.map((p) => ({
    id: p.id,
    nome: p.nome,
    cpf: p.cpf || '',
    dataNascimento: p.data_nascimento || '',
    telefone: p.telefone || '',
    email: p.email || '',
    convenio: null,
    endereco: {
      cep: p.cep || '',
      logradouro: p.logradouro || '',
      numero: p.numero || '',
      bairro: p.bairro || '',
      cidade: p.cidade || '',
      estado: p.estado || '',
    },
    alergias: p.alergias || [],
    observacoes: p.observacoes || '',
    criadoEm: p.created_at,
  }));

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsEtiquetaOpen(true)} className="gap-2">
            <Tag className="h-4 w-4" />
            Etiquetas
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Pacientes ({filteredPacientes.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
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
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PatientPhoto
                            pacienteId={paciente.id}
                            pacienteNome={paciente.nome}
                            currentPhotoUrl={paciente.foto_url}
                            size="sm"
                            editable={false}
                          />
                          <div>
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {calcularIdade(paciente.data_nascimento)} anos
                            </p>
                            {paciente.alergias && paciente.alergias.length > 0 && (
                              <AllergyAlert alergias={paciente.alergias} compact className="mt-1" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{paciente.cpf || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{paciente.telefone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(paciente)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleGeneratePortalLink(paciente.id, paciente.nome)} title="Gerar link do portal">
                            <Link className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(paciente)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(paciente)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPacienteId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <Input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={(e) => buscarCep(e.target.value)}
                      placeholder="00000-000"
                      className="pr-8"
                    />
                    {cepLoading ? (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Sai do campo para preencher endereço</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
              </div>
            </div>
            {isMinor(formData.data_nascimento) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Responsável (menor de idade)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Responsável *</Label>
                    <Input
                      value={formData.nome_responsavel}
                      onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                      placeholder="Nome completo do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF do Responsável</Label>
                    <Input
                      value={formData.cpf_responsavel}
                      onChange={(e) => setFormData({ ...formData, cpf_responsavel: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parentesco</Label>
                    <Input
                      value={formData.parentesco_responsavel}
                      onChange={(e) => setFormData({ ...formData, parentesco_responsavel: e.target.value })}
                      placeholder="Mãe, Pai, Avó, etc."
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>Alergias (separadas por vírgula)</Label>
                <Input
                  value={formData.alergias.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alergias: e.target.value
                        .split(',')
                        .map((a) => a.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Penicilina, Dipirona, etc."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              Salvar
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <Tabs value={viewTab} onValueChange={setViewTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="sinais">Sinais Vitais</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="space-y-4 pt-4">
                <div className="flex items-start gap-6">
                  <PatientPhoto
                    pacienteId={selectedPaciente.id}
                    pacienteNome={selectedPaciente.nome}
                    currentPhotoUrl={selectedPaciente.foto_url}
                    size="xl"
                    editable={true}
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedPaciente.nome}</h3>
                      <p className="text-muted-foreground">
                        {calcularIdade(selectedPaciente.data_nascimento)} anos
                      </p>
                    </div>
                    {selectedPaciente.alergias && selectedPaciente.alergias.length > 0 && (
                      <AllergyAlert alergias={selectedPaciente.alergias} />
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">CPF:</span>
                        <p>{selectedPaciente.cpf || '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telefone:</span>
                        <p>{selectedPaciente.telefone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedPaciente.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="historico" className="pt-4">
                <PatientTimeline pacienteId={selectedPaciente.id} />
              </TabsContent>
              <TabsContent value="sinais" className="pt-4">
                <VitalSignsChart pacienteId={selectedPaciente.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente "{selectedPaciente?.nome}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <LoadingButton
              onClick={handleDelete}
              isLoading={isDeleting}
              loadingText="Excluindo..."
              variant="destructive"
            >
              Excluir
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Etiquetas Dialog */}
      <EtiquetaPaciente
        pacientes={pacientesForEtiqueta}
        open={isEtiquetaOpen}
        onOpenChange={setIsEtiquetaOpen}
      />
    </div>
  );
}
