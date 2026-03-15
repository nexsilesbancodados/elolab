
ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS fornecedor text NULL,
  ADD COLUMN IF NOT EXISTS numero_documento text NULL,
  ADD COLUMN IF NOT EXISTS data_emissao date NULL,
  ADD COLUMN IF NOT EXISTS competencia text NULL,
  ADD COLUMN IF NOT EXISTS recorrente boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_recorrencia text NULL,
  ADD COLUMN IF NOT EXISTS centro_custo text NULL,
  ADD COLUMN IF NOT EXISTS anexo_url text NULL,
  ADD COLUMN IF NOT EXISTS observacoes text NULL;
