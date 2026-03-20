import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Filter, Trash2, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useToast } from '@/hooks/use-toast';
import { 
  getAuditLog, 
  clearAuditLog, 
  AuditEntry,
  COLLECTION_LABELS,
  ACTION_LABELS 
} from '@/lib/auditTrail';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { exportAuditEntriesAsCsv, exportAuditEntriesAsJson } from '@/lib/auditExport';

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (filterCollection !== 'all') filters.collection = filterCollection;
    if (filterAction !== 'all') filters.action = filterAction;

    // Date filters: interpret as local day boundaries
    if (filterStartDate) {
      const start = new Date(`${filterStartDate}T00:00:00`);
      filters.startDate = start.toISOString();
    }
    if (filterEndDate) {
      const end = new Date(`${filterEndDate}T23:59:59.999`);
      filters.endDate = end.toISOString();
    }

    setEntries(getAuditLog(filters));
  }, [filterCollection, filterAction, filterStartDate, filterEndDate]);

  const handleClear = () => {
    clearAuditLog();
    setEntries([]);
    setShowClearDialog(false);
    toast({
      title: 'Histórico limpo',
      description: 'O histórico de alterações foi removido.',
    });
  };

  const filteredEntries = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    const u = filterUser.trim().toLowerCase();

    return entries.filter((e) => {
      if (u) {
        const userHay = `${e.userName ?? ''} ${e.userId ?? ''}`.toLowerCase();
        if (!userHay.includes(u)) return false;
      }

      if (q) {
        const changesHay = (e.changes || [])
          .map((c) => `${c.field} ${String(c.oldValue ?? '')} ${String(c.newValue ?? '')}`)
          .join(' ')
          .toLowerCase();
        const hay = `${e.recordName ?? ''} ${e.recordId ?? ''} ${e.collection} ${e.action} ${changesHay}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [entries, filterSearch, filterUser]);

  const handleExportJson = () => {
    if (filteredEntries.length === 0) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportAuditEntriesAsJson(filteredEntries, `historico-alteracoes-${dateStr}.json`);
  };

  const handleExportCsv = () => {
    if (filteredEntries.length === 0) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportAuditEntriesAsCsv(filteredEntries, `historico-alteracoes-${dateStr}.csv`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Alterações
            </CardTitle>
            <CardDescription>
              Registro de todas as mudanças no sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadEntries}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {filteredEntries.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-2">
                  <Download className="h-4 w-4" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </>
            )}
            {entries.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowClearDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex-1">
            <Select value={filterCollection} onValueChange={setFilterCollection}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por coleção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as coleções</SelectItem>
                {Object.entries(COLLECTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">De</div>
            <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Até</div>
            <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Buscar</div>
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Paciente, registro, campo alterado…"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Usuário</div>
            <Input
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Nome ou ID do usuário"
            />
          </div>
        </div>

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma alteração registrada</p>
            <p className="text-sm">As mudanças no sistema aparecerão aqui</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn('text-xs', ACTION_COLORS[entry.action])}>
                          {ACTION_LABELS[entry.action]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {COLLECTION_LABELS[entry.collection] || entry.collection}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {entry.recordName || entry.recordId}
                      </p>
                      {(entry.userName || entry.userId) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(entry.userName || 'Usuário')}{entry.userId ? ` (${entry.userId})` : ''}
                        </p>
                      )}
                      {entry.changes && entry.changes.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {entry.changes.slice(0, 3).map((change, idx) => (
                            <div key={idx}>
                              <span className="font-medium">{change.field}:</span>{' '}
                              {change.oldValue !== undefined && (
                                <span className="line-through text-red-500">{String(change.oldValue).substring(0, 20)}</span>
                              )}
                              {change.oldValue !== undefined && change.newValue !== undefined && ' → '}
                              {change.newValue !== undefined && (
                                <span className="text-green-600">{String(change.newValue).substring(0, 20)}</span>
                              )}
                            </div>
                          ))}
                          {entry.changes.length > 3 && (
                            <span className="text-muted-foreground">+{entry.changes.length - 3} mais alterações</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <p>{format(parseISO(entry.timestamp), 'dd/MM/yyyy')}</p>
                      <p>{format(parseISO(entry.timestamp), 'HH:mm')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Clear Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todo o histórico de alterações será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground">
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
