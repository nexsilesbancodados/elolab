// LocalStorage Database Helper

const DB_PREFIX = 'elolab_clinic_';

export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(DB_PREFIX + key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(DB_PREFIX + key);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generic CRUD operations
export function getAll<T>(collection: string): T[] {
  return getItem<T[]>(collection) || [];
}

export function getById<T extends { id: string }>(collection: string, id: string): T | undefined {
  const items = getAll<T>(collection);
  return items.find(item => item.id === id);
}

export function create<T extends { id: string }>(collection: string, item: Omit<T, 'id'>): T {
  const items = getAll<T>(collection);
  const newItem = { ...item, id: generateId() } as T;
  items.push(newItem);
  setItem(collection, items);
  return newItem;
}

export function update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | undefined {
  const items = getAll<T>(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return undefined;
  
  items[index] = { ...items[index], ...updates };
  setItem(collection, items);
  return items[index];
}

export function remove(collection: string, id: string): boolean {
  const items = getAll<{ id: string }>(collection);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  
  setItem(collection, filtered);
  return true;
}
