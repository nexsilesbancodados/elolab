import { describe, it, expect } from 'vitest';
import { auditEntriesToCsv } from '@/lib/auditExport';
import type { AuditEntry } from '@/lib/auditTrail';

describe('auditEntriesToCsv', () => {
  const mockEntries: AuditEntry[] = [
    {
      id: '1',
      timestamp: '2024-03-15T10:00:00.000Z',
      action: 'create' as const,
      collection: 'pacientes',
      recordId: 'abc-123',
      recordName: 'João Silva',
      userId: 'user-1',
      userName: 'Admin',
      changes: [{ field: 'nome', newValue: 'João Silva' }],
    },
    {
      id: '2',
      timestamp: '2024-03-15T11:00:00.000Z',
      action: 'update' as const,
      collection: 'agendamentos',
      recordId: 'def-456',
      recordName: 'Consulta',
      userId: 'user-2',
      userName: 'Recepção',
      changes: [{ field: 'status', oldValue: 'agendado', newValue: 'confirmado' }],
    },
  ];

  it('gera CSV com headers corretos', () => {
    const csv = auditEntriesToCsv(mockEntries);
    const headers = csv.split('\n')[0];
    expect(headers).toContain('timestamp');
    expect(headers).toContain('action');
    expect(headers).toContain('collection');
  });

  it('inclui dados de todas as entradas', () => {
    const csv = auditEntriesToCsv(mockEntries);
    const lines = csv.split('\n').filter(l => l.trim());
    // header + 2 data rows
    expect(lines.length).toBe(3);
  });

  it('gera CSV vazio (só headers) para lista vazia', () => {
    const csv = auditEntriesToCsv([]);
    const lines = csv.split('\n').filter(l => l.trim());
    expect(lines.length).toBe(1); // only header
  });

  it('escapa aspas e vírgulas em valores', () => {
    const entriesWithSpecialChars: AuditEntry[] = [
      {
        id: '1',
        timestamp: '2024-03-15T10:00:00.000Z',
        action: 'create' as const,
        collection: 'pacientes',
        recordId: 'abc',
        recordName: 'Nome com "aspas" e, vírgula',
        userId: 'user-1',
        userName: 'Admin',
        changes: [],
      },
    ];
    const csv = auditEntriesToCsv(entriesWithSpecialChars);
    // Should contain doubled quotes for escaping
    expect(csv).toContain('""');
  });
});
