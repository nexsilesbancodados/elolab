
-- =============================================
-- SECURITY FIX: 10 vulnerabilidades RLS
-- =============================================

-- 1. FIX: employee_invitations - anon can enumerate all pending invitations
-- Drop the overly permissive policy and replace with a function-based approach
DROP POLICY IF EXISTS "anon_select_invitation_by_token_scoped" ON public.employee_invitations;

-- Anon should only read a specific invitation when they know the token
-- We use a restrictive policy that requires token match via RPC instead
CREATE POLICY "anon_select_invitation_by_token_v2"
ON public.employee_invitations FOR SELECT TO anon
USING (false); -- Block direct anon reads; use RPC accept_employee_invitation instead

-- 2. FIX: registros_pendentes - anon can read all pending registrations
DROP POLICY IF EXISTS "anon_select_registros_by_code_scoped" ON public.registros_pendentes;

CREATE POLICY "anon_select_registros_by_code_v2"
ON public.registros_pendentes FOR SELECT TO anon
USING (false); -- Block direct anon reads; use RPC activate_public_registration instead

-- 3. FIX: resultados_laboratorio - no clinica_id filter
DROP POLICY IF EXISTS "resultados_select" ON public.resultados_laboratorio;

CREATE POLICY "resultados_select_scoped"
ON public.resultados_laboratorio FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid()) 
  AND (NOT is_financeiro(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 4. FIX: consentimentos_lgpd - no clinica_id filter
DROP POLICY IF EXISTS "consentimentos_select" ON public.consentimentos_lgpd;

CREATE POLICY "consentimentos_select_scoped"
ON public.consentimentos_lgpd FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid()) 
  AND (NOT is_financeiro(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 5. FIX: prescricoes - delete/update without clinica_id
DROP POLICY IF EXISTS "prescricoes_delete" ON public.prescricoes;
DROP POLICY IF EXISTS "prescricoes_update" ON public.prescricoes;

CREATE POLICY "prescricoes_delete_scoped"
ON public.prescricoes FOR DELETE TO authenticated
USING (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
);

CREATE POLICY "prescricoes_update_scoped"
ON public.prescricoes FOR UPDATE TO authenticated
USING (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
)
WITH CHECK (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 6. FIX: atestados - update without clinica_id
DROP POLICY IF EXISTS "atestados_update" ON public.atestados;

CREATE POLICY "atestados_update_scoped"
ON public.atestados FOR UPDATE TO authenticated
USING (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
)
WITH CHECK (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 7. FIX: encaminhamentos - update without clinica_id
DROP POLICY IF EXISTS "encaminhamentos_update" ON public.encaminhamentos;

CREATE POLICY "encaminhamentos_update_scoped"
ON public.encaminhamentos FOR UPDATE TO authenticated
USING (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
)
WITH CHECK (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 8. FIX: tarefas - no clinica_id filter
DROP POLICY IF EXISTS "tarefas_select" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_update" ON public.tarefas;

CREATE POLICY "tarefas_select_scoped"
ON public.tarefas FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid())
  AND is_same_clinica(clinica_id)
);

CREATE POLICY "tarefas_update_scoped"
ON public.tarefas FOR UPDATE TO authenticated
USING (
  has_any_role(auth.uid())
  AND is_same_clinica(clinica_id)
)
WITH CHECK (
  has_any_role(auth.uid())
  AND is_same_clinica(clinica_id)
);

-- 9. FIX: whatsapp tables - no clinica_id filter
DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_agents_select" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "whatsapp_sessions_select" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "whatsapp_agent_actions_select" ON public.whatsapp_agent_actions;

CREATE POLICY "whatsapp_conversations_select_scoped"
ON public.whatsapp_conversations FOR SELECT TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_messages_select_scoped"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agents_select_scoped"
ON public.whatsapp_agents FOR SELECT TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_sessions_select_scoped"
ON public.whatsapp_sessions FOR SELECT TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agent_actions_select_scoped"
ON public.whatsapp_agent_actions FOR SELECT TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

-- 10. FIX: triagens - insert without clinica_id scope
DROP POLICY IF EXISTS "triagens_insert" ON public.triagens;

CREATE POLICY "triagens_insert_scoped"
ON public.triagens FOR INSERT TO authenticated
WITH CHECK (
  can_access_clinical(auth.uid())
  AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL))
);
