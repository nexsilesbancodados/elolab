-- Allow public (anonymous) access to read active plans
CREATE POLICY "planos_public_select" 
ON public.planos 
FOR SELECT 
USING (ativo = true);