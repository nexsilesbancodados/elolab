-- Add tentativas column to track retry attempts
ALTER TABLE public.mercadopago_webhook_logs
ADD COLUMN IF NOT EXISTS tentativas integer DEFAULT 0;

-- Create unique index on event_id for idempotency — prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_mercadopago_webhook_logs_event_id_unique
ON public.mercadopago_webhook_logs(event_id)
WHERE event_id IS NOT NULL;

-- Create index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_logs_event_type
ON public.mercadopago_webhook_logs(event_type);

-- Create index on processado for finding unprocessed webhooks
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_logs_processado
ON public.mercadopago_webhook_logs(processado)
WHERE processado = false;

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhook_logs_created_at
ON public.mercadopago_webhook_logs(created_at DESC);
