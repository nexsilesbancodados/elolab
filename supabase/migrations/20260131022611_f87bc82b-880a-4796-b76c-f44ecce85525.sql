-- Corrigir política RLS permissiva para automation_logs
DROP POLICY IF EXISTS "Admins podem inserir logs" ON public.automation_logs;

-- Nova política mais restritiva - permite inserção apenas de funções do sistema (service role)
CREATE POLICY "Sistema pode inserir logs"
ON public.automation_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');