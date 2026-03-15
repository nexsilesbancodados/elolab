
ALTER TABLE public.pagamentos_mercadopago
  ADD COLUMN IF NOT EXISTS conta_destino text NULL,
  ADD COLUMN IF NOT EXISTS data_recebimento date NULL,
  ADD COLUMN IF NOT EXISTS desconto numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acrescimo numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes_caixa text NULL,
  ADD COLUMN IF NOT EXISTS numero_parcelas integer NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS intervalo_parcelas integer NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS parcela_atual integer NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cobranca_direta boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contrato_url text NULL;
