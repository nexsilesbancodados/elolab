import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, FileSpreadsheet, Tag, History } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types';
import { getAll, create, update, remove } from '@/lib/localStorage';
import { exportarPacientes } from '@/lib/excelExporter';
import { EtiquetaPaciente } from '@/components/EtiquetaPaciente';
import { 
  PatientPhoto, 
  PatientTimeline, 
  VitalSignsChart,
  AllergyAlert 
} from '@/components/clinical';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [isEtiquetaOpen, setIsEtiquetaOpen] = useState(false);
  const [viewTab, setViewTab] = useState('dados');
  const { toast } = useToast();

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = () => {
    const data = getAll<Paciente>('pacientes');
    setPacientes(data);
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm) ||
      p.telefone.includes(searchTerm)
  );

  const handleNew = () => {
    setSelectedPaciente(null);
    setFormData({
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
      },
      alergias: [],
    });
    setIsFormOpen(true);
  };

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setFormData(paciente);
    setIsFormOpen(true);
  };

  const handleView = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setViewTab('dados');
    setIsViewOpen(true);
  };

  const handleDeleteClick = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedPaciente) {
      remove('pacientes', selectedPaciente.id);
      loadPacientes();
      toast({
        title: 'Paciente excluído',
        description: 'O paciente foi removido com sucesso.',
      });
    }
    setIsDeleteOpen(false);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.cpf || !formData.telefone || !formData.dataNascimento) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPaciente) {
      update<Paciente>('pacientes', selectedPaciente.id, formData);
      toast({
        title: 'Paciente atualizado',
        description: 'Os dados foram salvos com sucesso.',
      });
    } else {
      create<Paciente>('pacientes', {
        ...(formData as Omit<Paciente, 'id'>),
        criadoEm: new Date().toISOString(),
        alergias: formData.alergias || [],
        endereco: formData.endereco || {
          cep: '',
          logradouro: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
        },
      });
      toast({
        title: 'Paciente cadastrado',
        description: 'O paciente foi adicionado com sucesso.',
      });
    }

    loadPacientes();
    setIsFormOpen(false);
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const handleExportExcel = () => {
    exportarPacientes(filteredPacientes);
    toast({
      title: 'Exportação concluída',
      description: `${filteredPacientes.length} paciente(s) exportado(s) para Excel.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Pacientes</CardTitle>
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
                  <TableHead className="hidden lg:table-cell">Convênio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                            currentPhotoUrl={null}
                            size="sm"
                            editable={false}
                          />
                          <div>
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {calcularIdade(paciente.dataNascimento)} anos
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{paciente.cpf}</TableCell>
                      <TableCell className="hidden sm:table-cell">{paciente.telefone}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {paciente.convenio ? (
                          <Badge variant="secondary">{paciente.convenio.nome}</Badge>
                        ) : (
                          <Badge variant="outline">Particular</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleView(paciente)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(paciente)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(paciente)}
                          >
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
            <DialogTitle>
              {selectedPaciente ? 'Editar Paciente' : 'Novo Paciente'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Photo upload for editing */}
            {selectedPaciente && (
              <div className="flex justify-center mb-4">
                <PatientPhoto
                  pacienteId={selectedPaciente.id}
                  pacienteNome={selectedPaciente.nome}
                  currentPhotoUrl={null}
                  size="xl"
                  editable={true}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento || ''}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco?.cep || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco!, cep: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco?.logradouro || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco!, logradouro: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco?.numero || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco!, numero: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco?.bairro || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco!, bairro: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco?.cidade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco!, cidade: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Convênio (Opcional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="convenioNome">Nome do Convênio</Label>
                  <Input
                    id="convenioNome"
                    value={formData.convenio?.nome || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        convenio: { ...formData.convenio!, nome: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroCarteira">Nº Carteira</Label>
                  <Input
                    id="numeroCarteira"
                    value={formData.convenio?.numeroCarteira || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        convenio: { ...formData.convenio!, numeroCarteira: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validade">Validade</Label>
                  <Input
                    id="validade"
                    type="date"
                    value={formData.convenio?.validade || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        convenio: { ...formData.convenio!, validade: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="alergias">Alergias (separadas por vírgula)</Label>
                <Input
                  id="alergias"
                  value={formData.alergias?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alergias: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Ex: Dipirona, Penicilina"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog - Enhanced with Timeline and Charts */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              {selectedPaciente && (
                <>
                  <PatientPhoto
                    pacienteId={selectedPaciente.id}
                    pacienteNome={selectedPaciente.nome}
                    currentPhotoUrl={null}
                    size="lg"
                    editable={true}
                  />
                  <div>
                    <p className="text-xl">{selectedPaciente.nome}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {calcularIdade(selectedPaciente.dataNascimento)} anos • {selectedPaciente.cpf}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPaciente && (
            <div className="space-y-4 py-4">
              {/* Allergy Alert */}
              {selectedPaciente.alergias && selectedPaciente.alergias.length > 0 && (
                <AllergyAlert alergias={selectedPaciente.alergias} />
              )}

              <Tabs value={viewTab} onValueChange={setViewTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
                  <TabsTrigger value="timeline">Histórico</TabsTrigger>
                  <TabsTrigger value="vitais">Sinais Vitais</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedPaciente.telefone}
                      </p>
                    </div>
                    {selectedPaciente.email && (
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedPaciente.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Data de Nascimento</Label>
                      <p>{new Date(selectedPaciente.dataNascimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Convênio</Label>
                      <p>
                        {selectedPaciente.convenio ? (
                          <Badge variant="secondary">{selectedPaciente.convenio.nome}</Badge>
                        ) : (
                          <Badge variant="outline">Particular</Badge>
                        )}
                      </p>
                    </div>
                    {selectedPaciente.endereco && (
                      <div className="md:col-span-2">
                        <Label className="text-muted-foreground">Endereço</Label>
                        <p>
                          {selectedPaciente.endereco.logradouro}, {selectedPaciente.endereco.numero} -{' '}
                          {selectedPaciente.endereco.bairro}, {selectedPaciente.endereco.cidade}
                        </p>
                      </div>
                    )}
                    {selectedPaciente.observacoes && (
                      <div className="md:col-span-2">
                        <Label className="text-muted-foreground">Observações</Label>
                        <p className="whitespace-pre-wrap">{selectedPaciente.observacoes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <PatientTimeline pacienteId={selectedPaciente.id} />
                </TabsContent>

                <TabsContent value="vitais" className="pt-4">
                  <VitalSignsChart pacienteId={selectedPaciente.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleEdit(selectedPaciente!)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button onClick={() => setIsViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente "{selectedPaciente?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Etiqueta Dialog */}
      <EtiquetaPaciente 
        pacientes={pacientes} 
        open={isEtiquetaOpen} 
        onOpenChange={setIsEtiquetaOpen} 
      />
    </div>
  );
}
