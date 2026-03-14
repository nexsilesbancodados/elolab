import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, Loader2, RotateCcw, XCircle, Search, Printer, FlaskConical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ─── Tipos de tubos laboratoriais ──────────────────────────
const TUBOS = [
  { color: 'bg-purple-500', label: 'Sangue (EDTA)', nome: 'Roxo', volume: '4mL' },
  { color: 'bg-yellow-400', label: 'Soro', nome: 'Amarelo', volume: '5mL' },
  { color: 'bg-red-500', label: 'Sangue (Seco)', nome: 'Vermelho', volume: '5mL' },
  { color: 'bg-blue-400', label: 'Sangue (Citrato)', nome: 'Azul', volume: '3.6mL' },
  { color: 'bg-gray-400', label: 'Sangue (Fluoreto)', nome: 'Cinza', volume: '4mL' },
  { color: 'bg-green-500', label: 'Sangue (Heparina)', nome: 'Verde', volume: '4mL' },
  { color: 'bg-orange-400', label: 'Swab', nome: 'Laranja', volume: '—' },
  { color: 'bg-pink-400', label: 'Líquor', nome: 'Rosa', volume: '—' },
  { color: 'bg-amber-300', label: 'Urina', nome: 'Âmbar', volume: '—' },
  { color: 'bg-amber-700', label: 'Fezes', nome: 'Marrom', volume: '—' },
];

const tuboColor = (mat: string) => TUBOS.find(t => t.label === mat)?.color ?? 'bg-muted';
const tuboNome = (mat: string) => TUBOS.find(t => t.label === mat)?.nome ?? mat;

