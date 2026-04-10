
DROP POLICY IF EXISTS "config_select" ON public.configuracoes_clinica;
CREATE POLICY "config_select" ON public.configuracoes_clinica
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
