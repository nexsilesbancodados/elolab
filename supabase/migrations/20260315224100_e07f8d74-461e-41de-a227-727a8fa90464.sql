
ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS codigo_ean text NULL,
  ADD COLUMN IF NOT EXISTS fabricante text NULL,
  ADD COLUMN IF NOT EXISTS valor_venda numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_maxima integer NULL,
  ADD COLUMN IF NOT EXISTS ponto_pedido integer NULL,
  ADD COLUMN IF NOT EXISTS principio_ativo text NULL,
  ADD COLUMN IF NOT EXISTS dosagem text NULL,
  ADD COLUMN IF NOT EXISTS foto_url text NULL;
