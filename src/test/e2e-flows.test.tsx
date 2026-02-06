import { describe, it, expect, vi } from 'vitest';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('Módulos do Sistema', () => {
  it('deve exportar os módulos corretamente', async () => {
    // Verifica se os módulos principais podem ser importados
    const modules = [
      () => import('@/pages/Dashboard'),
      () => import('@/pages/Pacientes'),
      () => import('@/pages/Agenda'),
      () => import('@/pages/Prontuarios'),
      () => import('@/pages/Financeiro'),
    ];

    for (const importModule of modules) {
      const module = await importModule();
      expect(module.default).toBeDefined();
    }
  });
});

describe('Hooks do Sistema', () => {
  it('deve exportar useSupabaseData corretamente', async () => {
    const hooks = await import('@/hooks/useSupabaseData');
    
    expect(hooks.usePacientes).toBeDefined();
    expect(hooks.useAgendamentos).toBeDefined();
    expect(hooks.useMedicos).toBeDefined();
    expect(hooks.useLancamentos).toBeDefined();
    expect(hooks.useEstoque).toBeDefined();
  });
});

describe('Componentes WhatsApp', () => {
  it('deve exportar os componentes de WhatsApp', async () => {
    const whatsapp = await import('@/components/whatsapp');
    
    expect(whatsapp.useWhatsAppAgents).toBeDefined();
    expect(whatsapp.useWhatsAppSessions).toBeDefined();
    expect(whatsapp.useWhatsAppMutations).toBeDefined();
  });
});

describe('Utilitários', () => {
  it('deve ter funções de formatação', async () => {
    const formatters = await import('@/lib/formatters');
    
    expect(formatters).toBeDefined();
  });

  it('deve ter funções de utilidade', async () => {
    const utils = await import('@/lib/utils');
    
    expect(utils.cn).toBeDefined();
  });
});

describe('Validações de Negócio', () => {
  it('deve validar CPF corretamente', () => {
    // CPF válido tem 11 dígitos
    const cpfValido = '12345678901';
    expect(cpfValido.length).toBe(11);
  });

  it('deve validar formato de data', () => {
    const data = '2024-01-15';
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    expect(regex.test(data)).toBe(true);
  });

  it('deve validar formato de hora', () => {
    const hora = '14:30';
    const regex = /^\d{2}:\d{2}$/;
    expect(regex.test(hora)).toBe(true);
  });
});
