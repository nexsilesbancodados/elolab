// Audit Trail System - reads/writes from Supabase audit_log table
import { supabase } from '@/integrations/supabase/client';

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

export async function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
  try {
    await supabase.from('audit_log').insert({
      action: entry.action,
      collection: entry.collection,
      record_id: entry.recordId,
      record_name: entry.recordName || null,
      changes: entry.changes ? JSON.parse(JSON.stringify(entry.changes)) : null,
      user_id: entry.userId || null,
      user_name: entry.userName || null,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export async function getAuditLog(filters?: {
  collection?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(filters?.limit || 500);

  if (filters?.collection) query = query.eq('collection', filters.collection);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.startDate) query = query.gte('timestamp', filters.startDate);
  if (filters?.endDate) query = query.lte('timestamp', filters.endDate);

  const { data, error } = await query;
  if (error) {
    console.error('Error loading audit log:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp,
    action: row.action as AuditEntry['action'],
    collection: row.collection,
    recordId: row.record_id,
    recordName: row.record_name,
    changes: row.changes as AuditEntry['changes'],
    userId: row.user_id,
    userName: row.user_name,
  }));
}

export async function clearAuditLog() {
  // We don't actually delete - just a no-op for safety
  console.warn('clearAuditLog: operation disabled for data safety');
}

// Helper to detect changes between objects
export function detectChanges(oldObj: any, newObj: any): { field: string; oldValue: any; newValue: any }[] {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  allKeys.forEach(key => {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') return;
    
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
