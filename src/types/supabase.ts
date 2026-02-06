/**
 * Centralized Supabase types derived from the database schema
 * This file provides clean, reusable types for the application
 */

import type { Database } from '@/integrations/supabase/types';

// Table row types (for reading data)
export type Paciente = Database['public']['Tables']['pacientes']['Row'];
export type Medico = Database['public']['Tables']['medicos']['Row'];
export type Agendamento = Database['public']['Tables']['agendamentos']['Row'];
export type Prontuario = Database['public']['Tables']['prontuarios']['Row'];
export type Prescricao = Database['public']['Tables']['prescricoes']['Row'];
export type Atestado = Database['public']['Tables']['atestados']['Row'];
export type Convenio = Database['public']['Tables']['convenios']['Row'];
export type Lancamento = Database['public']['Tables']['lancamentos']['Row'];
export type Estoque = Database['public']['Tables']['estoque']['Row'];
export type Sala = Database['public']['Tables']['salas']['Row'];
export type FilaAtendimento = Database['public']['Tables']['fila_atendimento']['Row'];
export type Triagem = Database['public']['Tables']['triagens']['Row'];
export type Exame = Database['public']['Tables']['exames']['Row'];
export type Funcionario = Database['public']['Tables']['funcionarios']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type AuditLog = Database['public']['Tables']['audit_log']['Row'];
export type Encaminhamento = Database['public']['Tables']['encaminhamentos']['Row'];
export type ListaEspera = Database['public']['Tables']['lista_espera']['Row'];
export type Retorno = Database['public']['Tables']['retornos']['Row'];
export type ProtocoloClinico = Database['public']['Tables']['protocolos_clinicos']['Row'];
export type AnexoProntuario = Database['public']['Tables']['anexos_prontuario']['Row'];
export type ConsentimentoLGPD = Database['public']['Tables']['consentimentos_lgpd']['Row'];
export type NotificationQueue = Database['public']['Tables']['notification_queue']['Row'];
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row'];
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row'];
export type AutomationSettings = Database['public']['Tables']['automation_settings']['Row'];
export type TemplatePrescricao = Database['public']['Tables']['templates_prescricao']['Row'];
export type TemplateAtestado = Database['public']['Tables']['templates_atestado']['Row'];
export type MovimentacaoEstoque = Database['public']['Tables']['movimentacoes_estoque']['Row'];
export type CID10 = Database['public']['Tables']['cid10']['Row'];

// Insert types (for creating data)
export type PacienteInsert = Database['public']['Tables']['pacientes']['Insert'];
export type MedicoInsert = Database['public']['Tables']['medicos']['Insert'];
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert'];
export type ProntuarioInsert = Database['public']['Tables']['prontuarios']['Insert'];
export type PrescricaoInsert = Database['public']['Tables']['prescricoes']['Insert'];
export type AtestadoInsert = Database['public']['Tables']['atestados']['Insert'];
export type LancamentoInsert = Database['public']['Tables']['lancamentos']['Insert'];
export type EstoqueInsert = Database['public']['Tables']['estoque']['Insert'];
export type TriagemInsert = Database['public']['Tables']['triagens']['Insert'];
export type ExameInsert = Database['public']['Tables']['exames']['Insert'];
export type EncaminhamentoInsert = Database['public']['Tables']['encaminhamentos']['Insert'];

// Update types (for updating data)
export type PacienteUpdate = Database['public']['Tables']['pacientes']['Update'];
export type MedicoUpdate = Database['public']['Tables']['medicos']['Update'];
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update'];
export type ProntuarioUpdate = Database['public']['Tables']['prontuarios']['Update'];
export type LancamentoUpdate = Database['public']['Tables']['lancamentos']['Update'];
export type EstoqueUpdate = Database['public']['Tables']['estoque']['Update'];

// Enum types
export type AppRole = Database['public']['Enums']['app_role'];
export type StatusAgendamento = Database['public']['Enums']['status_agendamento'];
export type StatusExame = Database['public']['Enums']['status_exame'];
export type StatusPagamento = Database['public']['Enums']['status_pagamento'];
export type StatusSala = Database['public']['Enums']['status_sala'];
export type ClassificacaoRisco = Database['public']['Enums']['classificacao_risco'];

// Extended types with relations
export interface AgendamentoComRelacoes extends Agendamento {
  pacientes?: Paciente;
  medicos?: Medico;
  salas?: Sala;
}

export interface FilaComRelacoes extends FilaAtendimento {
  agendamentos?: AgendamentoComRelacoes;
}

export interface ProntuarioComRelacoes extends Prontuario {
  pacientes?: Paciente;
  medicos?: Medico;
  agendamentos?: Agendamento;
}

export interface ExameComRelacoes extends Exame {
  pacientes?: Paciente;
  medicos?: Medico;
}

export interface TriagemComRelacoes extends Triagem {
  pacientes?: Paciente;
  agendamentos?: Agendamento;
}

// Helper type for form state
export interface FormState<T> {
  data: T;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: Partial<Record<keyof T, string>>;
}

// Common response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}
