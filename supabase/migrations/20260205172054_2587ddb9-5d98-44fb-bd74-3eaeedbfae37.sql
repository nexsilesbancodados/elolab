-- =============================================
-- 1. TABELA DE CONSENTIMENTOS LGPD
-- =============================================
CREATE TABLE public.consentimentos_lgpd (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo_consentimento TEXT NOT NULL DEFAULT 'tratamento_dados',
  versao_termo TEXT NOT NULL DEFAULT '1.0',
  aceito BOOLEAN NOT NULL DEFAULT false,
  data_aceite TIMESTAMP WITH TIME ZONE,
  ip_aceite TEXT,
  documento_assinado_url TEXT,
  revogado BOOLEAN DEFAULT false,
  data_revogacao TIMESTAMP WITH TIME ZONE,
  motivo_revogacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para consentimentos
CREATE INDEX idx_consentimentos_paciente ON public.consentimentos_lgpd(paciente_id);
CREATE INDEX idx_consentimentos_tipo ON public.consentimentos_lgpd(tipo_consentimento);

-- RLS para consentimentos
ALTER TABLE public.consentimentos_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consentimentos_select" ON public.consentimentos_lgpd
  FOR SELECT USING (has_any_role(auth.uid()) AND NOT is_financeiro(auth.uid()));

CREATE POLICY "consentimentos_insert" ON public.consentimentos_lgpd
  FOR INSERT WITH CHECK (can_manage_data(auth.uid()));

CREATE POLICY "consentimentos_update" ON public.consentimentos_lgpd
  FOR UPDATE USING (can_manage_data(auth.uid())) WITH CHECK (can_manage_data(auth.uid()));

CREATE POLICY "consentimentos_delete" ON public.consentimentos_lgpd
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- 2. TABELA DE ANEXOS DO PRONTUÁRIO
-- =============================================
CREATE TABLE public.anexos_prontuario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prontuario_id UUID NOT NULL REFERENCES public.prontuarios(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho_bytes INTEGER,
  url_arquivo TEXT NOT NULL,
  categoria TEXT DEFAULT 'documento',
  descricao TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para anexos
CREATE INDEX idx_anexos_prontuario ON public.anexos_prontuario(prontuario_id);
CREATE INDEX idx_anexos_paciente ON public.anexos_prontuario(paciente_id);

-- RLS para anexos
ALTER TABLE public.anexos_prontuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anexos_select" ON public.anexos_prontuario
  FOR SELECT USING (can_access_clinical(auth.uid()));

CREATE POLICY "anexos_insert" ON public.anexos_prontuario
  FOR INSERT WITH CHECK (can_access_clinical(auth.uid()));

CREATE POLICY "anexos_update" ON public.anexos_prontuario
  FOR UPDATE USING (can_access_clinical(auth.uid())) WITH CHECK (can_access_clinical(auth.uid()));

CREATE POLICY "anexos_delete" ON public.anexos_prontuario
  FOR DELETE USING (is_admin(auth.uid()) OR is_medico(auth.uid()));

-- =============================================
-- 3. TABELA DE ENCAMINHAMENTOS MÉDICOS
-- =============================================
CREATE TABLE public.encaminhamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  prontuario_id UUID REFERENCES public.prontuarios(id) ON DELETE SET NULL,
  medico_origem_id UUID NOT NULL REFERENCES public.medicos(id),
  medico_destino_id UUID REFERENCES public.medicos(id),
  especialidade_destino TEXT NOT NULL,
  tipo TEXT DEFAULT 'referencia',
  urgencia TEXT DEFAULT 'normal',
  motivo TEXT NOT NULL,
  hipotese_diagnostica TEXT,
  cid_principal TEXT,
  exames_realizados TEXT,
  tratamento_atual TEXT,
  informacoes_adicionais TEXT,
  status TEXT DEFAULT 'pendente',
  data_encaminhamento DATE DEFAULT CURRENT_DATE,
  data_atendimento DATE,
  contra_referencia TEXT,
  data_contra_referencia DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para encaminhamentos
CREATE INDEX idx_encaminhamentos_paciente ON public.encaminhamentos(paciente_id);
CREATE INDEX idx_encaminhamentos_origem ON public.encaminhamentos(medico_origem_id);
CREATE INDEX idx_encaminhamentos_destino ON public.encaminhamentos(medico_destino_id);
CREATE INDEX idx_encaminhamentos_status ON public.encaminhamentos(status);

-- RLS para encaminhamentos
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encaminhamentos_select" ON public.encaminhamentos
  FOR SELECT USING (can_access_clinical(auth.uid()) OR is_recepcao(auth.uid()));

CREATE POLICY "encaminhamentos_insert" ON public.encaminhamentos
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE POLICY "encaminhamentos_update" ON public.encaminhamentos
  FOR UPDATE USING (is_admin(auth.uid()) OR is_medico(auth.uid())) WITH CHECK (is_admin(auth.uid()) OR is_medico(auth.uid()));

CREATE POLICY "encaminhamentos_delete" ON public.encaminhamentos
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- 4. TABELA DE CÓDIGOS CID-10 (PARA BUSCA)
-- =============================================
CREATE TABLE public.cid10 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT,
  subcategoria TEXT,
  sexo_aplicavel TEXT DEFAULT 'ambos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para busca rápida de CID
CREATE INDEX idx_cid10_codigo ON public.cid10(codigo);
CREATE INDEX idx_cid10_descricao ON public.cid10 USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX idx_cid10_categoria ON public.cid10(categoria);

-- RLS para CID-10 (somente leitura para usuários autenticados)
ALTER TABLE public.cid10 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cid10_select" ON public.cid10
  FOR SELECT USING (has_any_role(auth.uid()));

-- Inserir CIDs mais comuns para começar
INSERT INTO public.cid10 (codigo, descricao, categoria) VALUES
  ('A00', 'Cólera', 'Doenças infecciosas'),
  ('A09', 'Diarreia e gastroenterite de origem infecciosa presumível', 'Doenças infecciosas'),
  ('B34.9', 'Infecção viral não especificada', 'Doenças infecciosas'),
  ('E11', 'Diabetes mellitus tipo 2', 'Doenças endócrinas'),
  ('E78.0', 'Hipercolesterolemia pura', 'Doenças endócrinas'),
  ('F32', 'Episódio depressivo', 'Transtornos mentais'),
  ('F41.0', 'Transtorno de pânico', 'Transtornos mentais'),
  ('F41.1', 'Transtorno de ansiedade generalizada', 'Transtornos mentais'),
  ('G43', 'Enxaqueca', 'Doenças do sistema nervoso'),
  ('I10', 'Hipertensão essencial (primária)', 'Doenças do aparelho circulatório'),
  ('I20.0', 'Angina instável', 'Doenças do aparelho circulatório'),
  ('I21', 'Infarto agudo do miocárdio', 'Doenças do aparelho circulatório'),
  ('I25', 'Doença isquêmica crônica do coração', 'Doenças do aparelho circulatório'),
  ('I50', 'Insuficiência cardíaca', 'Doenças do aparelho circulatório'),
  ('J00', 'Nasofaringite aguda (resfriado comum)', 'Doenças do aparelho respiratório'),
  ('J02.9', 'Faringite aguda não especificada', 'Doenças do aparelho respiratório'),
  ('J03.9', 'Amigdalite aguda não especificada', 'Doenças do aparelho respiratório'),
  ('J06.9', 'Infecção aguda das vias aéreas superiores não especificada', 'Doenças do aparelho respiratório'),
  ('J11', 'Influenza (gripe) devida a vírus não identificado', 'Doenças do aparelho respiratório'),
  ('J18.9', 'Pneumonia não especificada', 'Doenças do aparelho respiratório'),
  ('J30.4', 'Rinite alérgica não especificada', 'Doenças do aparelho respiratório'),
  ('J45', 'Asma', 'Doenças do aparelho respiratório'),
  ('K21.0', 'Doença de refluxo gastroesofágico com esofagite', 'Doenças do aparelho digestivo'),
  ('K29.7', 'Gastrite não especificada', 'Doenças do aparelho digestivo'),
  ('K30', 'Dispepsia funcional', 'Doenças do aparelho digestivo'),
  ('K59.0', 'Constipação', 'Doenças do aparelho digestivo'),
  ('L50.9', 'Urticária não especificada', 'Doenças da pele'),
  ('M25.5', 'Dor articular', 'Doenças do sistema osteomuscular'),
  ('M54.5', 'Dor lombar baixa', 'Doenças do sistema osteomuscular'),
  ('M79.1', 'Mialgia', 'Doenças do sistema osteomuscular'),
  ('N30.0', 'Cistite aguda', 'Doenças do aparelho geniturinário'),
  ('N39.0', 'Infecção do trato urinário de localização não especificada', 'Doenças do aparelho geniturinário'),
  ('R05', 'Tosse', 'Sintomas e sinais'),
  ('R10.4', 'Dor abdominal outra e a não especificada', 'Sintomas e sinais'),
  ('R11', 'Náusea e vômitos', 'Sintomas e sinais'),
  ('R50.9', 'Febre não especificada', 'Sintomas e sinais'),
  ('R51', 'Cefaleia', 'Sintomas e sinais'),
  ('R53', 'Mal-estar e fadiga', 'Sintomas e sinais'),
  ('Z00.0', 'Exame médico geral', 'Fatores que influenciam o estado de saúde'),
  ('Z01.7', 'Exame de laboratório', 'Fatores que influenciam o estado de saúde');

-- Triggers para updated_at
CREATE TRIGGER update_consentimentos_updated_at
  BEFORE UPDATE ON public.consentimentos_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anexos_updated_at
  BEFORE UPDATE ON public.anexos_prontuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encaminhamentos_updated_at
  BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();