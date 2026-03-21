
-- Update RLS policies for core tables to include clinica_id tenant isolation
-- We'll use get_my_clinica_id() in all SELECT/INSERT/UPDATE/DELETE policies

-- Helper: check if clinica matches (handles NULL for backward compat)
CREATE OR REPLACE FUNCTION public.is_same_clinica(record_clinica_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN record_clinica_id IS NULL THEN true
    ELSE record_clinica_id = (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  END
$$;

-- ═══ MEDICOS ═══
DROP POLICY IF EXISTS "medicos_select" ON public.medicos;
CREATE POLICY "medicos_select" ON public.medicos FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "medicos_insert" ON public.medicos;
CREATE POLICY "medicos_insert" ON public.medicos FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "medicos_update" ON public.medicos;
CREATE POLICY "medicos_update" ON public.medicos FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR (user_id = auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "medicos_delete" ON public.medicos;
CREATE POLICY "medicos_delete" ON public.medicos FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ FUNCIONARIOS ═══
DROP POLICY IF EXISTS "funcionarios_select" ON public.funcionarios;
CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT TO authenticated
  USING ((is_admin(auth.uid()) OR is_recepcao(auth.uid()) OR (user_id = auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "anon_select_funcionarios_for_invite" ON public.funcionarios;
CREATE POLICY "anon_select_funcionarios_for_invite" ON public.funcionarios FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "funcionarios_insert" ON public.funcionarios;
CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "funcionarios_update" ON public.funcionarios;
CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "funcionarios_delete" ON public.funcionarios;
CREATE POLICY "funcionarios_delete" ON public.funcionarios FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ PACIENTES ═══
DROP POLICY IF EXISTS "pacientes_select" ON public.pacientes;
CREATE POLICY "pacientes_select" ON public.pacientes FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "pacientes_insert" ON public.pacientes;
CREATE POLICY "pacientes_insert" ON public.pacientes FOR INSERT TO authenticated
  WITH CHECK ((can_manage_data(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "pacientes_update" ON public.pacientes;
CREATE POLICY "pacientes_update" ON public.pacientes FOR UPDATE TO authenticated
  USING (can_manage_data(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "pacientes_delete" ON public.pacientes;
CREATE POLICY "pacientes_delete" ON public.pacientes FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ AGENDAMENTOS ═══
DROP POLICY IF EXISTS "agendamentos_select" ON public.agendamentos;
CREATE POLICY "agendamentos_select" ON public.agendamentos FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "agendamentos_insert" ON public.agendamentos;
CREATE POLICY "agendamentos_insert" ON public.agendamentos FOR INSERT TO authenticated
  WITH CHECK ((can_manage_data(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "agendamentos_update" ON public.agendamentos;
CREATE POLICY "agendamentos_update" ON public.agendamentos FOR UPDATE TO authenticated
  USING ((can_manage_data(auth.uid()) OR can_access_clinical(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "agendamentos_delete" ON public.agendamentos;
CREATE POLICY "agendamentos_delete" ON public.agendamentos FOR DELETE TO authenticated
  USING ((is_admin(auth.uid()) OR is_recepcao(auth.uid())) AND is_same_clinica(clinica_id));

-- ═══ LANCAMENTOS ═══
DROP POLICY IF EXISTS "lancamentos_select" ON public.lancamentos;
CREATE POLICY "lancamentos_select" ON public.lancamentos FOR SELECT TO authenticated
  USING (can_access_financial(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "lancamentos_insert" ON public.lancamentos;
CREATE POLICY "lancamentos_insert" ON public.lancamentos FOR INSERT TO authenticated
  WITH CHECK ((can_access_financial(auth.uid()) OR is_recepcao(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "lancamentos_update" ON public.lancamentos;
CREATE POLICY "lancamentos_update" ON public.lancamentos FOR UPDATE TO authenticated
  USING (can_access_financial(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "lancamentos_delete" ON public.lancamentos;
CREATE POLICY "lancamentos_delete" ON public.lancamentos FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ ESTOQUE ═══
DROP POLICY IF EXISTS "estoque_select" ON public.estoque;
CREATE POLICY "estoque_select" ON public.estoque FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "estoque_insert" ON public.estoque;
CREATE POLICY "estoque_insert" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_enfermagem(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "estoque_update" ON public.estoque;
CREATE POLICY "estoque_update" ON public.estoque FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_enfermagem(auth.uid()) OR is_financeiro(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "estoque_delete" ON public.estoque;
CREATE POLICY "estoque_delete" ON public.estoque FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ EXAMES ═══
DROP POLICY IF EXISTS "exames_select" ON public.exames;
CREATE POLICY "exames_select" ON public.exames FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "exames_insert" ON public.exames;
CREATE POLICY "exames_insert" ON public.exames FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "exames_update" ON public.exames;
CREATE POLICY "exames_update" ON public.exames FOR UPDATE TO authenticated
  USING ((can_access_clinical(auth.uid()) OR is_recepcao(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "exames_delete" ON public.exames;
CREATE POLICY "exames_delete" ON public.exames FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ CONVENIOS ═══
DROP POLICY IF EXISTS "convenios_select" ON public.convenios;
CREATE POLICY "convenios_select" ON public.convenios FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "convenios_insert" ON public.convenios;
CREATE POLICY "convenios_insert" ON public.convenios FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "convenios_update" ON public.convenios;
CREATE POLICY "convenios_update" ON public.convenios FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "convenios_delete" ON public.convenios;
CREATE POLICY "convenios_delete" ON public.convenios FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ PRONTUARIOS ═══
DROP POLICY IF EXISTS "prontuarios_select" ON public.prontuarios;
CREATE POLICY "prontuarios_select" ON public.prontuarios FOR SELECT TO authenticated
  USING (can_access_clinical(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "prontuarios_insert" ON public.prontuarios;
CREATE POLICY "prontuarios_insert" ON public.prontuarios FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "prontuarios_update" ON public.prontuarios;
CREATE POLICY "prontuarios_update" ON public.prontuarios FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "prontuarios_delete" ON public.prontuarios;
CREATE POLICY "prontuarios_delete" ON public.prontuarios FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ SALAS ═══
DROP POLICY IF EXISTS "salas_select" ON public.salas;
CREATE POLICY "salas_select" ON public.salas FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "salas_insert" ON public.salas;
CREATE POLICY "salas_insert" ON public.salas FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "salas_update" ON public.salas;
CREATE POLICY "salas_update" ON public.salas FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "salas_delete" ON public.salas;
CREATE POLICY "salas_delete" ON public.salas FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ AUDIT LOG ═══
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid()));

-- ═══ REMAINING CLINICAL TABLES ═══
DROP POLICY IF EXISTS "prescricoes_select" ON public.prescricoes;
CREATE POLICY "prescricoes_select" ON public.prescricoes FOR SELECT TO authenticated
  USING (can_access_clinical(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "prescricoes_insert" ON public.prescricoes;
CREATE POLICY "prescricoes_insert" ON public.prescricoes FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "atestados_select" ON public.atestados;
CREATE POLICY "atestados_select" ON public.atestados FOR SELECT TO authenticated
  USING ((can_access_clinical(auth.uid()) OR is_recepcao(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "atestados_insert" ON public.atestados;
CREATE POLICY "atestados_insert" ON public.atestados FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "encaminhamentos_select" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_select" ON public.encaminhamentos FOR SELECT TO public
  USING ((can_access_clinical(auth.uid()) OR is_recepcao(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "encaminhamentos_insert" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_insert" ON public.encaminhamentos FOR INSERT TO public
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "coletas_select" ON public.coletas_laboratorio;
CREATE POLICY "coletas_select" ON public.coletas_laboratorio FOR SELECT TO public
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "coletas_insert" ON public.coletas_laboratorio;
CREATE POLICY "coletas_insert" ON public.coletas_laboratorio FOR INSERT TO public
  WITH CHECK ((can_access_clinical(auth.uid()) OR is_recepcao(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "coletas_update" ON public.coletas_laboratorio;
CREATE POLICY "coletas_update" ON public.coletas_laboratorio FOR UPDATE TO public
  USING ((can_access_clinical(auth.uid()) OR is_recepcao(auth.uid())) AND is_same_clinica(clinica_id));

-- ═══ FILA / TRIAGENS / TAREFAS / RETORNOS ═══
DROP POLICY IF EXISTS "fila_atendimento_select" ON public.fila_atendimento;
CREATE POLICY "fila_atendimento_select" ON public.fila_atendimento FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "fila_atendimento_insert" ON public.fila_atendimento;
CREATE POLICY "fila_atendimento_insert" ON public.fila_atendimento FOR INSERT TO authenticated
  WITH CHECK ((can_manage_data(auth.uid()) OR is_enfermagem(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "fila_atendimento_update" ON public.fila_atendimento;
CREATE POLICY "fila_atendimento_update" ON public.fila_atendimento FOR UPDATE TO authenticated
  USING ((can_manage_data(auth.uid()) OR can_access_clinical(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "fila_atendimento_delete" ON public.fila_atendimento;
CREATE POLICY "fila_atendimento_delete" ON public.fila_atendimento FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ BLOQUEIOS AGENDA ═══
DROP POLICY IF EXISTS "bloqueios_select" ON public.bloqueios_agenda;
CREATE POLICY "bloqueios_select" ON public.bloqueios_agenda FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "bloqueios_insert" ON public.bloqueios_agenda;
CREATE POLICY "bloqueios_insert" ON public.bloqueios_agenda FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid()) OR is_recepcao(auth.uid())) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "bloqueios_update" ON public.bloqueios_agenda;
CREATE POLICY "bloqueios_update" ON public.bloqueios_agenda FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "bloqueios_delete" ON public.bloqueios_agenda;
CREATE POLICY "bloqueios_delete" ON public.bloqueios_agenda FOR DELETE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

-- ═══ LISTA ESPERA ═══
DROP POLICY IF EXISTS "lista_espera_select" ON public.lista_espera;
CREATE POLICY "lista_espera_select" ON public.lista_espera FOR SELECT TO authenticated
  USING ((can_manage_data(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "lista_espera_insert" ON public.lista_espera;
CREATE POLICY "lista_espera_insert" ON public.lista_espera FOR INSERT TO authenticated
  WITH CHECK (can_manage_data(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

-- ═══ EMPLOYEE INVITATIONS ═══
DROP POLICY IF EXISTS "Admins can insert invitations" ON public.employee_invitations;
CREATE POLICY "Admins can insert invitations" ON public.employee_invitations FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view invitations" ON public.employee_invitations;
CREATE POLICY "Authenticated users can view invitations" ON public.employee_invitations FOR SELECT TO authenticated
  USING (is_same_clinica(clinica_id) OR is_admin(auth.uid()));

-- ═══ CONFIGURACOES ═══
DROP POLICY IF EXISTS "config_select" ON public.configuracoes_clinica;
CREATE POLICY "config_select" ON public.configuracoes_clinica FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "config_insert" ON public.configuracoes_clinica;
CREATE POLICY "config_insert" ON public.configuracoes_clinica FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND (clinica_id = get_my_clinica_id() OR clinica_id IS NULL));

DROP POLICY IF EXISTS "config_update" ON public.configuracoes_clinica;
CREATE POLICY "config_update" ON public.configuracoes_clinica FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "config_delete" ON public.configuracoes_clinica;
CREATE POLICY "config_delete" ON public.configuracoes_clinica FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- ═══ AUTOMATION ═══
DROP POLICY IF EXISTS "Admins podem ver logs" ON public.automation_logs;
CREATE POLICY "Admins podem ver logs" ON public.automation_logs FOR SELECT TO public
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

DROP POLICY IF EXISTS "Admins podem gerenciar configurações" ON public.automation_settings;
CREATE POLICY "Admins podem gerenciar configurações" ON public.automation_settings FOR ALL TO public
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));
