/**
 * Global error tracking — captures unhandled errors and promise rejections.
 * Stores them in-memory for debugging and could be extended to send to an analytics service.
 */

interface TrackedError {
  message: string;
  source?: string;
  line?: number;
  col?: number;
  stack?: string;
  type: 'error' | 'unhandledrejection';
  timestamp: string;
  url: string;
}

const errorStore: TrackedError[] = [];
const MAX_ERRORS = 50;

function storeError(error: TrackedError) {
  errorStore.push(error);
  if (errorStore.length > MAX_ERRORS) errorStore.shift();
}

export function initGlobalErrorTracking() {
  // Global error handler
  window.addEventListener('error', (event) => {
    storeError({
      message: event.message || 'Unknown error',
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack,
      type: 'error',
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    console.error('[GlobalError]', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
    });
  });

  // Unhandled promise rejection handler  
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    storeError({
      message: reason?.message || String(reason) || 'Unhandled Promise Rejection',
      stack: reason?.stack,
      type: 'unhandledrejection',
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    console.error('[UnhandledRejection]', reason);
    event.preventDefault();
  });
}

export function getTrackedErrors(): TrackedError[] {
  return [...errorStore];
}

export function clearTrackedErrors() {
  errorStore.length = 0;
}

/**
 * Generate a debug report with errors and environment info.
 */
export function generateDebugReport(): string {
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    errors: errorStore.slice(-10),
    memory: (performance as any).memory ? {
      usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB',
      totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(1) + 'MB',
    } : 'N/A',
  };
  return JSON.stringify(report, null, 2);
}
