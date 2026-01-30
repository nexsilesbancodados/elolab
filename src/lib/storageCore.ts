// LocalStorage primitives (no app-level business logic)

export const DB_PREFIX = 'elolab_clinic_';

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
