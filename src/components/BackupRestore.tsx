import { useState, useRef } from 'react';
import { Download, Upload, Database, Trash2, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  downloadBackup, 
  validateBackup, 
  restoreBackup, 
  clearAllData, 
  getStorageStats,
  BackupData 
} from '@/lib/backup';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLLECTION_LABELS: Record<string, string> = {
  pacientes: 'Pacientes',
  agendamentos: 'Agendamentos',
  prontuarios: 'Prontuários',
  prescricoes: 'Prescrições',
  atestados: 'Atestados',
  lancamentos: 'Lançamentos Financeiros',
  estoque: 'Itens de Estoque',
  users: 'Usuários',
  convenios: 'Convênios',
  salas: 'Salas',
  fila: 'Fila de Atendimento',
  prescription_templates: 'Templates de Prescrição',
  certificate_templates: 'Templates de Atestado',
  audit_log: 'Histórico de Alterações',
};

export function BackupRestore() {
  const [stats, setStats] = useState(() => getStorageStats());
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    downloadBackup();
    toast({
      title: 'Backup criado',
      description: 'O arquivo de backup foi baixado com sucesso.',
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const validation = validateBackup(data);
        
        if (!validation.valid) {
          toast({
            title: 'Erro no arquivo',
            description: validation.error,
            variant: 'destructive',
          });
          return;
        }

        setPreviewData(validation.backup!);
        setShowPreview(true);
      } catch {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'O arquivo não é um JSON válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestore = async () => {
    if (!previewData) return;
    
    setRestoring(true);
    
    // Simulate progress
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = restoreBackup(previewData, overwrite);
    
    setRestoring(false);
    setShowPreview(false);
    setStats(getStorageStats());
    
    toast({
      title: 'Backup restaurado',
      description: `${result.restored} registros foram restaurados com sucesso.`,
    });
  };

  const handleClearAll = () => {
    clearAllData();
    setStats(getStorageStats());
    setShowClearDialog(false);
    
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram removidos. Recarregue a página para ver as alterações.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Fazer Backup
            </CardTitle>
            <CardDescription>
              Baixe todos os dados do sistema em um arquivo JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span>Espaço utilizado: {stats.used}</span>
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Baixar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restaurar Backup
            </CardTitle>
            <CardDescription>
              Carregue um arquivo de backup para restaurar os dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Arquivo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Atuais
          </CardTitle>
          <CardDescription>
            Resumo dos dados armazenados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.collections)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([collection, count]) => (
                <div key={collection} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{COLLECTION_LABELS[collection] || collection}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="destructive" 
              onClick={() => setShowClearDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Todos os Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Backup</DialogTitle>
            <DialogDescription>
              Revise os dados antes de restaurar
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data do backup:</span>
                  <p className="font-medium">
                    {format(new Date(previewData.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total de registros:</span>
                  <p className="font-medium">{previewData.metadata.totalRecords}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(previewData.metadata.collectionCounts)
                  .filter(([_, count]) => count > 0)
                  .map(([collection, count]) => (
                    <div key={collection} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                      <span className="text-sm">{COLLECTION_LABELS[collection] || collection}</span>
                      <Badge>{count} registros</Badge>
                    </div>
                  ))}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="overwrite">Substituir dados existentes</Label>
                    <Switch id="overwrite" checked={overwrite} onCheckedChange={setOverwrite} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overwrite 
                      ? 'Dados existentes serão substituídos' 
                      : 'Apenas novos registros serão adicionados'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? (
                <>Restaurando...</>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Restaurar Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do sistema serão permanentemente removidos.
              Recomendamos fazer um backup antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
              Sim, limpar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
