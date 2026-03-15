import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Eye, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Search, AlertTriangle, ShieldCheck, Download, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ─── Detalhe do Laudo Modal ────────────────────────────────
function LaudoDetalheModal({ coletaId, onClose }: { coletaId: string | null; onClose: () => void }) {
  const [coleta, setColeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coletaId) return;
    setLoading(true);
    supabase
      .from('coletas_laboratorio')
      .select(`
        id, codigo, status, created_at, observacoes,
        pacientes(nome, cpf, data_nascimento),
        convenios(nome),
        medicos(crm, especialidade),
        resultados_laboratorio(id, exame_id, status, setor, resultado, valores_referencia,
          unidade, interpretacao, liberado_em, coletado_em,
          exames(nome, setor))
      `)
      .eq('id', coletaId)
      .maybeSingle()
      .then(({ data }) => { setColeta(data); setLoading(false); });
  }, [coletaId]);

  const handleLiberarLaudo = async (resultadoId: string) => {
    const { error } = await supabase
      .from('resultados_laboratorio')
      .update({ liberado: true, data_liberacao: new Date().toISOString() })
      .eq('id', resultadoId);
    if (error) toast.error('Erro ao liberar laudo');
    else {
      toast.success('Laudo liberado!');
      // Refresh
      if (coletaId) {
        const { data } = await supabase
          .from('coletas_laboratorio')
          .select(`id, codigo, status, created_at, observacoes,
            pacientes(nome, cpf, data_nascimento), convenios(nome), medicos(crm, especialidade),
            resultados_laboratorio(id, exame_id, status, setor, resultado, valores_referencia,
              unidade, interpretacao, liberado_em, coletado_em, exames(nome, setor))`)
          .eq('id', coletaId).maybeSingle();
        setColeta(data);
      }
    }
  };

  return (
    <Dialog open={!!coletaId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Laudo — {coleta?.codigo ?? '...'}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : coleta ? (
          <div className="space-y-4">
            {/* Paciente */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border p-4 bg-muted/20">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Paciente</p>
                <p className="font-semibold">{coleta.pacientes?.nome ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">CPF</p>
                <p className="font-medium">{coleta.pacientes?.cpf ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Convênio</p>
                <p className="font-medium">{coleta.convenios?.nome ?? 'Particular'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Entrada</p>
                <p className="font-medium">
                  {coleta.created_at ? format(new Date(coleta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                </p>
              </div>
            </div>

            {/* Resultados */}
            <div className="space-y-2">
              {(coleta.resultados_laboratorio ?? []).map((res: any) => (
                <div key={res.id} className={cn(
                  'rounded-xl border p-3 space-y-2',
                  res.status === 'liberado' ? 'border-success/30 bg-success/5' : 'border-border',
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{res.exames?.nome ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground">{res.setor ?? res.exames?.setor ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {res.status === 'liberado' ? (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Liberado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                  {res.resultado && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Resultado</p>
                        <p className="font-bold text-primary">{res.resultado} {res.unidade ?? ''}</p>
                      </div>
                      {res.valores_referencia && (
                        <div>
                          <p className="text-[11px] text-muted-foreground">Referência</p>
                          <p className="font-medium">{res.valores_referencia}</p>
                        </div>
                      )}
                      {res.interpretacao && (
                        <div>
                          <p className="text-[11px] text-muted-foreground">Interpretação</p>
                          <p className={cn('font-medium text-xs', {
                            'text-destructive': res.interpretacao === 'alterado',
                            'text-success': res.interpretacao === 'normal',
                          })}>{res.interpretacao}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {res.status !== 'liberado' && (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleLiberarLaudo(res.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Liberar este exame
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function LaudosLab() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);

  const fetchLaudos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coletas_laboratorio')
      .select(`
        id, codigo_amostra, status, created_at,
        pacientes(nome, cpf),
        resultados_laboratorio(id, liberado, exames(tipo_exame))
      `)
      .in('status', ['liberado', 'liberado_parcial', 'finalizado', 'coletado'])
      .order('created_at', { ascending: true });

    if (error) toast.error('Erro ao carregar laudos');
    else {
      // Só mostrar coletas que tenham pelo menos 1 resultado
      const comResultados = (data ?? []).filter(c =>
        (c.resultados_laboratorio ?? []).length > 0
      );
      setColetas(comResultados);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLaudos();
    const channel = supabase.channel('laudos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_laboratorio' }, fetchLaudos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coletas_laboratorio' }, fetchLaudos)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getExamesLiberados = (c: any) =>
    (c.resultados_laboratorio ?? []).filter((r: any) => r.status === 'liberado');
  const getExamesPendentes = (c: any) =>
    (c.resultados_laboratorio ?? []).filter((r: any) => r.status !== 'liberado');

  const filtradas = coletas.filter(c => {
    if (!search.trim()) return true;
    const q = normalize(search.trim());
    const nomes = (c.resultados_laboratorio ?? []).map((r: any) => normalize(r.exames?.nome ?? ''));
    return (
      normalize(c.pacientes?.nome ?? '').includes(q) ||
      normalize(c.pacientes?.cpf ?? '').includes(q) ||
      normalize(c.codigo ?? '').includes(q) ||
      nomes.some((n: string) => n.includes(q))
    );
  });

  const totalLiberados = coletas.filter(c => getExamesLiberados(c).length > 0 && getExamesPendentes(c).length === 0).length;
  const totalParciais = coletas.filter(c => getExamesLiberados(c).length > 0 && getExamesPendentes(c).length > 0).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Laudos Laboratoriais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atendimentos com resultados disponíveis · ordem FIFO
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchLaudos}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-xl font-bold">{totalLiberados}</p>
              <p className="text-xs text-muted-foreground">Liberados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xl font-bold">{totalParciais}</p>
              <p className="text-xs text-muted-foreground">Parciais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xl font-bold">{coletas.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Nome, CPF, código ou exame..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum laudo encontrado</p>
            </div>
          ) : (
            <motion.table
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="w-full text-sm"
            >
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Convênio</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Exames</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Entrada</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c, idx) => {
                  const liberados = getExamesLiberados(c);
                  const pendentes = getExamesPendentes(c);
                  const todoLiberado = liberados.length > 0 && pendentes.length === 0;
                  const parcial = liberados.length > 0 && pendentes.length > 0;
                  return (
                    <motion.tr
                      key={c.id}
                      variants={fadeUp}
                      className={cn(
                        'border-b border-border/50 last:border-0 transition-colors',
                        todoLiberado ? 'opacity-60 hover:opacity-100' : 'hover:bg-muted/20',
                      )}
                    >
                      <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-primary font-semibold">{c.codigo ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{c.pacientes?.nome ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{c.pacientes?.cpf ?? ''}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{c.convenios?.nome ?? 'Particular'}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {liberados.slice(0, 3).map((r: any) => (
                            <Badge key={r.id} variant="secondary" className="text-[10px]">{r.exames?.nome ?? '—'}</Badge>
                          ))}
                          {liberados.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{liberados.length - 3}</span>
                          )}
                          {pendentes.length > 0 && (
                            <span className="text-[10px] text-warning flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" />{pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {todoLiberado ? (
                          <Badge className="bg-success/10 text-success border-success/20">Liberado</Badge>
                        ) : parcial ? (
                          <Badge className="bg-warning/10 text-warning border-warning/20">Parcial</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">
                        {c.created_at ? formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true }) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setViewingId(c.id)}
                        >
                          <Eye className="h-3 w-3" /> Visualizar
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </motion.table>
          )}
        </CardContent>
      </Card>

      <LaudoDetalheModal coletaId={viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}
