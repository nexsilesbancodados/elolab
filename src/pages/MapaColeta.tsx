import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, RefreshCw, Loader2, RotateCcw, XCircle, Search, Printer, FlaskConical,
  AlertTriangle, Clock, Zap, MapPin, User, Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ─── Tipos de tubos laboratoriais ──────────────────────────
const TUBOS = [
  { color: 'bg-purple-500', label: 'EDTA (Roxo)', nome: 'Roxo', volume: '4mL' },
  { color: 'bg-yellow-400', label: 'Soro (Amarelo)', nome: 'Amarelo', volume: '5mL' },
  { color: 'bg-red-500', label: 'Seco (Vermelho)', nome: 'Vermelho', volume: '5mL' },
  { color: 'bg-blue-400', label: 'Citrato (Azul)', nome: 'Azul', volume: '3.6mL' },
  { color: 'bg-gray-400', label: 'Fluoreto (Cinza)', nome: 'Cinza', volume: '4mL' },
  { color: 'bg-green-500', label: 'Heparina (Verde)', nome: 'Verde', volume: '4mL' },
  { color: 'bg-orange-400', label: 'Swab (Laranja)', nome: 'Laranja', volume: '—' },
  { color: 'bg-amber-300', label: 'Coletor Urina', nome: 'Âmbar', volume: '—' },
  { color: 'bg-amber-700', label: 'Coletor Fezes', nome: 'Marrom', volume: '—' },
];

const tuboColor = (tubo: string | null) => TUBOS.find(t => t.label === tubo)?.color ?? 'bg-muted';
const tuboNome = (tubo: string | null) => TUBOS.find(t => t.label === tubo)?.nome ?? tubo ?? '—';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const calcAge = (dob: string | null) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const waitTimeLabel = (created: string) => {
  const mins = differenceInMinutes(new Date(), new Date(created));
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  return `${h}h${mins % 60 > 0 ? `${mins % 60}m` : ''}`;
};

