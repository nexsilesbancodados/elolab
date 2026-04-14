
ALTER TABLE public.coletas_laboratorio
ADD COLUMN IF NOT EXISTS finalidade text DEFAULT 'diagnostico',
ADD COLUMN IF NOT EXISTS indicacao_clinica text,
ADD COLUMN IF NOT EXISTS categoria_exame text;
