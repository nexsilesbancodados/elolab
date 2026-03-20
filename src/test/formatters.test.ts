import { describe, it, expect } from 'vitest';
import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  formatCurrency,
  parseCurrency,
  formatDate,
  formatTime,
  calculateAge,
  getInitials,
  validateCPF,
  validateEmail,
} from '@/lib/formatters';

describe('formatCPF', () => {
  it('formata CPF parcial com 3 dígitos', () => {
    expect(formatCPF('123')).toBe('123');
  });

  it('formata CPF parcial com 6 dígitos', () => {
    expect(formatCPF('123456')).toBe('123.456');
  });

  it('formata CPF parcial com 9 dígitos', () => {
    expect(formatCPF('123456789')).toBe('123.456.789');
  });

  it('formata CPF completo', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('remove caracteres não numéricos', () => {
    expect(formatCPF('123.456.789-01')).toBe('123.456.789-01');
  });

  it('limita a 11 dígitos', () => {
    expect(formatCPF('123456789012345')).toBe('123.456.789-01');
  });
});

describe('formatCNPJ', () => {
  it('formata CNPJ completo', () => {
    expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('formata CNPJ parcial', () => {
    expect(formatCNPJ('12345')).toBe('12.345');
  });
});

describe('formatPhone', () => {
  it('formata telefone fixo (10 dígitos)', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('formata celular (11 dígitos)', () => {
    expect(formatPhone('11999887766')).toBe('(11) 99988-7766');
  });

  it('formata telefone parcial', () => {
    expect(formatPhone('11')).toBe('(11');
  });

  it('retorna vazio para string vazia', () => {
    expect(formatPhone('')).toBe('');
  });
});

describe('formatCEP', () => {
  it('formata CEP completo', () => {
    expect(formatCEP('01310100')).toBe('01310-100');
  });

  it('formata CEP parcial', () => {
    expect(formatCEP('01310')).toBe('01310');
  });
});

describe('formatCurrency', () => {
  it('formata valor positivo em reais', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234,56');
  });

  it('formata zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });

  it('formata valor negativo', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('100,00');
  });
});

describe('parseCurrency', () => {
  it('converte string formatada para número', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
  });

  it('retorna 0 para string inválida', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('converte valor simples', () => {
    expect(parseCurrency('100,50')).toBe(100.5);
  });
});

describe('formatDate', () => {
  it('formata data no formato curto (pt-BR)', () => {
    const result = formatDate('2024-03-15', 'short');
    expect(result).toMatch(/15\/03\/2024/);
  });

  it('formata data no formato ISO', () => {
    const result = formatDate('2024-03-15T10:00:00Z', 'iso');
    expect(result).toBe('2024-03-15');
  });

  it('aceita objeto Date', () => {
    const date = new Date(2024, 2, 15); // March 15, 2024
    const result = formatDate(date, 'short');
    expect(result).toMatch(/15\/03\/2024/);
  });
});

describe('formatTime', () => {
  it('formata hora corretamente', () => {
    const result = formatTime('2024-03-15T14:30:00');
    expect(result).toMatch(/14:30/);
  });
});

describe('calculateAge', () => {
  it('calcula idade corretamente', () => {
    const birthYear = new Date().getFullYear() - 30;
    const age = calculateAge(`${birthYear}-01-01`);
    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(30);
  });

  it('calcula idade de recém-nascido', () => {
    const today = new Date();
    const age = calculateAge(today.toISOString().split('T')[0]);
    expect(age).toBe(0);
  });
});

describe('getInitials', () => {
  it('retorna iniciais de nome completo', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('retorna iniciais limitadas a 2 caracteres', () => {
    expect(getInitials('Ana Maria da Silva')).toBe('AM');
  });

  it('retorna inicial de nome simples', () => {
    expect(getInitials('Pedro')).toBe('P');
  });
});

describe('validateCPF', () => {
  it('valida CPF correto', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com dígitos repetidos', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com tamanho incorreto', () => {
    expect(validateCPF('123')).toBe(false);
  });

  it('rejeita CPF inválido', () => {
    expect(validateCPF('123.456.789-00')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('valida email correto', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejeita email sem @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejeita email sem domínio', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejeita email com espaços', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });
});
