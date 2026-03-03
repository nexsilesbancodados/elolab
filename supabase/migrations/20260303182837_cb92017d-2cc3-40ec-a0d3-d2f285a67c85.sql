
CREATE OR REPLACE FUNCTION public.delete_all_app_data()
RETURNS void AS $$
BEGIN
  TRUNCATE public.whatsapp_agent_actions CASCADE;
  TRUNCATE public.whatsapp_messages CASCADE;
  TRUNCATE public.whatsapp_conversations CASCADE;
  TRUNCATE public.whatsapp_agents CASCADE;
  TRUNCATE public.whatsapp_sessions CASCADE;
  TRUNCATE public.triagens CASCADE;
  TRUNCATE public.fila_atendimento CASCADE;
  TRUNCATE public.anexos_prontuario CASCADE;
  TRUNCATE public.retornos CASCADE;
  TRUNCATE public.prescricoes CASCADE;
  TRUNCATE public.encaminhamentos CASCADE;
  TRUNCATE public.atestados CASCADE;
  TRUNCATE public.exames CASCADE;
  TRUNCATE public.prontuarios CASCADE;
  TRUNCATE public.agendamentos CASCADE;
  TRUNCATE public.lista_espera CASCADE;
  TRUNCATE public.consentimentos_lgpd CASCADE;
  TRUNCATE public.paciente_portal_tokens CASCADE;
  TRUNCATE public.movimentacoes_estoque CASCADE;
  TRUNCATE public.estoque CASCADE;
  TRUNCATE public.pagamentos_mercadopago CASCADE;
  TRUNCATE public.assinaturas_plano CASCADE;
  TRUNCATE public.assinaturas_mercadopago CASCADE;
  TRUNCATE public.lancamentos CASCADE;
  TRUNCATE public.mercadopago_webhook_logs CASCADE;
  TRUNCATE public.notification_queue CASCADE;
  TRUNCATE public.notification_templates CASCADE;
  TRUNCATE public.automation_logs CASCADE;
  TRUNCATE public.automation_settings CASCADE;
  TRUNCATE public.employee_invitations CASCADE;
  TRUNCATE public.funcionarios CASCADE;
  TRUNCATE public.salas CASCADE;
  TRUNCATE public.pacientes CASCADE;
  TRUNCATE public.medicos CASCADE;
  TRUNCATE public.convenios CASCADE;
  TRUNCATE public.templates_prescricao CASCADE;
  TRUNCATE public.templates_atestado CASCADE;
  TRUNCATE public.tv_panel_media CASCADE;
  TRUNCATE public.protocolos_clinicos CASCADE;
  TRUNCATE public.audit_log CASCADE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
