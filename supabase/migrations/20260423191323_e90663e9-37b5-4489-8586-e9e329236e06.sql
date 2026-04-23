-- 1. Tabela de laboratórios/fornecedores
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

-- 2. Tabela de tipos de exames (para catalogo)
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

-- 3. Adicionar colunas na tabela exames
ALTER TABLE public.exames
ADD COLUMN IF NOT EXISTS tipo_categorizado text DEFAULT 'laboratorial',
ADD COLUMN IF NOT EXISTS laboratorio_id uuid REFERENCES public.laboratorios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS preco_custo numeric(10,2),
ADD COLUMN IF NOT EXISTS preco_venda numeric(10,2),
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'geral';

-- 4. Tabela de NPS Feedback
CREATE TABLE IF NOT EXISTS public.feedbacks_nps (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references public.pacientes(id) on delete set null,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  medico_id uuid references public.medicos(id) on delete set null,
  nota integer not null check (nota between 1 and 10),
  comentario text,
  categoria text check (categoria in ('atendimento','espera','estrutura','medico','geral')),
  created_at timestamptz default now()
);

ALTER TABLE public.feedbacks_nps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nps_insert_policy" ON public.feedbacks_nps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "nps_select_policy" ON public.feedbacks_nps
  FOR SELECT USING (true);

-- View for NPS summary
CREATE OR REPLACE VIEW public.nps_resumo_mensal AS
SELECT
  date_trunc('month', created_at) as mes,
  count(*) as total,
  round(avg(nota)::numeric, 2) as media,
  count(*) filter (where nota >= 9) as promotores,
  count(*) filter (where nota between 7 and 8) as neutros,
  count(*) filter (where nota <= 6) as detratores,
  round(
    (count(*) filter (where nota >= 9)::float - count(*) filter (where nota <= 6)::float) 
    / nullif(count(*), 0) * 100
  ) as nps_score
FROM public.feedbacks_nps
GROUP BY date_trunc('month', created_at)
ORDER BY mes DESC;

-- 5. Tabela de disponibilidade médica
CREATE TABLE IF NOT EXISTS public.medico_disponibilidade (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id uuid NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  dia_semana integer NOT NULL, -- 0-6 (Sunday to Saturday)
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  duracao_consulta integer NOT NULL DEFAULT 30,
  intervalo_consultas integer NOT NULL DEFAULT 5,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (hora_inicio < hora_fim),
  CONSTRAINT valid_day_of_week CHECK (dia_semana >= 0 AND dia_semana <= 6),
  CONSTRAINT valid_duration CHECK (duracao_consulta > 0),
  CONSTRAINT valid_interval CHECK (intervalo_consultas >= 0)
);

ALTER TABLE public.medico_disponibilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics can view their doctors' availability"
  ON public.medico_disponibilidade
  FOR SELECT
  USING (
    medico_id IN (
      SELECT id FROM public.medicos
      WHERE clinica_id IN (
        SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinics can manage their doctors' availability"
  ON public.medico_disponibilidade
  FOR ALL
  USING (
    medico_id IN (
      SELECT id FROM public.medicos
      WHERE clinica_id IN (
        SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    medico_id IN (
      SELECT id FROM public.medicos
      WHERE clinica_id IN (
        SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_laboratorios_clinica ON public.laboratorios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_tipo_exames_clinica ON public.tipo_exames_catalog(clinica_id);
CREATE INDEX IF NOT EXISTS idx_exames_laboratorio ON public.exames(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_nps_paciente ON public.feedbacks_nps(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medico_disponibilidade_medico_id ON public.medico_disponibilidade(medico_id);
CREATE INDEX IF NOT EXISTS idx_medico_disponibilidade_dia ON public.medico_disponibilidade(medico_id, dia_semana);
