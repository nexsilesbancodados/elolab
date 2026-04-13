import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Plus, Edit2, Trash2, Eye, Send, Copy } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  categoria: string;
  tipo: string;
  nome: string;
  assunto: string;
  conteudo: string;
  variaveis: string[];
  ativo: boolean;
  created_at: string;
}

const CATEGORIAS = [
  { value: 'lembrete_consulta', label: '📅 Lembrete de Consulta' },
  { value: 'confirmacao_consulta', label: '✅ Confirmação de Consulta' },
  { value: 'resultado_exame', label: '📋 Resultado de Exame' },
  { value: 'recibo_pagamento', label: '💳 Recibo de Pagamento' },
  { value: 'aniversario', label: '🎂 Aniversário' },
  { value: 'estoque', label: '⚠️ Alerta de Estoque' },
];

const VARIAVEIS_EXEMPLO: Record<string, Record<string, string>> = {
  lembrete_consulta: {
    paciente_nome: 'João Silva',
    data: '15/04/2026',
    horario: '14:30',
    medico_nome: 'Dra. Maria Santos',
    clinica_nome: 'Clínica de Saúde',
    clinica_endereco: 'Rua Principal, 123 - São Paulo/SP',
  },
  confirmacao_consulta: {
    paciente_nome: 'João Silva',
    data: '15/04/2026',
    horario: '14:30',
    medico_nome: 'Dra. Maria Santos',
    clinica_nome: 'Clínica de Saúde',
    clinica_endereco: 'Rua Principal, 123 - São Paulo/SP',
  },
  resultado_exame: {
    paciente_nome: 'João Silva',
    tipo_exame: 'Hemograma',
    data_resultado: '14/04/2026',
    link_portal: 'https://app.elolab.com.br/portal-paciente',
    clinica_nome: 'Clínica de Saúde',
  },
  recibo_pagamento: {
    paciente_nome: 'João Silva',
    valor: 'R$ 150,00',
    forma_pagamento: 'PIX',
    data: '14/04/2026',
    descricao: 'Consulta com Dra. Maria',
    clinica_nome: 'Clínica de Saúde',
    clinica_cnpj: '12.345.678/0001-90',
  },
};

export default function TemplatesEmail() {
  const { profile } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  const [form, setForm] = useState({
    categoria: '',
    nome: '',
    assunto: '',
    conteudo: '',
    variaveis: [] as string[],
  });

  const [preview, setPreview] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notification_templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notification_templates')
        .select('*')
        .order('categoria', { ascending: true });
      return (data || []) as NotificationTemplate[];
    },
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      (filterCategoria === '' || t.categoria === filterCategoria) &&
      (t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
       t.assunto.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [templates, searchTerm, filterCategoria]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notification_templates')
        .insert([{
          categoria: form.categoria,
          tipo: 'email',
          nome: form.nome,
          assunto: form.assunto,
          conteudo: form.conteudo,
          variaveis: form.variaveis,
          ativo: true,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template criado!');
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] });
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('ID não encontrado');
      const { error } = await supabase
        .from('notification_templates')
        .update({
          categoria: form.categoria,
          nome: form.nome,
          assunto: form.assunto,
          conteudo: form.conteudo,
          variaveis: form.variaveis,
        })
        .eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template atualizado!');
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] });
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template deletado!');
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] });
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const resetForm = () => {
    setForm({ categoria: '', nome: '', assunto: '', conteudo: '', variaveis: [] });
    setEditingId(null);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpenDialog(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setForm({
      categoria: template.categoria,
      nome: template.nome,
      assunto: template.assunto,
      conteudo: template.conteudo,
      variaveis: template.variaveis || [],
    });
    setEditingId(template.id);
    setIsOpenDialog(true);
  };

  const handleSave = () => {
    if (!form.categoria || !form.nome || !form.assunto || !form.conteudo.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handlePreview = (template: NotificationTemplate) => {
    let previewHtml = template.conteudo;
    const exemplo = VARIAVEIS_EXEMPLO[template.categoria] || {};

    Object.entries(exemplo).forEach(([key, value]) => {
      previewHtml = previewHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    setPreview(previewHtml);
    setPreviewDialog(true);
  };

  const getCategoriaLabel = (cat: string) => {
    return CATEGORIAS.find(c => c.value === cat)?.label || cat;
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Templates de Email
          </h1>
          <p className="text-muted-foreground">Personalize as mensagens automáticas da sua clínica</p>
        </div>
        <Button onClick={handleOpen} className="gap-2"><Plus className="h-4 w-4" />Novo Template</Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            placeholder="Buscar template..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as categorias</SelectItem>
            {CATEGORIAS.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-semibold">Nenhum template encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <motion.div key={template.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.nome}</CardTitle>
                      <Badge variant="outline" className="mb-2">{getCategoriaLabel(template.categoria)}</Badge>
                    </div>
                    <Badge variant={template.ativo ? 'default' : 'secondary'}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assunto:</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded truncate">{template.assunto}</p>
                  </div>

                  {template.variaveis && template.variaveis.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Variáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variaveis.map(v => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nome">Nome do Template *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => setForm({...form, nome: e.target.value})}
                placeholder="Ex: Lembrete 24h antes"
              />
            </div>

            <div>
              <Label htmlFor="assunto">Assunto do Email *</Label>
              <Input
                id="assunto"
                value={form.assunto}
                onChange={e => setForm({...form, assunto: e.target.value})}
                placeholder="Ex: Lembrete: {{paciente_nome}}, sua consulta é amanhã"
              />
            </div>

            <div>
              <Label htmlFor="conteudo">Conteúdo HTML *</Label>
              <Textarea
                id="conteudo"
                value={form.conteudo}
                onChange={e => setForm({...form, conteudo: e.target.value})}
                placeholder="Cole seu HTML aqui. Use {{variavel}} para placeholders"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Dica: Use HTML simples. Variáveis: {{paciente_nome}}, {{data}}, {{horario}}, {{medico_nome}}, {{clinica_nome}}, etc
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Email</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded p-4 bg-white text-foreground"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
