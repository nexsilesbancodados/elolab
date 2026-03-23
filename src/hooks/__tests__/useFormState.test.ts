import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormState, validators, composeValidators } from '@/hooks/useFormState';

describe('useFormState', () => {
  const initialData = { nome: '', email: '' };
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  it('retorna dados iniciais', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    expect(result.current.data).toEqual(initialData);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('updateField atualiza campo e marca dirty', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    act(() => {
      result.current.updateField('nome', 'Maria');
    });
    expect(result.current.data.nome).toBe('Maria');
    expect(result.current.isDirty).toBe(true);
  });

  it('reset volta ao estado inicial', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    act(() => {
      result.current.updateField('nome', 'Maria');
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
  });

  it('reset com novos dados', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    act(() => {
      result.current.reset({ nome: 'João', email: 'joao@test.com' });
    });
    expect(result.current.data.nome).toBe('João');
  });

  it('clearError remove erro do campo', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    act(() => {
      result.current.setErrors({ nome: 'Erro' });
    });
    expect(result.current.errors.nome).toBe('Erro');
    act(() => {
      result.current.clearError('nome');
    });
    expect(result.current.errors.nome).toBeUndefined();
  });

  it('updateField limpa erro do campo', () => {
    const { result } = renderHook(() =>
      useFormState({ initialData, onSubmit: mockOnSubmit })
    );
    act(() => {
      result.current.setErrors({ nome: 'Erro' });
    });
    act(() => {
      result.current.updateField('nome', 'Maria');
    });
    expect(result.current.errors.nome).toBeUndefined();
  });
});

describe('validators', () => {
  it('required detecta vazio', () => {
    expect(validators.required('', 'Nome')).toBe('Nome é obrigatório');
    expect(validators.required(null, 'Nome')).toBe('Nome é obrigatório');
    expect(validators.required(undefined, 'Nome')).toBe('Nome é obrigatório');
    expect(validators.required('Maria', 'Nome')).toBeNull();
  });

  it('email valida corretamente', () => {
    expect(validators.email('test@test.com')).toBeNull();
    expect(validators.email('invalid')).toBe('Email inválido');
    expect(validators.email('')).toBeNull();
  });

  it('cpf valida comprimento', () => {
    expect(validators.cpf('12345678901')).toBeNull();
    expect(validators.cpf('123')).toBe('CPF deve ter 11 dígitos');
    expect(validators.cpf('')).toBeNull();
  });

  it('phone valida comprimento', () => {
    expect(validators.phone('11999999999')).toBeNull();
    expect(validators.phone('123')).toBe('Telefone inválido');
    expect(validators.phone('')).toBeNull();
  });

  it('minLength', () => {
    expect(validators.minLength('ab', 3, 'Nome')).toBe('Nome deve ter pelo menos 3 caracteres');
    expect(validators.minLength('abc', 3, 'Nome')).toBeNull();
  });

  it('maxLength', () => {
    expect(validators.maxLength('abcd', 3, 'Nome')).toBe('Nome deve ter no máximo 3 caracteres');
    expect(validators.maxLength('ab', 3, 'Nome')).toBeNull();
  });

  it('positiveNumber', () => {
    expect(validators.positiveNumber(-1, 'Valor')).toBe('Valor deve ser um número positivo');
    expect(validators.positiveNumber(10, 'Valor')).toBeNull();
  });

  it('date', () => {
    expect(validators.date('2024-01-15')).toBeNull();
    expect(validators.date('invalid')).toBe('Data inválida');
    expect(validators.date('')).toBeNull();
  });
});

describe('composeValidators', () => {
  it('retorna primeiro erro', () => {
    const result = composeValidators(
      '',
      (v) => validators.required(v, 'Campo'),
      (v) => validators.email(v)
    );
    expect(result).toBe('Campo é obrigatório');
  });

  it('retorna null se todos passam', () => {
    const result = composeValidators(
      'test@test.com',
      (v) => validators.required(v, 'Email'),
      (v) => validators.email(v)
    );
    expect(result).toBeNull();
  });
});
