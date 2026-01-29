// Backup and Restore System
import { format } from 'date-fns';

const COLLECTIONS = [
  'pacientes',
  'agendamentos',
  'prontuarios',
  'prescricoes',
  'atestados',
  'lancamentos',
  'estoque',
  'users',
  'convenios',
  'salas',
  'fila',
  'prescription_templates',
  'certificate_templates',
  'audit_log',
];

const DB_PREFIX = 'elolab_clinic_';

export interface BackupData {
  version: string;
  createdAt: string;
  collections: Record<string, any[]>;
  metadata: {
    totalRecords: number;
    collectionCounts: Record<string, number>;
  };
}

export function createBackup(): BackupData {
  const collections: Record<string, any[]> = {};
  const collectionCounts: Record<string, number> = {};
  let totalRecords = 0;

  COLLECTIONS.forEach(collection => {
    const key = DB_PREFIX + collection;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        collections[collection] = parsed;
        collectionCounts[collection] = Array.isArray(parsed) ? parsed.length : 0;
        totalRecords += collectionCounts[collection];
      } catch {
        collections[collection] = [];
        collectionCounts[collection] = 0;
      }
    } else {
      collections[collection] = [];
      collectionCounts[collection] = 0;
    }
  });

  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    collections,
    metadata: {
      totalRecords,
      collectionCounts,
    },
  };
}

export function downloadBackup(): void {
  const backup = createBackup();
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

export function restoreBackup(backup: BackupData, overwrite: boolean = true): { success: boolean; restored: number } {
  let restored = 0;

  Object.entries(backup.collections).forEach(([collection, data]) => {
    if (COLLECTIONS.includes(collection)) {
      const key = DB_PREFIX + collection;
      
      if (overwrite) {
        localStorage.setItem(key, JSON.stringify(data));
        restored += Array.isArray(data) ? data.length : 0;
      } else {
        // Merge with existing data
        const existing = localStorage.getItem(key);
        let existingData: any[] = [];
        if (existing) {
          try {
            existingData = JSON.parse(existing);
          } catch {}
        }
        
        if (Array.isArray(data) && Array.isArray(existingData)) {
          const existingIds = new Set(existingData.map((item: any) => item.id));
          const newItems = data.filter((item: any) => !existingIds.has(item.id));
          const merged = [...existingData, ...newItems];
          localStorage.setItem(key, JSON.stringify(merged));
          restored += newItems.length;
        }
      }
    }
  });

  return { success: true, restored };
}

export function clearAllData(): void {
  COLLECTIONS.forEach(collection => {
    localStorage.removeItem(DB_PREFIX + collection);
  });
}

export function getStorageStats(): { used: string; collections: Record<string, number> } {
  const collectionCounts: Record<string, number> = {};
  let totalSize = 0;

  COLLECTIONS.forEach(collection => {
    const key = DB_PREFIX + collection;
    const data = localStorage.getItem(key);
    if (data) {
      totalSize += data.length;
      try {
        const parsed = JSON.parse(data);
        collectionCounts[collection] = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        collectionCounts[collection] = 0;
      }
    }
  });

  // Convert bytes to human readable
  const kb = totalSize / 1024;
  const mb = kb / 1024;
  const used = mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;

  return { used, collections: collectionCounts };
}
