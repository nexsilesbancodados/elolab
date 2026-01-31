import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

// Generic hook for fetching data from a table
export function useSupabaseQuery<T>(
  tableName: string,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filters?: Array<{ column: string; operator: string; value: unknown }>;
    enabled?: boolean;
  }
) {
  const { user } = useSupabaseAuth();

  return useQuery({
    queryKey: [tableName, options],
    queryFn: async () => {
      let query = supabase
        .from(tableName as any)
        .select(options?.select || '*');

      if (options?.filters) {
        for (const filter of options.filters) {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }

      return data as T[];
    },
    enabled: options?.enabled !== false && !!user,
  });
}

// Generic hook for inserting data
export function useSupabaseInsert<T extends Record<string, unknown>>(tableName: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useSupabaseAuth();

  return useMutation({
    mutationFn: async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        throw error;
      }

      // Log to audit
      await logAudit('create', tableName, (result as any).id, user?.id, profile?.nome);

      return result as unknown as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar registro: ${error.message}`);
    },
  });
}

// Generic hook for updating data
export function useSupabaseUpdate<T extends Record<string, unknown>>(tableName: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useSupabaseAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const { data: result, error } = await supabase
        .from(tableName as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }

      // Log to audit
      await logAudit('update', tableName, id, user?.id, profile?.nome);

      return result as unknown as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar registro: ${error.message}`);
    },
  });
}

// Generic hook for deleting data
export function useSupabaseDelete(tableName: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useSupabaseAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        throw error;
      }

      // Log to audit
      await logAudit('delete', tableName, id, user?.id, profile?.nome);

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir registro: ${error.message}`);
    },
  });
}

// Audit logging function
async function logAudit(
  action: 'create' | 'update' | 'delete',
  collection: string,
  recordId: string,
  userId?: string,
  userName?: string
) {
  try {
    await supabase.from('audit_log').insert({
      action,
      collection,
      record_id: recordId,
      user_id: userId,
      user_name: userName,
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// Specific hooks for each table

export function usePacientes() {
  return useSupabaseQuery<{
    id: string;
    nome: string;
    cpf: string | null;
    data_nascimento: string | null;
    telefone: string | null;
    email: string | null;
    sexo: string | null;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    convenio_id: string | null;
    numero_carteira: string | null;
    validade_carteira: string | null;
    alergias: string[] | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
  }>('pacientes', {
    orderBy: { column: 'nome', ascending: true },
  });
}

export function useMedicos() {
  return useSupabaseQuery<{
    id: string;
    user_id: string | null;
    crm: string;
    especialidade: string | null;
    telefone: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
  }>('medicos', {
    orderBy: { column: 'crm', ascending: true },
  });
}

export function useConvenios() {
  return useSupabaseQuery<{
    id: string;
    nome: string;
    codigo: string;
    cnpj: string | null;
    telefone: string | null;
    email: string | null;
    website: string | null;
    tipo_planos: string[] | null;
    valor_consulta: number;
    valor_retorno: number;
    carencia: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;
  }>('convenios', {
    orderBy: { column: 'nome', ascending: true },
  });
}

export function useAgendamentos(date?: string) {
  return useSupabaseQuery<{
    id: string;
    paciente_id: string;
    medico_id: string;
    data: string;
    hora_inicio: string;
    hora_fim: string | null;
    tipo: string;
    status: string;
    observacoes: string | null;
    sala_id: string | null;
    created_at: string;
    updated_at: string;
  }>('agendamentos', {
    select: '*, pacientes(*), medicos(*)',
    orderBy: { column: 'hora_inicio', ascending: true },
    filters: date ? [{ column: 'data', operator: 'eq', value: date }] : undefined,
  });
}

export function useLancamentos() {
  return useSupabaseQuery<{
    id: string;
    tipo: string;
    categoria: string;
    descricao: string;
    valor: number;
    data: string;
    data_vencimento: string | null;
    status: string;
    paciente_id: string | null;
    agendamento_id: string | null;
    forma_pagamento: string | null;
    created_at: string;
    updated_at: string;
  }>('lancamentos', {
    orderBy: { column: 'data', ascending: false },
  });
}

export function useEstoque() {
  return useSupabaseQuery<{
    id: string;
    nome: string;
    descricao: string | null;
    categoria: string;
    quantidade: number;
    quantidade_minima: number;
    unidade: string | null;
    valor_unitario: number;
    fornecedor: string | null;
    lote: string | null;
    validade: string | null;
    localizacao: string | null;
    created_at: string;
    updated_at: string;
  }>('estoque', {
    orderBy: { column: 'nome', ascending: true },
  });
}

export function useSalas() {
  return useSupabaseQuery<{
    id: string;
    nome: string;
    tipo: string | null;
    capacidade: number;
    equipamentos: string[] | null;
    status: string;
    medico_responsavel: string | null;
    created_at: string;
    updated_at: string;
  }>('salas', {
    orderBy: { column: 'nome', ascending: true },
  });
}

export function useFilaAtendimento() {
  return useSupabaseQuery<{
    id: string;
    agendamento_id: string;
    posicao: number;
    horario_chegada: string;
    status: string;
    sala_id: string | null;
    prioridade: string;
    created_at: string;
    updated_at: string;
  }>('fila_atendimento', {
    select: '*, agendamentos(*, pacientes(*), medicos(*))',
    orderBy: { column: 'posicao', ascending: true },
  });
}

export function useAuditLog() {
  return useSupabaseQuery<{
    id: string;
    user_id: string | null;
    user_name: string | null;
    action: string;
    collection: string;
    record_id: string;
    record_name: string | null;
    changes: Record<string, unknown> | null;
    timestamp: string;
  }>('audit_log', {
    orderBy: { column: 'timestamp', ascending: false },
  });
}
