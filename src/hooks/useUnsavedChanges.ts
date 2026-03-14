import { useEffect, useCallback } from 'react';

/**
 * Warns users before leaving the page when there are unsaved changes.
 * Uses the browser's native beforeunload event.
 * 
 * @param isDirty - Whether there are unsaved changes
 * @param message - Custom message (browsers may ignore this and show their own)
 */
export function useUnsavedChanges(isDirty: boolean, message?: string) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      // Modern browsers ignore custom message but returnValue is required
      e.returnValue = message || 'Você tem alterações não salvas. Deseja sair?';
    },
    [isDirty, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
}
