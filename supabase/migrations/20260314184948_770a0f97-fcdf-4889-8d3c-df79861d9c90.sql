-- Drop the overly permissive policies
DROP POLICY IF EXISTS "authenticated_update_registros" ON public.registros_pendentes;
DROP POLICY IF EXISTS "service_insert_registros" ON public.registros_pendentes;

-- Tighter UPDATE: only allow updating your own record (by matching user_id or status transition)
CREATE POLICY "authenticated_update_own_registros"
ON public.registros_pendentes
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR is_admin(auth.uid())
)
WITH CHECK (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
);

-- INSERT only for admins (public-checkout uses service_role)
CREATE POLICY "admin_insert_registros"
ON public.registros_pendentes
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));