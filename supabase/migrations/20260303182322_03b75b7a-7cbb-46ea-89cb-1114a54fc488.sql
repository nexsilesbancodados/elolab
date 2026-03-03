
CREATE OR REPLACE FUNCTION public.delete_all_app_data()
RETURNS void AS $$
BEGIN
  -- Child tables first
  DELETE FROM public.whatsapp_agent_actions;
  DELETE FROM public.whatsapp_messages;
  DELETE FROM public.whatsapp_conversations;
  DELETE FROM public.whatsapp_agents;
  DELETE FROM public.whatsapp_sessions;
  DELETE FROM public.triagens;
  DELETE FROM public.fila_atendimento;
  DELETE FROM public.anexos_prontuario;
  DELETE FROM public.retornos;
  DELETE FROM public.prescricoes;
  DELETE FROM public.encaminhamentos;
  DELETE FROM public.atestados;
  DELETE FROM public.exames;
  DELETE FROM public.prontuarios;
  DELETE FROM public.agendamentos;
  DELETE FROM public.lista_espera;
  DELETE FROM public.consentimentos_lgpd;
  DELETE FROM public.paciente_portal_tokens;
  DELETE FROM public.movimentacoes_estoque;
  DELETE FROM public.estoque;
  DELETE FROM public.pagamentos_mercadopago;
  DELETE FROM public.assinaturas_plano;
  DELETE FROM public.assinaturas_mercadopago;
  DELETE FROM public.lancamentos;
  DELETE FROM public.mercadopago_webhook_logs;
  DELETE FROM public.notification_queue;
  DELETE FROM public.notification_templates;
  DELETE FROM public.automation_logs;
  DELETE FROM public.automation_settings;
  DELETE FROM public.employee_invitations;
  DELETE FROM public.funcionarios;
  DELETE FROM public.salas;
  DELETE FROM public.pacientes;
  DELETE FROM public.medicos;
  DELETE FROM public.convenios;
  DELETE FROM public.templates_prescricao;
  DELETE FROM public.templates_atestado;
  DELETE FROM public.tv_panel_media;
  DELETE FROM public.protocolos_clinicos;
  DELETE FROM public.audit_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
