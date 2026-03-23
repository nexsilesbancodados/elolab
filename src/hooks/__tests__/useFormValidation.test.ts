import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, validators } from '@/hooks/useFormValidation';

describe('useFormValidation', () => {
  const rules = {
    nome: { required: true },
    email: { required: true, custom: validators.email },
    cpf: { custom: validators.cpf },
    telefone: { custom: validators.phone },
    bio: { minLength: 5, maxLength: 100 },
    codigo: { pattern: /^[A-Z]{3}$/, message: 'Formato: XXX' },
  };

  it('retorna estado inicial limpo', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('valida campo obrigatório', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('nome', '');
    });
    expect(result.current.errors.nome).toBe('Campo obrigatório');
  });

  it('valida campo obrigatório com valor', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      const isValid = result.current.validate('nome', 'Maria');
    });
    expect(result.current.errors.nome).toBeUndefined();
  });

  it('valida email inválido', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('email', 'invalid');
    });
    expect(result.current.errors.email).toBe('E-mail inválido');
  });

  it('valida CPF com dígitos insuficientes', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('cpf', '123');
    });
    expect(result.current.errors.cpf).toBe('CPF deve ter 11 dígitos');
  });

  it('valida telefone inválido', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('telefone', '123');
    });
    expect(result.current.errors.telefone).toBe('Telefone inválido');
  });

  it('valida minLength', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('bio', 'abc');
    });
    expect(result.current.errors.bio).toBe('Mínimo de 5 caracteres');
  });

  it('valida pattern', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('codigo', 'abc');
    });
    expect(result.current.errors.codigo).toBe('Formato: XXX');
  });

  it('validateAll retorna false com erros', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    let isValid: boolean;
    act(() => {
      isValid = result.current.validateAll({ nome: '', email: '', cpf: '', telefone: '', bio: '', codigo: '' });
    });
    expect(isValid!).toBe(false);
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('validateAll retorna true sem erros', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    let isValid: boolean;
    act(() => {
      isValid = result.current.validateAll({
        nome: 'Maria',
        email: 'maria@test.com',
        cpf: '12345678901',
        telefone: '11999999999',
        bio: 'Uma bio válida',
        codigo: 'ABC',
      });
    });
    expect(isValid!).toBe(true);
  });

  it('reset limpa erros e touched', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('nome', '');
      result.current.touch('nome');
    });
    expect(result.current.errors.nome).toBeDefined();
    act(() => {
      result.current.reset();
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('getFieldProps retorna error somente se touched', () => {
    const { result } = renderHook(() => useFormValidation(rules));
    act(() => {
      result.current.validate('nome', '');
    });
    expect(result.current.getFieldProps('nome').error).toBeUndefined();
    act(() => {
      result.current.touch('nome');
    });
    expect(result.current.getFieldProps('nome').error).toBe('Campo obrigatório');
  });
});
