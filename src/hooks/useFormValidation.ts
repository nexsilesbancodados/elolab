import { useState, useCallback } from 'react';

type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
};

type FieldRules = Record<string, ValidationRule>;

export function useFormValidation(rules: FieldRules) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    if (rule.required && !value.trim()) {
      return rule.message || 'Campo obrigatório';
    }
    if (rule.minLength && value.length < rule.minLength) {
      return `Mínimo de ${rule.minLength} caracteres`;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return `Máximo de ${rule.maxLength} caracteres`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Formato inválido';
    }
    if (rule.custom) {
      return rule.custom(value);
    }
    return null;
  }, [rules]);

  const validate = useCallback((name: string, value: string) => {
    const error = validateField(name, value);
    setErrors(prev => {
      if (error) return { ...prev, [name]: error };
      const next = { ...prev };
      delete next[name];
      return next;
    });
    return !error;
  }, [validateField]);

  const touch = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validateAll = useCallback((values: Record<string, string>): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    for (const [name] of Object.entries(rules)) {
      newTouched[name] = true;
      const error = validateField(name, values[name] || '');
      if (error) newErrors[name] = error;
    }

    setErrors(newErrors);
    setTouched(newTouched);
    return Object.keys(newErrors).length === 0;
  }, [rules, validateField]);

  const getFieldProps = useCallback((name: string) => ({
    error: touched[name] ? errors[name] : undefined,
    onBlur: () => touch(name),
  }), [errors, touched, touch]);

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, validate, touch, validateAll, getFieldProps, reset };
}

// Common validators
export const validators = {
  email: (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'E-mail inválido';
    return null;
  },
  cpf: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return 'CPF deve ter 11 dígitos';
    if (/^(\d)\1+$/.test(cleaned)) return 'CPF inválido';
    return null;
  },
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) return 'Telefone inválido';
    return null;
  },
};
