ALTER TABLE public.precos_exames_convenio 
ADD COLUMN IF NOT EXISTS valor_custo numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_repasse numeric DEFAULT 0;