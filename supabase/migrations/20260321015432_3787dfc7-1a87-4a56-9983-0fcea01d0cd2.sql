-- Allow any authenticated user to insert/update/delete their own configuracoes_clinica
DROP POLICY IF EXISTS config_insert ON public.configuracoes_clinica;
DROP POLICY IF EXISTS config_update ON public.configuracoes_clinica;
DROP POLICY IF EXISTS config_delete ON public.configuracoes_clinica;

CREATE POLICY "config_insert" ON public.configuracoes_clinica
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "config_update" ON public.configuracoes_clinica
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "config_delete" ON public.configuracoes_clinica
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add unique constraint for upsert to work
ALTER TABLE public.configuracoes_clinica
  DROP CONSTRAINT IF EXISTS configuracoes_clinica_user_chave_key;
ALTER TABLE public.configuracoes_clinica
  ADD CONSTRAINT configuracoes_clinica_user_chave_key UNIQUE (user_id, chave);