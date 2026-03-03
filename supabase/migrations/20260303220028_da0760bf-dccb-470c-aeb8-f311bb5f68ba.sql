
-- ========================================
-- MÓDULO LABORATÓRIO
-- ========================================

-- Tabela de coletas de amostras
CREATE TABLE public.coletas_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  exame_id uuid REFERENCES public.exames(id) ON DELETE SET NULL,
  medico_solicitante_id uuid REFERENCES public.medicos(id) ON DELETE SET NULL,
  codigo_amostra text NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  tipo_amostra text NOT NULL DEFAULT 'sangue',
  tubo text,
  status text NOT NULL DEFAULT 'pendente',
  data_coleta timestamp with time zone,
  coletado_por uuid REFERENCES public.profiles(id),
  observacoes text,
  jejum_necessario boolean DEFAULT false,
  jejum_horas integer,
  urgente boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coletas_laboratorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coletas_select" ON public.coletas_laboratorio FOR SELECT
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()));
CREATE POLICY "coletas_insert" ON public.coletas_laboratorio FOR INSERT
  WITH CHECK (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()));
CREATE POLICY "coletas_update" ON public.coletas_laboratorio FOR UPDATE
  USING (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()))
  WITH CHECK (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()));
CREATE POLICY "coletas_delete" ON public.coletas_laboratorio FOR DELETE
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_coletas_laboratorio_updated_at
  BEFORE UPDATE ON public.coletas_laboratorio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de resultados laboratoriais
CREATE TABLE public.resultados_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coleta_id uuid NOT NULL REFERENCES public.coletas_laboratorio(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  exame_id uuid REFERENCES public.exames(id) ON DELETE SET NULL,
  parametro text NOT NULL,
  resultado text NOT NULL,
  unidade text,
  valor_referencia_min numeric,
  valor_referencia_max numeric,
  valor_referencia_texto text,
  status_resultado text DEFAULT 'normal',
  metodo text,
  equipamento text,
  validado_por uuid REFERENCES public.profiles(id),
  data_validacao timestamp with time zone,
  liberado boolean DEFAULT false,
  data_liberacao timestamp with time zone,
  liberado_por uuid REFERENCES public.profiles(id),
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.resultados_laboratorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resultados_select" ON public.resultados_laboratorio FOR SELECT
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()));
CREATE POLICY "resultados_insert" ON public.resultados_laboratorio FOR INSERT
  WITH CHECK (can_access_clinical(auth.uid()));
CREATE POLICY "resultados_update" ON public.resultados_laboratorio FOR UPDATE
  USING (can_access_clinical(auth.uid()))
  WITH CHECK (can_access_clinical(auth.uid()));
CREATE POLICY "resultados_delete" ON public.resultados_laboratorio FOR DELETE
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_resultados_laboratorio_updated_at
  BEFORE UPDATE ON public.resultados_laboratorio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de preços de exames por convênio
CREATE TABLE public.precos_exames_convenio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convenio_id uuid NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
  tipo_exame text NOT NULL,
  codigo_tuss text,
  descricao text,
  valor_tabela numeric NOT NULL DEFAULT 0,
  valor_filme numeric DEFAULT 0,
  valor_total numeric GENERATED ALWAYS AS (valor_tabela + COALESCE(valor_filme, 0)) STORED,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(convenio_id, tipo_exame)
);

ALTER TABLE public.precos_exames_convenio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precos_select" ON public.precos_exames_convenio FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE POLICY "precos_insert" ON public.precos_exames_convenio FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR is_financeiro(auth.uid()));
CREATE POLICY "precos_update" ON public.precos_exames_convenio FOR UPDATE
  USING (is_admin(auth.uid()) OR is_financeiro(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_financeiro(auth.uid()));
CREATE POLICY "precos_delete" ON public.precos_exames_convenio FOR DELETE
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_precos_exames_convenio_updated_at
  BEFORE UPDATE ON public.precos_exames_convenio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TAREFAS INTERNAS
-- ========================================

CREATE TABLE public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'pendente',
  prioridade text NOT NULL DEFAULT 'media',
  responsavel_id uuid REFERENCES public.profiles(id),
  criado_por uuid REFERENCES public.profiles(id),
  data_vencimento date,
  data_conclusao timestamp with time zone,
  categoria text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas_select" ON public.tarefas FOR SELECT
  USING (has_any_role(auth.uid()));
CREATE POLICY "tarefas_insert" ON public.tarefas FOR INSERT
  WITH CHECK (has_any_role(auth.uid()));
CREATE POLICY "tarefas_update" ON public.tarefas FOR UPDATE
  USING (has_any_role(auth.uid()))
  WITH CHECK (has_any_role(auth.uid()));
CREATE POLICY "tarefas_delete" ON public.tarefas FOR DELETE
  USING (is_admin(auth.uid()) OR criado_por = auth.uid());

CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_coletas_paciente ON public.coletas_laboratorio(paciente_id);
CREATE INDEX idx_coletas_status ON public.coletas_laboratorio(status);
CREATE INDEX idx_resultados_coleta ON public.resultados_laboratorio(coleta_id);
CREATE INDEX idx_resultados_paciente ON public.resultados_laboratorio(paciente_id);
CREATE INDEX idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_precos_convenio ON public.precos_exames_convenio(convenio_id);
