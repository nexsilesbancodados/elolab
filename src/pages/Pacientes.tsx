import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePacientes } from '@/hooks/useSupabaseData';
import { EtiquetaPaciente } from '@/components/EtiquetaPaciente';
import { PatientPhoto, PatientTimeline, VitalSignsChart, AllergyAlert } from '@/components/clinical';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Paciente } from '@/types';

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '', cpf: '', data_nascimento: '', telefone: '', email: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
    alergias: [] as string[], observacoes: '',
  });
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [viewTab, setViewTab] = useState('dados');
  const { toast } = useToast();

  const { data: pacientes = [], isLoading, refetch } = usePacientes();

  const selectedPaciente = useMemo(() => pacientes.find(p => p.id === selectedPacienteId), [pacientes, selectedPacienteId]);

  const filteredPacientes = useMemo(() => 
    pacientes.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && p.cpf.includes(searchTerm)) ||
      (p.telefone && p.telefone.includes(searchTerm))
    ), [pacientes, searchTerm]);

  const handleNew = () => {
    setSelectedPacienteId(null);
    setFormData({ nome: '', cpf: '', data_nascimento: '', telefone: '', email: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', alergias: [], observacoes: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (paciente: any) => {
    setSelectedPacienteId(paciente.id);
    setFormData({
      nome: paciente.nome, cpf: paciente.cpf || '', data_nascimento: paciente.data_nascimento || '',
      telefone: paciente.telefone || '', email: paciente.email || '', cep: paciente.cep || '',
      logradouro: paciente.logradouro || '', numero: paciente.numero || '', bairro: paciente.bairro || '',
      cidade: paciente.cidade || '', estado: paciente.estado || '', alergias: paciente.alergias || [], observacoes: paciente.observacoes || '',
    });
    setIsFormOpen(true);
  };

  const handleView = (paciente: any) => { setSelectedPacienteId(paciente.id); setViewTab('dados'); setIsViewOpen(true); };
  const handleDeleteClick = (paciente: any) => { setSelectedPacienteId(paciente.id); setIsDeleteOpen(true); };

  const handleDelete = async () => {
    if (selectedPacienteId) {
      const { error } = await supabase.from('pacientes').delete().eq('id', selectedPacienteId);
      if (!error) { toast({ title: 'Paciente excluído' }); refetch(); }
    }
    setIsDeleteOpen(false);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cpf || !formData.telefone || !formData.data_nascimento) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios.', variant: 'destructive' });
      return;
    }
    const dataToSave = { ...formData, email: formData.email || null, cep: formData.cep || null, logradouro: formData.logradouro || null, numero: formData.numero || null, bairro: formData.bairro || null, cidade: formData.cidade || null, estado: formData.estado || null, observacoes: formData.observacoes || null };

    if (selectedPacienteId) {
      await supabase.from('pacientes').update(dataToSave).eq('id', selectedPacienteId);
      toast({ title: 'Paciente atualizado' });
    } else {
      await supabase.from('pacientes').insert(dataToSave);
      toast({ title: 'Paciente cadastrado' });
    }
    refetch();
    setIsFormOpen(false);
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
  const pacientesForEtiqueta: Paciente[] = filteredPacientes.map(p => ({
    id: p.id, nome: p.nome, cpf: p.cpf || '', dataNascimento: p.data_nascimento || '',
    telefone: p.telefone || '', email: p.email || '', convenio: null,
    endereco: { cep: p.cep || '', logradouro: p.logradouro || '', numero: p.numero || '', bairro: p.bairro || '', cidade: p.cidade || '', estado: p.estado || '' },
    alergias: p.alergias || [], observacoes: p.observacoes || '', criadoEm: p.created_at,
  }));

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsEtiquetaOpen(true)} className="gap-2"><Tag className="h-4 w-4" />Etiquetas</Button>
          <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" />Novo Paciente</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Pacientes ({filteredPacientes.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado</TableCell></TableRow>
                ) : (
                  filteredPacientes.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PatientPhoto pacienteId={paciente.id} pacienteNome={paciente.nome} currentPhotoUrl={paciente.foto_url} size="sm" editable={false} />
                          <div>
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-sm text-muted-foreground">{calcularIdade(paciente.data_nascimento)} anos</p>
                            {paciente.alergias?.length > 0 && <AllergyAlert alergias={paciente.alergias} compact className="mt-1" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{paciente.cpf || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{paciente.telefone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(paciente)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(paciente)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(paciente)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedPacienteId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>CPF *</Label><Input value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} /></div>
              <div className="space-y-2"><Label>Data Nascimento *</Label><Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone *</Label><Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>CEP</Label><Input value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Logradouro</Label><Input value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} /></div>
                <div className="space-y-2"><Label>Número</Label><Input value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} /></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>Alergias (separadas por vírgula)</Label>
                <Input value={formData.alergias.join(', ')} onChange={(e) => setFormData({ ...formData, alergias: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Paciente</DialogTitle></DialogHeader>
          {selectedPaciente && (
            <Tabs value={viewTab} onValueChange={setViewTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="sinais">Sinais Vitais</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="space-y-4 pt-4">
                <div className="flex items-start gap-6">
                  <PatientPhoto pacienteId={selectedPaciente.id} pacienteNome={selectedPaciente.nome} currentPhotoUrl={selectedPaciente.foto_url} size="xl" editable={true} />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedPaciente.nome}</h3>
                      <p className="text-muted-foreground">{calcularIdade(selectedPaciente.data_nascimento)} anos</p>
                    </div>
                    {selectedPaciente.alergias?.length > 0 && <AllergyAlert alergias={selectedPaciente.alergias} />}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">CPF:</span><p>{selectedPaciente.cpf || '-'}</p></div>
                      <div><span className="text-muted-foreground">Telefone:</span><p>{selectedPaciente.telefone || '-'}</p></div>
                      <div><span className="text-muted-foreground">Email:</span><p>{selectedPaciente.email || '-'}</p></div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="historico" className="pt-4"><PatientTimeline pacienteId={selectedPaciente.id} /></TabsContent>
              <TabsContent value="sinais" className="pt-4"><VitalSignsChart pacienteId={selectedPaciente.id} /></TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o paciente "{selectedPaciente?.nome}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EtiquetaPaciente pacientes={pacientesForEtiqueta} open={isEtiquetaOpen} onOpenChange={setIsEtiquetaOpen} />
    </div>
  );
}
