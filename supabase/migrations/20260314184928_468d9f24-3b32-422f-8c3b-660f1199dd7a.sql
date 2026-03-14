-- Allow anyone to SELECT registros_pendentes by invite code (for signup validation)
CREATE POLICY "anon_select_registros_by_code"
ON public.registros_pendentes
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to UPDATE registros_pendentes (for activation after signup)
CREATE POLICY "authenticated_update_registros"
ON public.registros_pendentes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon INSERT (for public-checkout edge function fallback)
CREATE POLICY "service_insert_registros"
ON public.registros_pendentes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);