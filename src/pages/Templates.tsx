import { useState, useEffect } from 'react';
import { Plus, FileText, Pill, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAll, remove, generateId, setCollection } from '@/lib/localStorage';
import { PrescriptionTemplate, CertificateTemplate } from '@/types/templates';

const PRESCRIPTION_TYPES = {
  simples: 'Receita Simples',
  controle_especial: 'Controle Especial',
  antimicrobiano: 'Antimicrobiano',
};

const CERTIFICATE_TYPES = {
  comparecimento: 'Comparecimento',
  afastamento: 'Afastamento',
  aptidao: 'Aptidão',
  acompanhante: 'Acompanhante',
};

export default function Templates() {
  const [prescriptionTemplates, setPrescriptionTemplates] = useState<PrescriptionTemplate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [isCertificateFormOpen, setIsCertificateFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'prescription' | 'certificate'; id: string }>({ open: false, type: 'prescription', id: '' });
  const [prescriptionForm, setPrescriptionForm] = useState<Partial<PrescriptionTemplate>>({});
  const [certificateForm, setCertificateForm] = useState<Partial<CertificateTemplate>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPrescriptionTemplates(getAll<PrescriptionTemplate>('prescription_templates'));
    setCertificateTemplates(getAll<CertificateTemplate>('certificate_templates'));
  };

  const handleSavePrescription = () => {
    if (!prescriptionForm.nome || !prescriptionForm.tipo) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const templates = getAll<PrescriptionTemplate>('prescription_templates');
    
    if (prescriptionForm.id) {
      const index = templates.findIndex(t => t.id === prescriptionForm.id);
      if (index !== -1) {
        templates[index] = { ...templates[index], ...prescriptionForm, atualizadoEm: new Date().toISOString() } as PrescriptionTemplate;
      }
    } else {
      templates.push({
        ...prescriptionForm,
        id: generateId(),
        medicamentos: prescriptionForm.medicamentos || [],
        criadoEm: new Date().toISOString(),
      } as PrescriptionTemplate);
    }

    setCollection('prescription_templates', templates);
    loadData();
    setIsPrescriptionFormOpen(false);
    setPrescriptionForm({});
    toast({ title: 'Sucesso', description: 'Template salvo com sucesso' });
  };

  const handleSaveCertificate = () => {
    if (!certificateForm.nome || !certificateForm.tipo || !certificateForm.conteudo) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const templates = getAll<CertificateTemplate>('certificate_templates');
    
    if (certificateForm.id) {
      const index = templates.findIndex(t => t.id === certificateForm.id);
      if (index !== -1) {
        templates[index] = { ...templates[index], ...certificateForm, atualizadoEm: new Date().toISOString() } as CertificateTemplate;
      }
    } else {
      templates.push({
        ...certificateForm,
        id: generateId(),
        criadoEm: new Date().toISOString(),
      } as CertificateTemplate);
    }

    setCollection('certificate_templates', templates);
    loadData();
    setIsCertificateFormOpen(false);
    setCertificateForm({});
    toast({ title: 'Sucesso', description: 'Template salvo com sucesso' });
  };

  const handleDelete = () => {
    const { type, id } = deleteDialog;
    const collection = type === 'prescription' ? 'prescription_templates' : 'certificate_templates';
    remove(collection, id);
    loadData();
    setDeleteDialog({ open: false, type: 'prescription', id: '' });
    toast({ title: 'Sucesso', description: 'Template excluído' });
  };

  const duplicateTemplate = (template: PrescriptionTemplate | CertificateTemplate, type: 'prescription' | 'certificate') => {
    const collection = type === 'prescription' ? 'prescription_templates' : 'certificate_templates';
    const templates = getAll<any>(collection);
    const newTemplate = {
      ...template,
      id: generateId(),
      nome: `${template.nome} (cópia)`,
      criadoEm: new Date().toISOString(),
    };
    templates.push(newTemplate);
    setCollection(collection, templates);
    loadData();
    toast({ title: 'Sucesso', description: 'Template duplicado' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <p className="text-muted-foreground">Modelos reutilizáveis para prescrições e atestados</p>
      </div>

      <Tabs defaultValue="prescriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prescriptions" className="gap-2">
            <Pill className="h-4 w-4" />
            Prescrições
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <FileText className="h-4 w-4" />
            Atestados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setPrescriptionForm({}); setIsPrescriptionFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>

          {prescriptionTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Pill className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum template de prescrição criado</p>
                <p className="text-sm">Crie templates para agilizar suas prescrições</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prescriptionTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.nome}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline" className="mt-1">
                            {PRESCRIPTION_TYPES[template.tipo]}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => duplicateTemplate(template, 'prescription')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setPrescriptionForm(template); setIsPrescriptionFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteDialog({ open: true, type: 'prescription', id: template.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {template.medicamentos?.length || 0} medicamento(s)
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setCertificateForm({}); setIsCertificateFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>

          {certificateTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum template de atestado criado</p>
                <p className="text-sm">Crie templates para agilizar seus atestados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {certificateTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.nome}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline" className="mt-1">
                            {CERTIFICATE_TYPES[template.tipo]}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => duplicateTemplate(template, 'certificate')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setCertificateForm(template); setIsCertificateFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteDialog({ open: true, type: 'certificate', id: template.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.conteudo}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Prescription Form Dialog */}
      <Dialog open={isPrescriptionFormOpen} onOpenChange={setIsPrescriptionFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{prescriptionForm.id ? 'Editar' : 'Novo'} Template de Prescrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  value={prescriptionForm.nome || ''}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, nome: e.target.value })}
                  placeholder="Ex: Antibiótico padrão"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={prescriptionForm.tipo}
                  onValueChange={(v) => setPrescriptionForm({ ...prescriptionForm, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESCRIPTION_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea
                value={prescriptionForm.observacoesGerais || ''}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, observacoesGerais: e.target.value })}
                placeholder="Instruções gerais para o paciente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrescriptionFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePrescription}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Form Dialog */}
      <Dialog open={isCertificateFormOpen} onOpenChange={setIsCertificateFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{certificateForm.id ? 'Editar' : 'Novo'} Template de Atestado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  value={certificateForm.nome || ''}
                  onChange={(e) => setCertificateForm({ ...certificateForm, nome: e.target.value })}
                  placeholder="Ex: Atestado padrão"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={certificateForm.tipo}
                  onValueChange={(v) => setCertificateForm({ ...certificateForm, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CERTIFICATE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {certificateForm.tipo === 'afastamento' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias de Afastamento</Label>
                  <Input
                    type="number"
                    value={certificateForm.diasAfastamento || ''}
                    onChange={(e) => setCertificateForm({ ...certificateForm, diasAfastamento: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CID</Label>
                  <Input
                    value={certificateForm.cid || ''}
                    onChange={(e) => setCertificateForm({ ...certificateForm, cid: e.target.value })}
                    placeholder="Ex: J11"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Conteúdo do Atestado *</Label>
              <Textarea
                value={certificateForm.conteudo || ''}
                onChange={(e) => setCertificateForm({ ...certificateForm, conteudo: e.target.value })}
                placeholder="Texto do atestado... Use {{paciente}}, {{data}}, {{medico}} como variáveis"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {"{{paciente}}"}, {"{{data}}"}, {"{{medico}}"}, {"{{crm}}"}, {"{{dias}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCertificateFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCertificate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
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
