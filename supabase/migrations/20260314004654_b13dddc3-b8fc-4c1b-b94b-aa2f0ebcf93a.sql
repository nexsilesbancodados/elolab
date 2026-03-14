-- Fix search_path for mask_cpf
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL OR length(cpf_value) < 4 THEN cpf_value
    ELSE '***.' || '***.' || '***-' || right(replace(replace(cpf_value, '.', ''), '-', ''), 2)
  END;
$$;

-- Fix search_path for normalize_cpf
CREATE OR REPLACE FUNCTION public.normalize_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(cpf_value, '[^0-9]', '', 'g');
$$;