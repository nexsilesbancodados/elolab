import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Stethoscope, Phone, Star, BadgeCheck, Award, Mail } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { useMedicos } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FormData {
  nome: string;
  email: string;
  crm: string;
  especialidade: string;
  telefone: string;
  ativo: boolean;
}

const initialFormData: FormData = {
  nome: '',
  email: '',
  crm: '',
  especialidade: '',
  telefone: '',
  ativo: true,
};


const ESPECIALIDADE_COLORS: Record<string, string> = {
  'Clínica Geral': 'bg-blue-100 text-blue-800',
  'Cardiologia': 'bg-red-100 text-red-800',
  'Dermatologia': 'bg-pink-100 text-pink-800',
  'Ortopedia': 'bg-amber-100 text-amber-800',
  'Pediatria': 'bg-green-100 text-green-800',
  'Ginecologia': 'bg-purple-100 text-purple-800',
  'Neurologia': 'bg-indigo-100 text-indigo-800',
  'Psiquiatria': 'bg-violet-100 text-violet-800',
};

const getEspColor = (esp: string | null) =>
  ESPECIALIDADE_COLORS[esp || ''] || 'bg-muted text-muted-foreground';

export default function Medicos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();
  const { data: medicos = [], isLoading } = useMedicos();

  const filteredMedicos = useMemo(() => 
    medicos.filter(m =>
      m.crm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [medicos, searchTerm]
  );

  const handleOpenDialog = (medico?: typeof medicos[0]) => {
    if (medico) {
      setEditingId(medico.id);
      setFormData({
        nome: medico.nome || '',
        email: medico.email || '',
        crm: medico.crm,
        especialidade: medico.especialidade || '',
        telefone: medico.telefone || '',
        ativo: medico.ativo,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.crm) {
      toast.error('CRM é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('medicos')
          .update({
            crm: formData.crm,
            especialidade: formData.especialidade || null,
            telefone: formData.telefone || null,
            ativo: formData.ativo,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Médico atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('medicos')
          .insert({
            crm: formData.crm,
            especialidade: formData.especialidade || null,
            telefone: formData.telefone || null,
            ativo: formData.ativo,
          });

        if (error) throw error;
        toast.success('Médico cadastrado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['medicos'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar médico:', error);
      toast.error(error.message || 'Erro ao salvar médico');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('medicos')
        .delete()
        .eq('id', selectedId);

      if (error) throw error;
      
      toast.success('Médico excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['medicos'] });
    } catch (error: any) {
      console.error('Erro ao excluir médico:', error);
      toast.error(error.message || 'Erro ao excluir médico');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const getInitials = (crm: string) => {
    return crm.slice(0, 2).toUpperCase();
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
          <h1 className="text-3xl font-bold text-foreground">Médicos</h1>
          <p className="text-muted-foreground">Gerencie o corpo clínico da clínica</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Médico
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Corpo Clínico ({filteredMedicos.length})
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CRM ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="hidden md:table-cell">CRM</TableHead>
                  <TableHead className="hidden sm:table-cell">Especialidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum médico encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicos.map((medico) => (
                    <TableRow key={medico.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(medico.crm)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr(a). {medico.crm}</p>
                            <p className="text-sm text-muted-foreground">{medico.especialidade || 'Clínico Geral'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{medico.crm}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{medico.especialidade || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {medico.telefone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {medico.telefone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={medico.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-muted text-muted-foreground'}>
                          {medico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(medico)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(medico.id)}>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Médico' : 'Novo Médico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CRM *</Label>
              <Input
                value={formData.crm}
                onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                placeholder="CRM/UF 123456"
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input
                value={formData.especialidade}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                placeholder="Cardiologia, Pediatria, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Médico ativo</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSubmitting} loadingText="Salvando...">
              {editingId ? 'Salvar' : 'Cadastrar'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este médico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
