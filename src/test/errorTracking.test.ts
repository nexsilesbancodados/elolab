import { describe, it, expect, beforeEach } from 'vitest';
import {
  initGlobalErrorTracking,
  getTrackedErrors,
  clearTrackedErrors,
  generateDebugReport,
} from '@/lib/errorTracking';

describe('errorTracking', () => {
  beforeEach(() => {
    clearTrackedErrors();
  });

  it('inicia sem erros rastreados', () => {
    expect(getTrackedErrors()).toHaveLength(0);
  });

  it('limpa erros rastreados', () => {
    // Manually trigger to populate
    initGlobalErrorTracking();
    clearTrackedErrors();
    expect(getTrackedErrors()).toHaveLength(0);
  });

  it('gera relatório de debug válido', () => {
    const report = generateDebugReport();
    const parsed = JSON.parse(report);

    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('url');
    expect(parsed).toHaveProperty('userAgent');
    expect(parsed).toHaveProperty('viewport');
    expect(parsed).toHaveProperty('errors');
    expect(Array.isArray(parsed.errors)).toBe(true);
  });

  it('retorna cópia dos erros, não referência direta', () => {
    const errors1 = getTrackedErrors();
    const errors2 = getTrackedErrors();
    expect(errors1).not.toBe(errors2);
    expect(errors1).toEqual(errors2);
  });
});
