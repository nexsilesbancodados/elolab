DROP POLICY IF EXISTS "pacientes_insert" ON public.pacientes;

CREATE POLICY "pacientes_insert"
ON public.pacientes
FOR INSERT
TO authenticated
WITH CHECK (can_manage_data(auth.uid()) OR is_medico(auth.uid()));