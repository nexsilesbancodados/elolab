// LocalStorage Database Helper
// NOTE: This module includes app-level CRUD helpers and Audit Trail integration.

import type { User } from '@/types';
import { getItem, setItem, removeItem, generateId } from './storageCore';
import { detectChanges, logAudit } from './auditTrail';

// Re-export primitives for backwards compatibility across the app
export { getItem, setItem, removeItem, generateId };

// Generic CRUD operations
export function getAll<T>(collection: string): T[] {
  return getItem<T[]>(collection) || [];
}

export function getById<T extends { id: string }>(collection: string, id: string): T | undefined {
  const items = getAll<T>(collection);
  return items.find(item => item.id === id);
}

function getCurrentAuditUser(): { userId?: string; userName?: string } {
  const u = getItem<User>('currentUser');
  return u ? { userId: u.id, userName: u.nome } : {};
}

function guessRecordName(obj: any): string | undefined {
  if (!obj) return undefined;
  if (typeof obj.nome === 'string' && obj.nome.trim()) return obj.nome;
  if (typeof obj.titulo === 'string' && obj.titulo.trim()) return obj.titulo;
  if (typeof obj.codigo === 'string' && obj.codigo.trim()) return obj.codigo;
  if (obj.pacienteId && obj.data) return `${obj.pacienteId} • ${obj.data}`;
  return undefined;
}

function safeLogAudit(entry: Parameters<typeof logAudit>[0]) {
  // Prevent recursion (audit_log is stored in localStorage)
  if (entry.collection === 'audit_log') return;
  logAudit(entry);
}

export function create<T extends { id: string }>(collection: string, item: Omit<T, 'id'>): T {
  const items = getAll<T>(collection);
  const newItem = { ...item, id: generateId() } as T;
  items.push(newItem);
  setItem(collection, items);

  const user = getCurrentAuditUser();
  safeLogAudit({
    action: 'create',
    collection,
    recordId: newItem.id,
    recordName: guessRecordName(newItem),
    userId: user.userId,
    userName: user.userName,
  });

  return newItem;
}

export function update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | undefined {
  const items = getAll<T>(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return undefined;

  const oldItem = items[index];
  const newItem = { ...items[index], ...updates };
  items[index] = newItem;
  setItem(collection, items);

  const user = getCurrentAuditUser();
  const changes = detectChanges(oldItem, newItem);
  safeLogAudit({
    action: 'update',
    collection,
    recordId: id,
    recordName: guessRecordName(newItem) ?? guessRecordName(oldItem),
    changes,
    userId: user.userId,
    userName: user.userName,
  });

  return items[index];
}

export function remove(collection: string, id: string): boolean {
  const items = getAll<{ id: string }>(collection);
  const oldItem = items.find((i) => i.id === id);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  
  setItem(collection, filtered);

  const user = getCurrentAuditUser();
  safeLogAudit({
    action: 'delete',
    collection,
    recordId: id,
    recordName: guessRecordName(oldItem),
    userId: user.userId,
    userName: user.userName,
  });

  return true;
}

/**
 * Bulk replace a collection and emit audit entries for create/update/delete.
 * Use this when screens manipulate arrays directly.
 */
export function setCollection<T extends { id: string }>(collection: string, next: T[]) {
  const prev = getAll<T>(collection);

  // Write first (so UI state remains consistent even if audit logging fails)
  setItem(collection, next);

  const prevById = new Map(prev.map((i) => [i.id, i] as const));
  const nextById = new Map(next.map((i) => [i.id, i] as const));

  const user = getCurrentAuditUser();

  // Creates + updates
  for (const [id, newItem] of nextById) {
    const oldItem = prevById.get(id);
    if (!oldItem) {
      safeLogAudit({
        action: 'create',
        collection,
        recordId: id,
        recordName: guessRecordName(newItem),
        userId: user.userId,
        userName: user.userName,
      });
      continue;
    }

    const changes = detectChanges(oldItem, newItem);
    if (changes.length > 0) {
      safeLogAudit({
        action: 'update',
        collection,
        recordId: id,
        recordName: guessRecordName(newItem) ?? guessRecordName(oldItem),
        changes,
        userId: user.userId,
        userName: user.userName,
      });
    }
  }

  // Deletes
  for (const [id, oldItem] of prevById) {
    if (!nextById.has(id)) {
      safeLogAudit({
        action: 'delete',
        collection,
        recordId: id,
        recordName: guessRecordName(oldItem),
        userId: user.userId,
        userName: user.userName,
      });
    }
  }
}
