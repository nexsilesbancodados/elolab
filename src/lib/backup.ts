// Backup and Restore System - Supabase version
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_TABLES = [
  'pacientes',
  'agendamentos',
  'prontuarios',
  'prescricoes',
  'atestados',
  'lancamentos',
  'estoque',
  'convenios',
  'salas',
  'fila_atendimento',
  'templates_prescricao',
  'templates_atestado',
  'medicos',
  'funcionarios',
  'exames',
  'encaminhamentos',
  'lista_espera',
] as const;

const TABLE_LABELS: Record<string, string> = {
  pacientes: 'Pacientes',
  agendamentos: 'Agendamentos',
  prontuarios: 'Prontuários',
  prescricoes: 'Prescrições',
  atestados: 'Atestados',
  lancamentos: 'Lançamentos Financeiros',
  estoque: 'Itens de Estoque',
  convenios: 'Convênios',
  salas: 'Salas',
  fila_atendimento: 'Fila de Atendimento',
  templates_prescricao: 'Templates de Prescrição',
  templates_atestado: 'Templates de Atestado',
  medicos: 'Médicos',
  funcionarios: 'Funcionários',
  exames: 'Exames',
  encaminhamentos: 'Encaminhamentos',
  lista_espera: 'Lista de Espera',
};

export interface BackupData {
  version: string;
  createdAt: string;
  collections: Record<string, any[]>;
  metadata: {
    totalRecords: number;
    collectionCounts: Record<string, number>;
  };
}

export async function createBackup(): Promise<BackupData> {
  const collections: Record<string, any[]> = {};
  const collectionCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const table of SUPABASE_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`Erro ao exportar ${table}:`, error.message);
        collections[table] = [];
        collectionCounts[table] = 0;
      } else {
        collections[table] = data || [];
        collectionCounts[table] = data?.length || 0;
        totalRecords += collectionCounts[table];
      }
    } catch {
      collections[table] = [];
      collectionCounts[table] = 0;
    }
  }

  return {
    version: '2.0.0',
    createdAt: new Date().toISOString(),
    collections,
    metadata: {
      totalRecords,
      collectionCounts,
    },
  };
}

export async function downloadBackup(): Promise<void> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `elolab-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackup(data: any): { valid: boolean; error?: string; backup?: BackupData } {
  if (!data) {
    return { valid: false, error: 'Arquivo vazio ou inválido' };
  }

  if (!data.version || !data.createdAt || !data.collections) {
    return { valid: false, error: 'Formato de backup inválido' };
  }

  if (typeof data.collections !== 'object') {
    return { valid: false, error: 'Coleções de dados inválidas' };
  }

  return { valid: true, backup: data as BackupData };
}

export async function restoreBackup(backup: BackupData, overwrite: boolean = true): Promise<{ success: boolean; restored: number }> {
  let restored = 0;

  // Order matters for foreign keys - restore parents first
  const orderedTables = [
    'convenios', 'medicos', 'funcionarios', 'salas',
    'pacientes', 'agendamentos', 'prontuarios', 'prescricoes',
    'atestados', 'lancamentos', 'estoque', 'exames',
    'encaminhamentos', 'lista_espera', 'fila_atendimento',
    'templates_prescricao', 'templates_atestado',
  ];

  for (const table of orderedTables) {
    const data = backup.collections[table];
    if (!data || !Array.isArray(data) || data.length === 0) continue;

    try {
      if (overwrite) {
        // Upsert - insert or update on conflict
        const { error } = await supabase.from(table as any).upsert(data, { onConflict: 'id' });
        if (error) {
          console.warn(`Erro ao restaurar ${table}:`, error.message);
        } else {
          restored += data.length;
        }
      } else {
        // Insert only new records (ignore conflicts)
        const { error } = await supabase.from(table as any).upsert(data, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.warn(`Erro ao restaurar ${table}:`, error.message);
        } else {
          restored += data.length;
        }
      }
    } catch (err) {
      console.warn(`Erro ao restaurar ${table}:`, err);
    }
  }

  return { success: true, restored };
}

export function clearAllData(): void {
  // This is now a no-op since data is in Supabase
  // Kept for interface compatibility
  console.warn('clearAllData: Para limpar dados do Supabase, use o painel de administração.');
}

export async function getStorageStats(): Promise<{ used: string; collections: Record<string, number> }> {
  const collectionCounts: Record<string, number> = {};

  for (const table of SUPABASE_TABLES) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      collectionCounts[table] = error ? 0 : (count || 0);
    } catch {
      collectionCounts[table] = 0;
    }
  }

  const total = Object.values(collectionCounts).reduce((a, b) => a + b, 0);
  const used = `${total} registros no Supabase`;

  return { used, collections: collectionCounts };
}
