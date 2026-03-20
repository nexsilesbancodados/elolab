
-- Tabela de tipos de consulta
CREATE TABLE public.tipos_consulta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  duracao_minutos integer DEFAULT 30,
  cor text DEFAULT '#6366f1',
  ativo boolean DEFAULT true,
  valor_particular numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de preços por convênio
CREATE TABLE public.precos_consulta_convenio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_consulta_id uuid NOT NULL REFERENCES public.tipos_consulta(id) ON DELETE CASCADE,
  convenio_id uuid NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tipo_consulta_id, convenio_id)
);

-- RLS
ALTER TABLE public.tipos_consulta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_consulta_convenio ENABLE ROW LEVEL SECURITY;

-- Policies tipos_consulta
CREATE POLICY "tipos_consulta_select" ON public.tipos_consulta FOR SELECT TO authenticated USING (has_any_role(auth.uid()));
CREATE POLICY "tipos_consulta_insert" ON public.tipos_consulta FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "tipos_consulta_update" ON public.tipos_consulta FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "tipos_consulta_delete" ON public.tipos_consulta FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Policies precos_consulta_convenio
CREATE POLICY "precos_consulta_select" ON public.precos_consulta_convenio FOR SELECT TO authenticated USING (has_any_role(auth.uid()));
CREATE POLICY "precos_consulta_insert" ON public.precos_consulta_convenio FOR INSERT TO authenticated WITH CHECK (can_access_financial(auth.uid()));
CREATE POLICY "precos_consulta_update" ON public.precos_consulta_convenio FOR UPDATE TO authenticated USING (can_access_financial(auth.uid())) WITH CHECK (can_access_financial(auth.uid()));
CREATE POLICY "precos_consulta_delete" ON public.precos_consulta_convenio FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Triggers updated_at
CREATE TRIGGER update_tipos_consulta_updated_at BEFORE UPDATE ON public.tipos_consulta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_precos_consulta_convenio_updated_at BEFORE UPDATE ON public.precos_consulta_convenio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
