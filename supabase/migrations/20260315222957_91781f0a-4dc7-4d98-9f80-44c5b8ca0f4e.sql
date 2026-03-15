
ALTER TABLE public.coletas_laboratorio
  ADD COLUMN IF NOT EXISTS volume_ml numeric NULL,
  ADD COLUMN IF NOT EXISTS condicao_amostra text[] NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sitio_coleta text NULL,
  ADD COLUMN IF NOT EXISTS lote_insumo text NULL;
