-- Criar tabela caixa_diario com RLS
CREATE TABLE IF NOT EXISTS public.caixa_diario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  aberto boolean NOT NULL DEFAULT true,
  valor_abertura numeric(10,2) NOT NULL DEFAULT 0,
  valor_fechamento numeric(10,2),
  operador_abertura text,
  operador_fechamento text,
  observacoes text,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(data, clinica_id)
);

-- Enable RLS
ALTER TABLE public.caixa_diario ENABLE ROW LEVEL SECURITY;

-- RLS Policy: usuários acessam apenas caixa da sua clínica
CREATE POLICY "Clinica acessa caixa_diario" ON public.caixa_diario
  FOR ALL 
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

-- Corrigir lancamentos: expandir tipo CHECK
ALTER TABLE public.lancamentos DROP CONSTRAINT IF EXISTS lancamentos_tipo_check;
ALTER TABLE public.lancamentos ADD CONSTRAINT lancamentos_tipo_check
  CHECK (tipo IN ('receita', 'despesa', 'sangria', 'suprimento'));

-- Tornar categoria opcional com default
ALTER TABLE public.lancamentos ALTER COLUMN categoria SET DEFAULT 'geral';

-- Expandir forma_pagamento CHECK para aceitar alias curtos e longos
ALTER TABLE public.lancamentos DROP CONSTRAINT IF EXISTS lancamentos_forma_pagamento_check;
ALTER TABLE public.lancamentos ADD CONSTRAINT lancamentos_forma_pagamento_check
  CHECK (forma_pagamento IN (
    'dinheiro','pix','credito','debito',
    'cartao_credito','cartao_debito','convenio','boleto','transferencia','cheque'
  ));

-- Index para queries rápidas
CREATE INDEX IF NOT EXISTS idx_caixa_diario_data_clinica 
  ON public.caixa_diario(data, clinica_id);
