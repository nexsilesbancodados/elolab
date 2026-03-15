
ALTER TABLE public.convenios
  ADD COLUMN IF NOT EXISTS registro_ans text NULL,
  ADD COLUMN IF NOT EXISTS codigo_operadora text NULL,
  ADD COLUMN IF NOT EXISTS versao_tiss text NULL DEFAULT '04.01.00',
  ADD COLUMN IF NOT EXISTS prazo_retorno integer NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS taxa_glosa numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portal_url text NULL,
  ADD COLUMN IF NOT EXISTS responsavel_nome text NULL,
  ADD COLUMN IF NOT EXISTS responsavel_cargo text NULL,
  ADD COLUMN IF NOT EXISTS responsavel_telefone text NULL,
  ADD COLUMN IF NOT EXISTS logo_url text NULL;
