
-- =============================================
-- SECURITY FIX ROUND 2: remaining 6 vulnerabilities
-- =============================================

-- 1. FIX: triagens SELECT - no clinica_id filter
DROP POLICY IF EXISTS "triagens_select" ON public.triagens;

CREATE POLICY "triagens_select_scoped"
ON public.triagens FOR SELECT TO authenticated
USING (
  (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()))
  AND is_same_clinica(clinica_id)
);

-- 2. FIX: registros_pendentes - authenticated can claim unassigned rows
DROP POLICY IF EXISTS "authenticated_update_own_registros" ON public.registros_pendentes;

CREATE POLICY "authenticated_update_own_registros_v2"
ON public.registros_pendentes FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid()) OR (user_id = auth.uid())
)
WITH CHECK (
  is_admin(auth.uid()) OR (user_id = auth.uid())
);

-- 3. FIX: whatsapp ALL policies - no clinica_id on write operations
DROP POLICY IF EXISTS "whatsapp_conversations_all" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_messages_all" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_agents_all" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "whatsapp_sessions_all" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "whatsapp_agent_actions_all" ON public.whatsapp_agent_actions;

-- Replace with scoped INSERT/UPDATE/DELETE policies
CREATE POLICY "whatsapp_conversations_insert_scoped"
ON public.whatsapp_conversations FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL)));

CREATE POLICY "whatsapp_conversations_update_scoped"
ON public.whatsapp_conversations FOR UPDATE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id))
WITH CHECK (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_conversations_delete_scoped"
ON public.whatsapp_conversations FOR DELETE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_messages_insert_scoped"
ON public.whatsapp_messages FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL)));

CREATE POLICY "whatsapp_messages_update_scoped"
ON public.whatsapp_messages FOR UPDATE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id))
WITH CHECK (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_messages_delete_scoped"
ON public.whatsapp_messages FOR DELETE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agents_insert_scoped"
ON public.whatsapp_agents FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL)));

CREATE POLICY "whatsapp_agents_update_scoped"
ON public.whatsapp_agents FOR UPDATE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id))
WITH CHECK (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agents_delete_scoped"
ON public.whatsapp_agents FOR DELETE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_sessions_insert_scoped"
ON public.whatsapp_sessions FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL)));

CREATE POLICY "whatsapp_sessions_update_scoped"
ON public.whatsapp_sessions FOR UPDATE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id))
WITH CHECK (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_sessions_delete_scoped"
ON public.whatsapp_sessions FOR DELETE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agent_actions_insert_scoped"
ON public.whatsapp_agent_actions FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL)));

CREATE POLICY "whatsapp_agent_actions_update_scoped"
ON public.whatsapp_agent_actions FOR UPDATE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id))
WITH CHECK (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "whatsapp_agent_actions_delete_scoped"
ON public.whatsapp_agent_actions FOR DELETE TO authenticated
USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

-- 4. FIX: movimentacoes_estoque INSERT - no clinica_id scope
DROP POLICY IF EXISTS "movimentacoes_estoque_insert" ON public.movimentacoes_estoque;

CREATE POLICY "movimentacoes_estoque_insert_scoped"
ON public.movimentacoes_estoque FOR INSERT TO authenticated
WITH CHECK (
  (is_admin(auth.uid()) OR is_enfermagem(auth.uid()) OR is_financeiro(auth.uid()))
  AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL))
);

-- 5. FIX: protocolos_clinicos INSERT - no clinica_id scope
DROP POLICY IF EXISTS "protocolos_insert" ON public.protocolos_clinicos;

CREATE POLICY "protocolos_insert_scoped"
ON public.protocolos_clinicos FOR INSERT TO authenticated
WITH CHECK (
  (is_admin(auth.uid()) OR is_medico(auth.uid()))
  AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL))
);

-- 6. FIX: notification_templates - add SELECT for non-admin staff
CREATE POLICY "notification_templates_select_staff"
ON public.notification_templates FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid()) AND is_same_clinica(clinica_id)
);
