
-- Fix remaining 3 security findings

-- 1. funcionarios_safe is a VIEW with security_invoker=true
-- Views inherit RLS from underlying tables - this is a false positive
-- But let's mark it explicitly safe by noting it's a view

-- 2. mercadopago webhook logs: restrict to admin only
DROP POLICY IF EXISTS "webhook_logs_insert" ON public.mercadopago_webhook_logs;
DROP POLICY IF EXISTS "Webhook pode inserir logs" ON public.mercadopago_webhook_logs;

CREATE POLICY "webhook_logs_insert_restricted" ON public.mercadopago_webhook_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- 3. Fix NULL clinica_id exposure - tighten is_same_clinica
-- Instead of allowing NULL for all admins, only allow if record truly belongs to no clinic
CREATE OR REPLACE FUNCTION public.is_same_clinica(record_clinica_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN record_clinica_id IS NULL THEN false
    ELSE record_clinica_id = (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  END
$$;
