
-- Add comprehensive medical record fields to prontuarios
ALTER TABLE public.prontuarios
  ADD COLUMN IF NOT EXISTS historia_patologica_pregressa text,
  ADD COLUMN IF NOT EXISTS historia_familiar text,
  ADD COLUMN IF NOT EXISTS historia_social text,
  ADD COLUMN IF NOT EXISTS revisao_sistemas text,
  ADD COLUMN IF NOT EXISTS alergias_relatadas text,
  ADD COLUMN IF NOT EXISTS medicamentos_em_uso text,
  ADD COLUMN IF NOT EXISTS sinais_vitais jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS exame_cabeca_pescoco text,
  ADD COLUMN IF NOT EXISTS exame_torax text,
  ADD COLUMN IF NOT EXISTS exame_abdomen text,
  ADD COLUMN IF NOT EXISTS exame_membros text,
  ADD COLUMN IF NOT EXISTS exame_neurologico text,
  ADD COLUMN IF NOT EXISTS exame_pele text,
  ADD COLUMN IF NOT EXISTS diagnostico_principal text,
  ADD COLUMN IF NOT EXISTS diagnosticos_secundarios text[],
  ADD COLUMN IF NOT EXISTS plano_terapeutico text,
  ADD COLUMN IF NOT EXISTS orientacoes_paciente text,
  ADD COLUMN IF NOT EXISTS observacoes_internas text;
