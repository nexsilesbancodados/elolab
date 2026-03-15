
-- Add nome and email columns to medicos table for doctor identity and invitation
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS email text;
