
-- Create helper function first
CREATE OR REPLACE FUNCTION public.user_in_same_clinica(_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT clinica_id FROM public.profiles WHERE id = _target_user_id)
       = (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
$$;

-- user_roles: clinic-scoped policies
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "user_roles_select_v2" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (is_admin(auth.uid()) AND user_in_same_clinica(user_id)));

CREATE POLICY "user_roles_insert_v2" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND user_in_same_clinica(user_id));

CREATE POLICY "user_roles_update_v2" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) AND user_in_same_clinica(user_id))
  WITH CHECK (is_admin(auth.uid()) AND user_in_same_clinica(user_id));

CREATE POLICY "user_roles_delete_v2" ON public.user_roles
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) AND user_in_same_clinica(user_id));

-- tarefas: scoped insert/delete
DROP POLICY IF EXISTS "tarefas_insert" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_insert_scoped" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_delete" ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_delete_scoped" ON public.tarefas;

CREATE POLICY "tarefas_insert_v2" ON public.tarefas
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid()) AND ((clinica_id = get_my_clinica_id()) OR clinica_id IS NULL));

CREATE POLICY "tarefas_delete_v2" ON public.tarefas
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) OR (criado_por = auth.uid()));

-- tipos_consulta: scoped select
DROP POLICY IF EXISTS "tipos_consulta_select" ON public.tipos_consulta;
DROP POLICY IF EXISTS "tipos_consulta_select_scoped" ON public.tipos_consulta;

CREATE POLICY "tipos_consulta_select_v2" ON public.tipos_consulta
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND is_same_clinica(clinica_id));

-- automation_logs: scoped select
DROP POLICY IF EXISTS "Admins podem ver logs" ON public.automation_logs;
DROP POLICY IF EXISTS "automation_logs_select_admin" ON public.automation_logs;

CREATE POLICY "automation_logs_select_v2" ON public.automation_logs
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()) AND is_same_clinica(clinica_id));

-- funcionarios: secure view hiding salary
CREATE OR REPLACE VIEW public.funcionarios_safe AS
SELECT 
  id, nome, cargo, departamento, email, telefone, 
  data_admissao, ativo, clinica_id, user_id,
  created_at, updated_at,
  CASE 
    WHEN is_admin(auth.uid()) OR is_financeiro(auth.uid()) THEN salario
    ELSE NULL
  END AS salario
FROM public.funcionarios;
