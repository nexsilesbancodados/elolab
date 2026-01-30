import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAll, generateId, remove, setCollection } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
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

interface Convenio {
  id: string;
  nome: string;
  codigo: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  valorConsulta: number;
  prazoFaturamento: number;
  ativo: boolean;
  observacoes: string;
  criadoEm: string;
}

export default function Convenios() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const [formData, setFormData] = useState<Partial<Convenio>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getAll<Convenio>('convenios');
    if (data.length === 0) {
      // Seed demo data
      const demoConvenios: Convenio[] = [
        { id: '1', nome: 'Unimed', codigo: 'UNIM', cnpj: '00.000.000/0001-00', telefone: '(11) 3000-0000', email: 'contato@unimed.com.br', endereco: 'São Paulo, SP', valorConsulta: 180, prazoFaturamento: 30, ativo: true, observacoes: '', criadoEm: new Date().toISOString() },
        { id: '2', nome: 'Bradesco Saúde', codigo: 'BRAD', cnpj: '00.000.000/0002-00', telefone: '(11) 3001-0000', email: 'contato@bradesco.com.br', endereco: 'São Paulo, SP', valorConsulta: 200, prazoFaturamento: 45, ativo: true, observacoes: '', criadoEm: new Date().toISOString() },
        { id: '3', nome: 'SulAmérica', codigo: 'SULA', cnpj: '00.000.000/0003-00', telefone: '(11) 3002-0000', email: 'contato@sulamerica.com.br', endereco: 'São Paulo, SP', valorConsulta: 170, prazoFaturamento: 30, ativo: true, observacoes: '', criadoEm: new Date().toISOString() },
        { id: '4', nome: 'Amil', codigo: 'AMIL', cnpj: '00.000.000/0004-00', telefone: '(11) 3003-0000', email: 'contato@amil.com.br', endereco: 'São Paulo, SP', valorConsulta: 160, prazoFaturamento: 30, ativo: false, observacoes: 'Contrato encerrado', criadoEm: new Date().toISOString() },
      ];
      setCollection('convenios', demoConvenios);
      setConvenios(demoConvenios);
    } else {
      setConvenios(data);
    }
  };

  const filteredConvenios = convenios.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNew = () => {
    setSelectedConvenio(null);
    setFormData({ ativo: true, prazoFaturamento: 30 });
    setIsFormOpen(true);
  };

  const handleEdit = (convenio: Convenio) => {
    setSelectedConvenio(convenio);
    setFormData(convenio);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (convenio: Convenio) => {
    setSelectedConvenio(convenio);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedConvenio) {
      remove('convenios', selectedConvenio.id);
      loadData();
      toast({ title: 'Convênio excluído', description: 'O convênio foi removido.' });
    }
    setIsDeleteOpen(false);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.codigo) {
      toast({ title: 'Erro', description: 'Nome e código são obrigatórios.', variant: 'destructive' });
      return;
    }

    const allConvenios = getAll<Convenio>('convenios');
    
    if (selectedConvenio) {
      const index = allConvenios.findIndex(c => c.id === selectedConvenio.id);
      if (index !== -1) {
        allConvenios[index] = { ...allConvenios[index], ...formData } as Convenio;
      }
    } else {
      allConvenios.push({
        ...formData,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as Convenio);
    }

    setCollection('convenios', allConvenios);
    loadData();
    setIsFormOpen(false);
    toast({ title: 'Sucesso', description: 'Convênio salvo com sucesso.' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Convênios</h1>
          <p className="text-muted-foreground">Gerencie os convênios e operadoras de saúde</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Convênio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Convênios</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar convênio..."
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
                  <TableHead>Convênio</TableHead>
                  <TableHead className="hidden md:table-cell">Código</TableHead>
                  <TableHead className="hidden sm:table-cell">Valor Consulta</TableHead>
                  <TableHead className="hidden lg:table-cell">Prazo Fatur.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConvenios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum convênio encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConvenios.map((convenio) => (
                    <TableRow key={convenio.id}>
                      <TableCell>
                        <p className="font-medium">{convenio.nome}</p>
                        <p className="text-xs text-muted-foreground">{convenio.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono">{convenio.codigo}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(convenio.valorConsulta)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{convenio.prazoFaturamento} dias</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          convenio.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        )}>
                          {convenio.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(convenio)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(convenio)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedConvenio ? 'Editar Convênio' : 'Novo Convênio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da Consulta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valorConsulta || ''}
                  onChange={(e) => setFormData({ ...formData, valorConsulta: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo de Faturamento (dias)</Label>
                <Input
                  type="number"
                  value={formData.prazoFaturamento || 30}
                  onChange={(e) => setFormData({ ...formData, prazoFaturamento: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label>Convênio Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o convênio "{selectedConvenio?.nome}"?
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
