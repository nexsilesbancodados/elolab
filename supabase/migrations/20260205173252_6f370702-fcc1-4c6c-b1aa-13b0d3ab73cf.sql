-- Add foto_url column to pacientes table
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS foto_url text;

-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient photos
CREATE POLICY "Authenticated users can view patient photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Clinical staff can upload patient photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Clinical staff can update patient photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete patient photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');

-- Create clinical protocols table
CREATE TABLE IF NOT EXISTS public.protocolos_clinicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  condicao text NOT NULL,
  descricao text,
  passos jsonb NOT NULL DEFAULT '[]'::jsonb,
  medicamentos_sugeridos jsonb DEFAULT '[]'::jsonb,
  exames_sugeridos text[] DEFAULT '{}'::text[],
  orientacoes text,
  cid_relacionados text[] DEFAULT '{}'::text[],
  especialidade text,
  criado_por uuid REFERENCES auth.users(id),
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for protocols
ALTER TABLE public.protocolos_clinicos ENABLE ROW LEVEL SECURITY;

-- RLS policies for protocols
CREATE POLICY "protocolos_select" ON public.protocolos_clinicos
FOR SELECT USING (can_access_clinical(auth.uid()));

CREATE POLICY "protocolos_insert" ON public.protocolos_clinicos
FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE POLICY "protocolos_update" ON public.protocolos_clinicos
FOR UPDATE USING (is_admin(auth.uid()) OR is_medico(auth.uid()))
WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE POLICY "protocolos_delete" ON public.protocolos_clinicos
FOR DELETE USING (is_admin(auth.uid()));

-- Create return appointments table
CREATE TABLE IF NOT EXISTS public.retornos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  prontuario_id uuid REFERENCES public.prontuarios(id) ON DELETE SET NULL,
  medico_id uuid NOT NULL REFERENCES public.medicos(id),
  data_consulta_origem date NOT NULL DEFAULT CURRENT_DATE,
  data_retorno_prevista date NOT NULL,
  motivo text,
  tipo_retorno text DEFAULT 'acompanhamento',
  status text DEFAULT 'pendente',
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  lembrete_enviado boolean DEFAULT false,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for returns
ALTER TABLE public.retornos ENABLE ROW LEVEL SECURITY;

-- RLS policies for returns
CREATE POLICY "retornos_select" ON public.retornos
FOR SELECT USING (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()));

CREATE POLICY "retornos_insert" ON public.retornos
FOR INSERT WITH CHECK (can_access_clinical(auth.uid()));

CREATE POLICY "retornos_update" ON public.retornos
FOR UPDATE USING (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()))
WITH CHECK (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()));

CREATE POLICY "retornos_delete" ON public.retornos
FOR DELETE USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_protocolos_clinicos_updated_at
BEFORE UPDATE ON public.protocolos_clinicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retornos_updated_at
BEFORE UPDATE ON public.retornos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default clinical protocols
INSERT INTO public.protocolos_clinicos (nome, condicao, descricao, passos, medicamentos_sugeridos, exames_sugeridos, orientacoes, especialidade) VALUES
(
  'Hipertensão Arterial - Início de Tratamento',
  'Hipertensão Arterial Sistêmica',
  'Protocolo para início de tratamento de hipertensão arterial em adultos',
  '[{"ordem": 1, "acao": "Aferir PA em repouso (3 medidas)"}, {"ordem": 2, "acao": "Avaliar fatores de risco cardiovascular"}, {"ordem": 3, "acao": "Solicitar exames complementares"}, {"ordem": 4, "acao": "Orientar mudanças de estilo de vida"}, {"ordem": 5, "acao": "Iniciar medicação se PA >= 140/90"}]'::jsonb,
  '[{"nome": "Losartana 50mg", "posologia": "1x ao dia"}, {"nome": "Hidroclorotiazida 25mg", "posologia": "1x ao dia pela manhã"}]'::jsonb,
  ARRAY['Hemograma completo', 'Glicemia de jejum', 'Creatinina', 'Potássio', 'Colesterol total e frações', 'ECG', 'Urina tipo 1'],
  'Dieta hipossódica, atividade física regular 30min/dia, cessar tabagismo, moderar álcool',
  'Clínica Geral'
),
(
  'Diabetes Tipo 2 - Acompanhamento',
  'Diabetes Mellitus Tipo 2',
  'Protocolo de acompanhamento trimestral de pacientes diabéticos',
  '[{"ordem": 1, "acao": "Verificar glicemia capilar"}, {"ordem": 2, "acao": "Avaliar adesão medicamentosa"}, {"ordem": 3, "acao": "Examinar pés (sensibilidade e pulsos)"}, {"ordem": 4, "acao": "Verificar metas glicêmicas"}, {"ordem": 5, "acao": "Ajustar medicação se necessário"}]'::jsonb,
  '[{"nome": "Metformina 850mg", "posologia": "2x ao dia após refeições"}, {"nome": "Glibenclamida 5mg", "posologia": "1x ao dia antes do café"}]'::jsonb,
  ARRAY['Hemoglobina glicada', 'Glicemia de jejum', 'Creatinina', 'Microalbuminúria', 'Fundoscopia anual'],
  'Dieta para diabéticos, exercício físico regular, automonitorização glicêmica',
  'Endocrinologia'
),
(
  'IVAS - Infecção Vias Aéreas Superiores',
  'Resfriado Comum / Gripe',
  'Protocolo para tratamento sintomático de infecções virais das vias aéreas superiores',
  '[{"ordem": 1, "acao": "Avaliar sinais de gravidade (febre alta, dispneia)"}, {"ordem": 2, "acao": "Descartar sinusite/otite/pneumonia"}, {"ordem": 3, "acao": "Prescrever sintomáticos"}, {"ordem": 4, "acao": "Orientar sinais de alarme"}]'::jsonb,
  '[{"nome": "Paracetamol 750mg", "posologia": "6/6h se dor ou febre"}, {"nome": "Loratadina 10mg", "posologia": "1x ao dia se coriza"}]'::jsonb,
  ARRAY[]::text[],
  'Repouso, hidratação abundante, retornar se febre persistente >72h ou piora do quadro',
  'Clínica Geral'
);