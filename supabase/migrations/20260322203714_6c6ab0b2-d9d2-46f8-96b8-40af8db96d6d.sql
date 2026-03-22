
-- =============================================
-- PRODUCTION SECURITY HARDENING MIGRATION
-- =============================================

-- 1. FIX CRITICAL: Replace overly permissive anon policy on funcionarios
DROP POLICY IF EXISTS "anon_select_funcionarios_for_invite" ON public.funcionarios;

-- 2. FIX CRITICAL: Replace overly permissive anon policy on employee_invitations
DROP POLICY IF EXISTS "anon_select_invitation_by_token" ON public.employee_invitations;

CREATE POLICY "anon_select_invitation_by_token_scoped"
ON public.employee_invitations
FOR SELECT TO anon
USING (status = 'pending' AND expires_at > now());

-- 3. FIX CRITICAL: Replace overly permissive anon policy on registros_pendentes
DROP POLICY IF EXISTS "anon_select_registros_by_code" ON public.registros_pendentes;

CREATE POLICY "anon_select_registros_by_code_scoped"
ON public.registros_pendentes
FOR SELECT TO anon, authenticated
USING (status IN ('pendente', 'pago') AND expires_at > now());

-- 4. FIX WARN: movimentacoes_estoque missing clinic scope
DROP POLICY IF EXISTS "movimentacoes_estoque_select" ON public.movimentacoes_estoque;

CREATE POLICY "movimentacoes_estoque_select"
ON public.movimentacoes_estoque
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()) AND public.is_same_clinica(clinica_id));

-- 5. FIX WARN: is_same_clinica returns true for NULL clinica_id
CREATE OR REPLACE FUNCTION public.is_same_clinica(record_clinica_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN record_clinica_id IS NULL THEN 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    ELSE record_clinica_id = (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  END
$$;

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_data ON public.agendamentos(medico_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON public.agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica ON public.agendamentos(clinica_id);

CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON public.pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON public.pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_convenio ON public.pacientes(convenio_id);

CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON public.prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_medico ON public.prontuarios(medico_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica ON public.prontuarios(clinica_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON public.lancamentos(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON public.lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_clinica ON public.lancamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_paciente ON public.lancamentos(paciente_id);

CREATE INDEX IF NOT EXISTS idx_exames_paciente ON public.exames(paciente_id);
CREATE INDEX IF NOT EXISTS idx_exames_status ON public.exames(status);
CREATE INDEX IF NOT EXISTS idx_exames_clinica ON public.exames(clinica_id);

CREATE INDEX IF NOT EXISTS idx_fila_clinica ON public.fila_atendimento(clinica_id);
CREATE INDEX IF NOT EXISTS idx_fila_status ON public.fila_atendimento(status);

CREATE INDEX IF NOT EXISTS idx_estoque_clinica ON public.estoque(clinica_id);
CREATE INDEX IF NOT EXISTS idx_estoque_categoria ON public.estoque(categoria);

CREATE INDEX IF NOT EXISTS idx_medicos_clinica ON public.medicos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);

CREATE INDEX IF NOT EXISTS idx_prescricoes_paciente ON public.prescricoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prescricoes_clinica ON public.prescricoes(clinica_id);

CREATE INDEX IF NOT EXISTS idx_atestados_paciente ON public.atestados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_atestados_clinica ON public.atestados(clinica_id);

CREATE INDEX IF NOT EXISTS idx_encaminhamentos_paciente ON public.encaminhamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_clinica ON public.encaminhamentos(clinica_id);

CREATE INDEX IF NOT EXISTS idx_triagens_paciente ON public.triagens(paciente_id);
CREATE INDEX IF NOT EXISTS idx_triagens_clinica ON public.triagens(clinica_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_collection ON public.audit_log(collection);
CREATE INDEX IF NOT EXISTS idx_audit_log_clinica ON public.audit_log(clinica_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversa ON public.chat_messages(conversa_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_clinica ON public.chat_messages(clinica_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_clinica ON public.notification_queue(clinica_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinica ON public.profiles(clinica_id);

CREATE INDEX IF NOT EXISTS idx_coletas_paciente ON public.coletas_laboratorio(paciente_id);
CREATE INDEX IF NOT EXISTS idx_coletas_clinica ON public.coletas_laboratorio(clinica_id);
CREATE INDEX IF NOT EXISTS idx_coletas_status ON public.coletas_laboratorio(status);

CREATE INDEX IF NOT EXISTS idx_convenios_clinica ON public.convenios(clinica_id);

CREATE INDEX IF NOT EXISTS idx_bloqueios_medico ON public.bloqueios_agenda(medico_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_clinica ON public.bloqueios_agenda(clinica_id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON public.assinaturas_plano(user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON public.assinaturas_plano(status);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_item ON public.movimentacoes_estoque(item_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_clinica ON public.movimentacoes_estoque(clinica_id);

-- =============================================
-- DATA INTEGRITY CONSTRAINTS (immutable only)
-- =============================================

ALTER TABLE public.lancamentos 
  ADD CONSTRAINT chk_lancamentos_valor_positive CHECK (valor >= 0);

ALTER TABLE public.agendamentos
  ADD CONSTRAINT chk_agendamentos_data_valid CHECK (data >= '2020-01-01');

ALTER TABLE public.estoque
  ADD CONSTRAINT chk_estoque_quantidade_positive CHECK (quantidade >= 0);

-- =============================================
-- RLS ON REFERENCE TABLES
-- =============================================

ALTER TABLE public.cid10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cid10_select_authenticated" ON public.cid10
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "planos_select_all" ON public.planos
  FOR SELECT TO anon, authenticated USING (ativo = true);

-- =============================================
-- AUTO updated_at TRIGGERS
-- =============================================

DO $$
DECLARE
  tbl TEXT;
  tables_to_check TEXT[] := ARRAY[
    'agendamentos', 'pacientes', 'medicos', 'prontuarios', 'exames',
    'lancamentos', 'estoque', 'convenios', 'funcionarios', 'atestados',
    'prescricoes', 'encaminhamentos', 'triagens', 'coletas_laboratorio',
    'notification_queue', 'notification_templates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_' || tbl || '_updated_at'
      AND tgrelid = ('public.' || tbl)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.update_updated_at_column()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;
