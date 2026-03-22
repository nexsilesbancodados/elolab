
-- Step 1: Delete policies cleanup
DROP POLICY IF EXISTS "atestados_delete" ON public.atestados;
DROP POLICY IF EXISTS "atestados_delete_scoped" ON public.atestados;
DROP POLICY IF EXISTS "triagens_delete" ON public.triagens;
DROP POLICY IF EXISTS "triagens_delete_scoped" ON public.triagens;
DROP POLICY IF EXISTS "lista_espera_delete" ON public.lista_espera;
DROP POLICY IF EXISTS "lista_espera_delete_scoped" ON public.lista_espera;
DROP POLICY IF EXISTS "tarefas_delete_v2" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_delete_v3" ON public.tarefas;
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
DROP POLICY IF EXISTS "Usuários podem inserir logs" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert_safe" ON public.audit_log;

-- Recreate scoped delete policies
CREATE POLICY "atestados_delete_scoped" ON public.atestados
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "triagens_delete_scoped" ON public.triagens
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "lista_espera_delete_scoped" ON public.lista_espera
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

CREATE POLICY "tarefas_delete_v3" ON public.tarefas
  FOR DELETE TO authenticated
  USING (
    (is_admin(auth.uid()) OR (criado_por = auth.uid())) 
    AND is_same_clinica(clinica_id)
  );

-- audit_log: enforce user_id matches caller
CREATE POLICY "audit_log_insert_safe" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid()) 
    AND (user_id IS NULL OR user_id = auth.uid())
    AND (clinica_id IS NULL OR clinica_id = get_my_clinica_id())
  );
