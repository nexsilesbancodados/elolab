// Seed data functionality has been removed
// All data is now managed through Supabase

export function seedDemoData() {
  // No-op: Demo data has been removed
  // Data is now stored in Supabase database
  console.log('Demo data seeding disabled - using Supabase database');
}

// Helper to clear all localStorage data (for cleanup purposes)
export function clearAllLocalData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('elolab_clinic_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} localStorage keys`);
}
