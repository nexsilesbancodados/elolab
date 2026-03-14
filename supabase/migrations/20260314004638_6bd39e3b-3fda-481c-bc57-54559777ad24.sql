-- Create functions to mask CPF for display (shows only last 2 digits)
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL OR length(cpf_value) < 4 THEN cpf_value
    ELSE '***.' || '***.' || '***-' || right(replace(replace(cpf_value, '.', ''), '-', ''), 2)
  END;
$$;

-- Function to normalize CPF (remove non-digits)
CREATE OR REPLACE FUNCTION public.normalize_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(cpf_value, '[^0-9]', '', 'g');
$$;

-- Add index on CPF for faster lookups
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON public.pacientes (cpf);