const waitTimeColor = (created: string) => {
  const mins = differenceInMinutes(new Date(), new Date(created));
  if (mins > 60) return 'text-destructive font-bold';
  if (mins > 30) return 'text-warning font-semibold';
  return 'text-muted-foreground';
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

// ─── Main Component ────────────────────────────────────────
export default function MapaColeta() {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tuboFiltro, setTuboFiltro] = useState('Todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(new Date());
  const [cancelarId, setCancelarId] = useState<string | null>(null);

  // Tick every 30s for wait time updates
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const fetchColetas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coletas_laboratorio')
      .select(`
        id, codigo_amostra, status, created_at, observacoes, tipo_amostra,
        tubo, urgente, jejum_necessario, jejum_horas, volume_ml,
        sitio_coleta, condicao_amostra, data_coleta,
        pacientes(nome, cpf, data_nascimento, sexo, convenios(nome)),
        medicos(nome, crm),
        exames(tipo_exame)
      `)
      .in('status', ['pendente', 'coletado', 'recoleta'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Actions ─────────────────────────────────────────────
  const handleColetar = async (id: string) => {
    const { error } = await supabase
      .from('coletas_laboratorio')
      .update({ status: 'coletado', data_coleta: new Date().toISOString() })
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
    const { error } = await supabase
      .from('coletas_laboratorio')
      .update({ status: 'cancelado' })
      .eq('id', id);
    if (error) toast.error('Erro ao cancelar coleta');
    else { toast.success('Coleta cancelada'); fetchColetas(); }
    setCancelarId(null);
  };

  const handleBulkPrint = () => {
    if (selected.size === 0) { toast.error('Selecione ao menos uma coleta'); return; }
    const selectedItems = itens.filter(i => selected.has(i.id));
    const labels = selectedItems.map(i =>
      `${i.codigo_amostra} | ${i.pacientes?.nome} | ${i.tubo ?? i.tipo_amostra} | ${i.exames?.tipo_exame ?? ''}`
    ).join('\n');
    // Simple print preview
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<html><head><title>Etiquetas</title><style>
        body { font-family: monospace; font-size: 12px; }
        .label { border: 1px dashed #999; padding: 8px; margin: 4px 0; page-break-inside: avoid; }
        .code { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
        @media print { .no-print { display: none; } }
      </style></head><body>
        <button class="no-print" onclick="window.print()">🖨️ Imprimir</button>
        <h3 class="no-print">${selected.size} etiqueta(s)</h3>
        ${selectedItems.map(i => `
          <div class="label">
            <div class="code">${i.codigo_amostra}</div>
            <div><strong>${i.pacientes?.nome}</strong></div>
            <div>${calcAge(i.pacientes?.data_nascimento) ?? '?'}a — ${i.pacientes?.sexo === 'M' ? 'Masc' : i.pacientes?.sexo === 'F' ? 'Fem' : '?'}</div>
            <div>Tubo: ${i.tubo ?? i.tipo_amostra} | Exame: ${i.exames?.tipo_exame ?? '—'}</div>
            <div>${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          </div>
        `).join('')}
      </body></html>`);
      w.document.close();
    }
    toast.success(`${selected.size} etiqueta(s) gerada(s)`);
  };

  // ─── Filtering ───────────────────────────────────────────
  const filtrado = useMemo(() => itens.filter(item => {
    if (tuboFiltro !== 'Todos' && item.tubo !== tuboFiltro) return false;
    if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false;
    if (search.trim()) {
      const q = normalize(search.trim());
      if (
        !normalize(item.pacientes?.nome ?? '').includes(q) &&
        !normalize(item.pacientes?.cpf ?? '').includes(q) &&
        !normalize(item.codigo_amostra ?? '').includes(q) &&
        !normalize(item.exames?.tipo_exame ?? '').includes(q)
      ) return false;
    }
    return true;
  }), [itens, tuboFiltro, statusFiltro, search]);

  const pendentes = filtrado.filter(i => i.status === 'pendente');
  const recoletas = filtrado.filter(i => i.status === 'recoleta');
  const coletados = filtrado.filter(i => i.status === 'coletado');
  const aguardando = [...recoletas, ...pendentes];

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  const toggleAll = (items: any[]) => {
    const ids = items.map(i => i.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'coletado') return <Badge className="bg-success/10 text-success border-success/20">Coletado</Badge>;
    if (status === 'recoleta') return <Badge variant="destructive" className="gap-1"><RotateCcw className="h-3 w-3" />Recoleta</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  // ─── Row component ──────────────────────────────────────
  const ColetaRow = ({ item, idx, showActions = true }: { item: any; idx: number; showActions?: boolean }) => {
    const age = calcAge(item.pacientes?.data_nascimento);
    const sexo = item.pacientes?.sexo === 'M' ? 'M' : item.pacientes?.sexo === 'F' ? 'F' : '—';
    const convenio = (item.pacientes as any)?.convenios?.nome ?? 'Particular';
    const isUrgent = item.urgente;

    return (
      <tr className={cn(
        'border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors',
        isUrgent && 'bg-destructive/5',
        !showActions && 'opacity-70',
      )}>
        {/* Checkbox */}
        <td className="px-3 py-2">
          <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
        </td>
        {/* # */}
        <td className="px-2 py-2 text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</td>
        {/* Código */}
        <td className="px-3 py-2">
          <span className="font-mono text-xs text-primary font-semibold">{item.codigo_amostra}</span>
        </td>
        {/* Paciente */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            {isUrgent && <span title="Urgente"><Zap className="h-3.5 w-3.5 text-destructive flex-shrink-0" /></span>}
            <div>
              <p className={cn('font-medium text-sm', isUrgent && 'text-destructive')}>{item.pacientes?.nome ?? '—'}</p>
              <p className="text-[11px] text-muted-foreground">
                {age !== null ? `${age}a` : '?'} · {sexo}
                {item.pacientes?.cpf ? ` · ${item.pacientes.cpf}` : ''}
              </p>
            </div>
          </div>
        </td>
        {/* Convênio */}
        <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">{convenio}</td>
        {/* Tubo */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5" title={item.tubo ?? item.tipo_amostra}>
            <div className={cn('w-3 h-5 rounded-sm flex-shrink-0', tuboColor(item.tubo))} />
            <span className="text-xs">{tuboNome(item.tubo)}</span>
          </div>
        </td>
        {/* Exame */}
        <td className="px-3 py-2 text-xs hidden lg:table-cell">
          {item.exames?.tipo_exame ?? <span className="text-muted-foreground">—</span>}
        </td>
        {/* Jejum */}
        <td className="px-3 py-2 text-center hidden md:table-cell">
          {item.jejum_necessario ? (
            <Badge variant="outline" className="text-[10px] gap-0.5">
              <Droplets className="h-2.5 w-2.5" />{item.jejum_horas ?? '?'}h
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </td>
        {/* Espera */}
        <td className="px-3 py-2 text-center hidden sm:table-cell">
          {item.created_at ? (
            <span className={cn('text-xs tabular-nums flex items-center justify-center gap-1', waitTimeColor(item.created_at))}>
              <Clock className="h-3 w-3" />
              {waitTimeLabel(item.created_at)}
            </span>
          ) : '—'}
        </td>
        {/* Status */}
        <td className="px-3 py-2 text-center"><StatusBadge status={item.status} /></td>
        {/* Ações */}
        <td className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            {showActions && item.status !== 'coletado' && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleColetar(item.id)}>
                <CheckCircle2 className="h-3 w-3" /> Coletar
              </Button>
            )}
            {item.status === 'coletado' && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-warning" onClick={() => handleRecoleta(item.id)}>
                <RotateCcw className="h-3 w-3" /> Recoleta
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => setCancelarId(item.id)}>
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const TableHead = ({ items, label }: { items: any[]; label: string }) => (
    <thead>
      <tr className="border-b border-border bg-muted/30">
        <th className="px-3 py-2.5 w-8">
          <Checkbox
            checked={items.length > 0 && items.every(i => selected.has(i.id))}
            onCheckedChange={() => toggleAll(items)}
          />
        </th>
        <th className="px-2 py-2.5 text-xs font-medium text-muted-foreground w-8">#</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left">Código</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left">Paciente</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left hidden md:table-cell">Convênio</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left">Tubo</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-left hidden lg:table-cell">Exame</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center hidden md:table-cell">Jejum</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center hidden sm:table-cell">Espera</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">Status</th>
        <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-right">Ações</th>
      </tr>
    </thead>
  );

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
            Central de comando — {pendentes.length} aguardando · {recoletas.length} recoleta · {coletados.length} coletados
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="default" className="gap-2" onClick={handleBulkPrint}>
              <Printer className="h-4 w-4" /> Imprimir {selected.size} Etiqueta(s)
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={fetchColetas}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Aguardando', value: pendentes.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Recoleta', value: recoletas.length, icon: RotateCcw, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Coletados', value: coletados.length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Urgentes', value: filtrado.filter(i => i.urgente).length, icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map(s => (
          <Card key={s.label} className="kpi-card">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', s.bg)}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 w-64" placeholder="Nome, CPF, código ou exame..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={tuboFiltro} onValueChange={setTuboFiltro}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo de Tubo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tubos</SelectItem>
            {TUBOS.map(t => (
              <SelectItem key={t.label} value={t.label}>
                <span className="flex items-center gap-2">
                  <span className={cn('h-3 w-2 rounded-sm', t.color)} />
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="coletado">Coletado</SelectItem>
            <SelectItem value="recoleta">Recoleta</SelectItem>
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            {selected.size} selecionado(s)
            <button className="ml-1 hover:text-destructive" onClick={() => setSelected(new Set())}>✕</button>
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
          {/* Aguardando / Recoleta */}
          {aguardando.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    Aguardando Coleta ({aguardando.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <TableHead items={aguardando} label="Aguardando" />
                    <tbody>
                      {aguardando.map((item, idx) => (
                        <ColetaRow key={item.id} item={item} idx={idx} showActions />
                      ))}
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
                    Coletados ({coletados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <TableHead items={coletados} label="Coletados" />
                    <tbody>
                      {coletados.map((item, idx) => (
                        <ColetaRow key={item.id} item={item} idx={idx} showActions={false} />
                      ))}
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
      {/* Confirm cancel dialog */}
      <AlertDialog open={!!cancelarId} onOpenChange={(open) => !open && setCancelarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar coleta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta coleta será marcada como cancelada. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelarId && handleCancelar(cancelarId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Coleta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
