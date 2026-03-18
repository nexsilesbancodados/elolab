-- Add missing columns to triagens table
ALTER TABLE public.triagens ADD COLUMN IF NOT EXISTS glicemia numeric NULL;
ALTER TABLE public.triagens ADD COLUMN IF NOT EXISTS dor_escala integer NULL;

-- Add 'azul' to classificacao_risco enum
ALTER TYPE public.classificacao_risco ADD VALUE IF NOT EXISTS 'azul';

-- Make agendamento_id nullable (triagem can happen without appointment)
ALTER TABLE public.triagens ALTER COLUMN agendamento_id DROP NOT NULL;