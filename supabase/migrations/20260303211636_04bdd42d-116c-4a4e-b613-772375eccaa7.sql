
-- Add trial columns to assinaturas_plano
ALTER TABLE public.assinaturas_plano 
  ADD COLUMN IF NOT EXISTS em_trial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_fim timestamp with time zone DEFAULT NULL;

-- Add trial_dias to planos table
ALTER TABLE public.planos 
  ADD COLUMN IF NOT EXISTS trial_dias integer DEFAULT 3;
