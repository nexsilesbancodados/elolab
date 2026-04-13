import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const CATEGORIAS = ['confirmacao', 'resultado_exame', 'financeiro'];

export default function TemplatesEmail() {
  const queryClient = useQueryClient();
  const { profile } = useSupabaseAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ nome: '', categoria: '', assunto: '', conteudo: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', profile?.clinica_id],
    queryFn: async () => {
      if (!profile?.clinica_id) return [];
      const { data } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('clinica_id', profile.clinica_id)
        .order('nome');
      return data || [];
    },
    enabled: !!profile?.clinica_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nome || !form.categoria || !form.assunto || !form.conteudo) {
        throw new Error('Preencha todos os campos');
      }
      if (!profile?.clinica_id) throw new Error('Clínica não identificada');

      if (editId) {
        const { error } = await supabase
          .from('notification_templates')
          .update(form)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert([{ ...form, clinica_id: profile.clinica_id, tipo: 'email', ativo: true }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? 'Template atualizado!' : 'Template criado!');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowDialog(false);
      setForm({ nome: '', categoria: '', assunto: '', conteudo: '' });
      setEditId(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template deletado!');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const openNew = () => {
    setForm({ nome: '', categoria: '', assunto: '', conteudo: '' });
    setEditId(null);
    setShowDialog(true);
  };

  const openEdit = (template: any) => {
    setForm(template);
    setEditId(template.id);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Templates de Email</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: any) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.nome}</CardTitle>
              <Badge className="w-fit mt-2">{template.categoria}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{template.assunto}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(template)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteId(template.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar' : 'Novo'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 border rounded">
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assunto</label>
              <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conteúdo (HTML)</label>
              <Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} className="min-h-48 font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {editId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-sm">
            <CardHeader><CardTitle className="text-base">Deletar template?</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                <Button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="bg-red-600">Deletar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
