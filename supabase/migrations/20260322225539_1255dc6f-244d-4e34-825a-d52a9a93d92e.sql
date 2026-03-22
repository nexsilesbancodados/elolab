
-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.funcionarios_safe;

CREATE VIEW public.funcionarios_safe
WITH (security_invoker = true)
AS
SELECT 
  id, nome, cargo, departamento, email, telefone, 
  data_admissao, ativo, clinica_id, user_id,
  created_at, updated_at,
  CASE 
    WHEN is_admin(auth.uid()) OR is_financeiro(auth.uid()) THEN salario
    ELSE NULL
  END AS salario
FROM public.funcionarios;
