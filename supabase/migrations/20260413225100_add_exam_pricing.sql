-- Tabela de laboratórios/fornecedores
CREATE TABLE IF NOT EXISTS public.laboratorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.laboratorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica acessa seus laboratorios" ON public.laboratorios
  FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

-- Tabela de tipos de exames (para categorização)
CREATE TABLE IF NOT EXISTS public.tipo_exames_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  codigo_tuss text,
  preco_custo numeric(10,2),
  preco_venda numeric(10,2),
  laboratorio_id uuid REFERENCES public.laboratorios(id) ON DELETE SET NULL,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tipo_exames_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica acessa seu catalogo" ON public.tipo_exames_catalog
  FOR ALL
  USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));

-- Adicionar colunas na tabela exames
ALTER TABLE public.exames
ADD COLUMN IF NOT EXISTS tipo_categorizado text DEFAULT 'laboratorial',
ADD COLUMN IF NOT EXISTS laboratorio_id uuid REFERENCES public.laboratorios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS preco_custo numeric(10,2),
ADD COLUMN IF NOT EXISTS preco_venda numeric(10,2),
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'geral';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_laboratorios_clinica ON public.laboratorios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_tipo_exames_clinica ON public.tipo_exames_catalog(clinica_id);
CREATE INDEX IF NOT EXISTS idx_exames_laboratorio ON public.exames(laboratorio_id);
