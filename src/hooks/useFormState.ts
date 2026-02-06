import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFormStateOptions<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
  validate?: (data: T) => Partial<Record<keyof T, string>> | null;
}

interface UseFormStateReturn<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  errors: Partial<Record<keyof T, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  isSubmitting: boolean;
  isDirty: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (newData?: T) => void;
  clearError: (field: keyof T) => void;
}

/**
 * Custom hook for managing form state with validation, submission, and error handling
 */
export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const {
    initialData,
    onSubmit,
    onSuccess,
    successMessage = 'Salvo com sucesso!',
    errorMessage = 'Erro ao salvar. Tente novamente.',
    validate,
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData] = useState<T>(initialData);

  const isDirty = JSON.stringify(data) !== JSON.stringify(originalData);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    setErrors((prev) => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest as Partial<Record<keyof T, string>>;
      }
      return prev;
    });
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest as Partial<Record<keyof T, string>>;
    });
  }, []);

  const reset = useCallback((newData?: T) => {
    setData(newData ?? initialData);
    setErrors({});
  }, [initialData]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Run validation if provided
    if (validate) {
      const validationErrors = validate(data);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        if (firstError) {
          toast.error(firstError);
        }
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(successMessage);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onSubmit, onSuccess, successMessage, errorMessage, validate]);

  return {
    data,
    setData,
    updateField,
    errors,
    setErrors,
    isSubmitting,
    isDirty,
    handleSubmit,
    reset,
    clearError,
  };
}

/**
 * Simple validation helpers
 */
export const validators = {
  required: (value: unknown, fieldName: string): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} é obrigatório`;
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email inválido';
    }
    return null;
  },

  cpf: (value: string): string | null => {
    if (!value) return null;
    const cpfClean = value.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    const phoneClean = value.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return 'Telefone inválido';
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} deve ter no máximo ${max} caracteres`;
    }
    return null;
  },

  positiveNumber: (value: number, fieldName: string): string | null => {
    if (value < 0) {
      return `${fieldName} deve ser um número positivo`;
    }
    return null;
  },

  date: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return null;
  },

  futureDate: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (date <= new Date()) {
      return 'A data deve ser no futuro';
    }
    return null;
  },

  pastDate: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (date >= new Date()) {
      return 'A data deve ser no passado';
    }
    return null;
  },
};

/**
 * Compose multiple validators for a single field
 */
export function composeValidators<T>(
  value: T,
  ...validators: ((value: T) => string | null)[]
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
}
