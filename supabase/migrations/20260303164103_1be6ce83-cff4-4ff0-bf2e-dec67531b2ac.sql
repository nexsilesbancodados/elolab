
-- Remover a policy permissiva e substituir por uma que permite inserção via service_role
DROP POLICY IF EXISTS "webhook_logs_insert" ON public.mercadopago_webhook_logs;

CREATE POLICY "webhook_logs_insert" ON public.mercadopago_webhook_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    OR ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text
  );
