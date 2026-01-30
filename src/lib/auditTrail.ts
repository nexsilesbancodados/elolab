// Audit Trail System for tracking changes
import { getItem, setItem, generateId } from './storageCore';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  recordId: string;
  recordName?: string;
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  userId?: string;
  userName?: string;
}

const MAX_ENTRIES = 500; // Keep last 500 entries

export function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
  const entries = getItem<AuditEntry[]>('audit_log') || [];
  
  const newEntry: AuditEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  
  entries.unshift(newEntry);
  
  // Keep only the last MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries.splice(MAX_ENTRIES);
  }
  
  setItem('audit_log', entries);
}

export function getAuditLog(filters?: {
  collection?: string;
  action?: AuditEntry['action'];
  startDate?: string;
  endDate?: string;
  limit?: number;
}): AuditEntry[] {
  let entries = getItem<AuditEntry[]>('audit_log') || [];
  
  if (filters) {
    if (filters.collection) {
      entries = entries.filter(e => e.collection === filters.collection);
    }
    if (filters.action) {
      entries = entries.filter(e => e.action === filters.action);
    }
    if (filters.startDate) {
      entries = entries.filter(e => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      entries = entries.filter(e => e.timestamp <= filters.endDate!);
    }
    if (filters.limit) {
      entries = entries.slice(0, filters.limit);
    }
  }
  
  return entries;
}

export function clearAuditLog() {
  setItem('audit_log', []);
}

// Helper to detect changes between objects
export function detectChanges(oldObj: any, newObj: any): { field: string; oldValue: any; newValue: any }[] {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  allKeys.forEach(key => {
    if (key === 'id' || key === 'criadoEm' || key === 'atualizadoEm') return;
    
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  });
  
  return changes;
}

// Collection labels for display
export const COLLECTION_LABELS: Record<string, string> = {
  pacientes: 'Pacientes',
  agendamentos: 'Agendamentos',
  prontuarios: 'Prontuários',
  prescricoes: 'Prescrições',
  atestados: 'Atestados',
  lancamentos: 'Lançamentos',
  estoque: 'Estoque',
  users: 'Usuários',
  medicos: 'Médicos',
  convenios: 'Convênios',
  salas: 'Salas',
  fila: 'Fila',
  prescription_templates: 'Templates Prescrição',
  certificate_templates: 'Templates Atestado',
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
};
