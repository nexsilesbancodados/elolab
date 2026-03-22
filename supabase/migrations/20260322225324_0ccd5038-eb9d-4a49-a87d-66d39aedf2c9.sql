
-- ============================================================
-- SECURITY HARDENING: Fix all 9 RLS vulnerabilities
-- ============================================================

-- 1. templates_prescricao: Add clinic-scoping
DROP POLICY IF EXISTS "Médicos e admins podem ver templates" ON public.templates_prescricao;
DROP POLICY IF EXISTS "Admins e médicos podem criar templates" ON public.templates_prescricao;
DROP POLICY IF EXISTS "Admins e médicos podem editar templates" ON public.templates_prescricao;
DROP POLICY IF EXISTS "Admins e médicos podem excluir templates" ON public.templates_prescricao;

CREATE POLICY "templates_prescricao_select_scoped" ON public.templates_prescricao
  FOR SELECT TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

CREATE POLICY "templates_prescricao_insert_scoped" ON public.templates_prescricao
  FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND ((clinica_id = get_my_clinica_id()) OR clinica_id IS NULL));

CREATE POLICY "templates_prescricao_update_scoped" ON public.templates_prescricao
  FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id))
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

CREATE POLICY "templates_prescricao_delete_scoped" ON public.templates_prescricao
  FOR DELETE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

-- 2. templates_atestado: Add clinic-scoping
DROP POLICY IF EXISTS "Médicos e admins podem ver templates atestado" ON public.templates_atestado;
DROP POLICY IF EXISTS "Admins e médicos podem criar templates atestado" ON public.templates_atestado;
DROP POLICY IF EXISTS "Admins e médicos podem editar templates atestado" ON public.templates_atestado;
DROP POLICY IF EXISTS "Admins e médicos podem excluir templates atestado" ON public.templates_atestado;

CREATE POLICY "templates_atestado_select_scoped" ON public.templates_atestado
  FOR SELECT TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

CREATE POLICY "templates_atestado_insert_scoped" ON public.templates_atestado
  FOR INSERT TO authenticated
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND ((clinica_id = get_my_clinica_id()) OR clinica_id IS NULL));

CREATE POLICY "templates_atestado_update_scoped" ON public.templates_atestado
  FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id))
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

CREATE POLICY "templates_atestado_delete_scoped" ON public.templates_atestado
  FOR DELETE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

-- 3. triagens: Add clinic-scoping to UPDATE
DROP POLICY IF EXISTS "triagens_update_scoped" ON public.triagens;
DROP POLICY IF EXISTS "Equipe clínica pode atualizar triagens" ON public.triagens;

CREATE POLICY "triagens_update_clinic_scoped" ON public.triagens
  FOR UPDATE TO authenticated
  USING (can_access_clinical(auth.uid()) AND is_same_clinica(clinica_id))
  WITH CHECK (can_access_clinical(auth.uid()) AND is_same_clinica(clinica_id));

-- 4. protocolos_clinicos: Add clinic-scoping to UPDATE
DROP POLICY IF EXISTS "protocolos_clinicos_update_scoped" ON public.protocolos_clinicos;
DROP POLICY IF EXISTS "Admins e médicos podem editar protocolos" ON public.protocolos_clinicos;

CREATE POLICY "protocolos_clinicos_update_scoped" ON public.protocolos_clinicos
  FOR UPDATE TO authenticated
  USING ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id))
  WITH CHECK ((is_admin(auth.uid()) OR is_medico(auth.uid())) AND is_same_clinica(clinica_id));

-- 5. lista_espera: Add clinic-scoping to UPDATE
DROP POLICY IF EXISTS "lista_espera_update_scoped" ON public.lista_espera;
DROP POLICY IF EXISTS "Recepção e admins podem atualizar lista de espera" ON public.lista_espera;

CREATE POLICY "lista_espera_update_scoped" ON public.lista_espera
  FOR UPDATE TO authenticated
  USING (can_manage_data(auth.uid()) AND is_same_clinica(clinica_id))
  WITH CHECK (can_manage_data(auth.uid()) AND is_same_clinica(clinica_id));

-- 6. precos_exames_convenio: Add clinic-scoping to SELECT
DROP POLICY IF EXISTS "Authenticated users can view exam prices" ON public.precos_exames_convenio;
DROP POLICY IF EXISTS "precos_exames_convenio_select" ON public.precos_exames_convenio;

CREATE POLICY "precos_exames_convenio_select_scoped" ON public.precos_exames_convenio
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

-- 7. precos_consulta_convenio: Add clinic-scoping to SELECT
DROP POLICY IF EXISTS "Authenticated users can view consultation prices" ON public.precos_consulta_convenio;
DROP POLICY IF EXISTS "precos_consulta_convenio_select" ON public.precos_consulta_convenio;

CREATE POLICY "precos_consulta_convenio_select_scoped" ON public.precos_consulta_convenio
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

-- 8. automation_logs: Restrict INSERT to admin/service only
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.automation_logs;

CREATE POLICY "automation_logs_insert_admin" ON public.automation_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR clinica_id IS NULL));

-- 9. notification_queue: Restrict INSERT to admin only
DROP POLICY IF EXISTS "Admins podem gerenciar fila" ON public.notification_queue;

CREATE POLICY "notification_queue_select_admin" ON public.notification_queue
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "notification_queue_insert_admin" ON public.notification_queue
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR clinica_id IS NULL));

CREATE POLICY "notification_queue_update_admin" ON public.notification_queue
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "notification_queue_delete_admin" ON public.notification_queue
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));
