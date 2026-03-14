
-- Tabela de bloqueios de horários na agenda
CREATE TABLE public.bloqueios_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  dia_inteiro BOOLEAN DEFAULT true,
  motivo TEXT,
  tipo TEXT DEFAULT 'bloqueio',
  recorrente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bloqueios_select" ON public.bloqueios_agenda
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()));

CREATE POLICY "bloqueios_insert" ON public.bloqueios_agenda
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()) OR is_recepcao(auth.uid()));

CREATE POLICY "bloqueios_update" ON public.bloqueios_agenda
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()) OR is_medico(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE POLICY "bloqueios_delete" ON public.bloqueios_agenda
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE TRIGGER update_bloqueios_updated_at
  BEFORE UPDATE ON public.bloqueios_agenda
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
