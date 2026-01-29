import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types';
import { getAll, create, update, remove, generateId } from '@/lib/localStorage';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState<Partial<Paciente>>({});
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
      const newPaciente: Paciente = {
        ...formData,
        id: generateId(),
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
      } as Paciente;
      const pacientesAtuais = getAll<Paciente>('pacientes');
      pacientesAtuais.push(newPaciente);
      localStorage.setItem('elolab_clinic_pacientes', JSON.stringify(pacientesAtuais));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
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
                  <TableHead>Nome</TableHead>
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
                        <div>
                          <p className="font-medium">{paciente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {calcularIdade(paciente.dataNascimento)} anos
                          </p>
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

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>
          {selectedPaciente && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedPaciente.nome}</h3>
                <p className="text-muted-foreground">
                  {calcularIdade(selectedPaciente.dataNascimento)} anos
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {selectedPaciente.telefone}
                </div>
                {selectedPaciente.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedPaciente.email}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-1">CPF</p>
                <p className="text-sm text-muted-foreground">{selectedPaciente.cpf}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-1">Endereço</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPaciente.endereco.logradouro}, {selectedPaciente.endereco.numero}
                  {selectedPaciente.endereco.complemento &&
                    ` - ${selectedPaciente.endereco.complemento}`}
                  <br />
                  {selectedPaciente.endereco.bairro} - {selectedPaciente.endereco.cidade}/
                  {selectedPaciente.endereco.estado}
                  <br />
                  CEP: {selectedPaciente.endereco.cep}
                </p>
              </div>

              {selectedPaciente.convenio && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-1">Convênio</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPaciente.convenio.nome} - {selectedPaciente.convenio.numeroCarteira}
                    <br />
                    Validade: {new Date(selectedPaciente.convenio.validade).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {selectedPaciente.alergias.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Alergias</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPaciente.alergias.map((alergia, i) => (
                      <Badge key={i} variant="destructive">
                        {alergia}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPaciente.observacoes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground">{selectedPaciente.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