const SETORES = ['Todos', 'Hematologia', 'Bioquímica', 'Hormônios', 'Imunologia', 'Urinálise', 'Parasitologia', 'Microbiologia', 'Gasometria'];
const MATERIAIS = ['Todos', 'Sangue (EDTA)', 'Soro', 'Sangue (Seco)', 'Sangue (Citrato)', 'Sangue (Fluoreto)', 'Sangue (Heparina)', 'Urina', 'Fezes', 'Swab', 'Líquor'];

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ─── Main Component ────────────────────────────────────────
export default function MapaColeta() {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [setor, setSetor] = useState('Todos');
  const [material, setMaterial] = useState('Todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  const fetchColetas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coletas_laboratorio')
      .select(`
        id, codigo, status, created_at, observacoes,
        pacientes(nome, cpf, data_nascimento),
        convenios(nome),
        resultados_laboratorio(id, exame_id, status, setor, material_biologico, coletado_em,
          exames(nome, setor))
      `)
      .in('status', ['pendente', 'coletado', 'recoleta'])
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar mapa de coleta');
    } else {
      setItens(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchColetas();
    const channel = supabase.channel('mapa-coleta-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coletas_laboratorio' }, fetchColetas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_laboratorio' }, fetchColetas)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleColetar = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('coletas_laboratorio')
      .update({ status: 'coletado', updated_at: now })
      .eq('id', id);
    if (error) toast.error('Erro ao registrar coleta');
    else { toast.success('Coleta registrada!'); fetchColetas(); }
  };

  const handleRecoleta = async (id: string) => {
    const { error } = await supabase
      .from('coletas_laboratorio')
      .update({ status: 'recoleta' })
      .eq('id', id);
    if (error) toast.error('Erro'); else { toast.warning('Recoleta solicitada'); fetchColetas(); }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar esta coleta?')) return;
    const { error } = await supabase
      .from('coletas_laboratorio')
      .update({ status: 'cancelado' })
      .eq('id', id);
    if (error) toast.error('Erro'); else { toast.success('Coleta cancelada'); fetchColetas(); }
  };

  const getMateriais = (item: any) =>
    [...new Set((item.resultados_laboratorio ?? []).map((r: any) => r.material_biologico).filter(Boolean))];
  const getSetores = (item: any) =>
    [...new Set((item.resultados_laboratorio ?? []).map((r: any) => r.exames?.setor ?? r.setor).filter(Boolean))];

  const filtrado = itens.filter(item => {
    const mats = getMateriais(item);
    const sets = getSetores(item);
    if (setor !== 'Todos' && !sets.includes(setor)) return false;
    if (material !== 'Todos' && !mats.includes(material)) return false;
    if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false;
    if (search.trim()) {
      const q = normalize(search.trim());
      const nomes = (item.resultados_laboratorio ?? []).map((r: any) => normalize(r.exames?.nome ?? ''));
      if (
        !normalize(item.pacientes?.nome ?? '').includes(q) &&
        !normalize(item.pacientes?.cpf ?? '').includes(q) &&
        !normalize(item.codigo ?? '').includes(q) &&
        !nomes.some((n: string) => n.includes(q))
      ) return false;
    }
    return true;
  });

  const pendentes = filtrado.filter(i => i.status === 'pendente');
  const coletados = filtrado.filter(i => i.status === 'coletado');
  const recoleta = filtrado.filter(i => i.status === 'recoleta');

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'coletado') return <Badge className="bg-success/10 text-success border-success/20">Coletado</Badge>;
    if (status === 'recoleta') return <Badge variant="destructive">Recoleta</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Mapa de Coleta
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendentes.length} aguardando · {recoleta.length} recoleta · {coletados.length} coletados · ordem FIFO
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchColetas}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Legenda de Tubos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Legenda de Tubos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TUBOS.map(t => (
              <div key={t.label} className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5">
                <div className={cn('h-5 w-3 rounded-sm', t.color)} />
                <div>
                  <p className="text-[11px] font-medium leading-none">{t.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{t.volume}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-64"
            placeholder="Nome, CPF, código ou exame..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>{SETORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Material" /></SelectTrigger>
          <SelectContent>{MATERIAIS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="coletado">Coletado</SelectItem>
            <SelectItem value="recoleta">Recoleta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
          {/* Aguardando / Recoleta */}
          {(pendentes.length > 0 || recoleta.length > 0) && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    Aguardando Coleta ({pendentes.length + recoleta.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">#</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Código</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Paciente</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Convênio</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tubos</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Setores</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Entrada</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...recoleta, ...pendentes].map((item, idx) => {
                        const mats = getMateriais(item) as string[];
                        const sets = getSetores(item) as string[];
                        return (
                          <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2 text-xs font-bold text-muted-foreground">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono text-xs text-primary font-semibold">{item.codigo ?? '—'}</td>
                            <td className="px-4 py-2">
                              <p className="font-medium">{item.pacientes?.nome ?? '—'}</p>
                              <p className="text-[11px] text-muted-foreground">{item.pacientes?.cpf ?? ''}</p>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">{item.convenios?.nome ?? 'Particular'}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1 items-center">
                                {mats.slice(0, 5).map(m => (
                                  <div key={m} className="flex flex-col items-center" title={`${m} — ${tuboNome(m)}`}>
                                    <div className={cn('w-3 h-5 rounded-sm', tuboColor(m))} />
                                    <span className="text-[8px] text-muted-foreground mt-0.5">{tuboNome(m)}</span>
                                  </div>
                                ))}
                                {mats.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 hidden lg:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {sets.slice(0, 2).map(s => (
                                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                                ))}
                                {sets.length > 2 && <span className="text-[10px] text-muted-foreground">+{sets.length - 2}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center"><StatusBadge status={item.status} /></td>
                            <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">
                              {item.created_at ? format(new Date(item.created_at), "dd/MM HH:mm", { locale: ptBR }) : '—'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleColetar(item.id)}>
                                  <CheckCircle2 className="h-3 w-3" /> Coletar
                                </Button>
                                {item.status === 'recoleta' && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => handleColetar(item.id)}>
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleCancelar(item.id)}>
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Coletados */}
          {coletados.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    Coletados Hoje ({coletados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Código</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Paciente</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Convênio</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tubos</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Exames</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coletados.map(item => {
                        const mats = getMateriais(item) as string[];
                        const exames = item.resultados_laboratorio ?? [];
                        return (
                          <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors opacity-70">
                            <td className="px-4 py-2 font-mono text-xs text-primary font-semibold">{item.codigo ?? '—'}</td>
                            <td className="px-4 py-2">
                              <p className="font-medium">{item.pacientes?.nome ?? '—'}</p>
                              <p className="text-[11px] text-muted-foreground">{item.pacientes?.cpf ?? ''}</p>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">{item.convenios?.nome ?? 'Particular'}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                {mats.slice(0, 4).map(m => (
                                  <div key={m} className={cn('w-3 h-5 rounded-sm', tuboColor(m))} title={tuboNome(m)} />
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{exames.length}</td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-warning" onClick={() => handleRecoleta(item.id)}>
                                <RotateCcw className="h-3 w-3" /> Recoleta
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {filtrado.length === 0 && !loading && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FlaskConical className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhuma coleta encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou aguarde novos atendimentos</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
