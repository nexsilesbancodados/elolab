-- 1. Make medico_solicitante_id nullable
ALTER TABLE public.exames ALTER COLUMN medico_solicitante_id DROP NOT NULL;

-- 2. Update INSERT policy to allow enfermagem and recepcao
DROP POLICY IF EXISTS "exames_insert" ON public.exames;
CREATE POLICY "exames_insert" ON public.exames
FOR INSERT TO authenticated
WITH CHECK (
  (is_admin(auth.uid()) OR is_medico(auth.uid()) OR is_enfermagem(auth.uid()) OR is_recepcao(auth.uid()))
  AND ((clinica_id = get_my_clinica_id()) OR (clinica_id IS NULL))
);

-- 3. Update UPDATE policy to include enfermagem
DROP POLICY IF EXISTS "exames_update" ON public.exames;
CREATE POLICY "exames_update" ON public.exames
FOR UPDATE TO authenticated
USING (
  (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()))
  AND is_same_clinica(clinica_id)
);