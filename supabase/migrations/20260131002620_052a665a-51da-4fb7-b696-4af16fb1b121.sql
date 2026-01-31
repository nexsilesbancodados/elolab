-- =============================================
-- PARTE 3: TABELAS FINANCEIRAS, ESTOQUE, TEMPLATES E AUDIT LOG
-- =============================================

-- Tabela de Lista de Espera
CREATE TABLE public.lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id UUID REFERENCES public.medicos(id),
  especialidade TEXT,
  prioridade TEXT CHECK (prioridade IN ('normal', 'preferencial', 'urgente')) DEFAULT 'normal',
  motivo TEXT,
  preferencia_horario TEXT,
  data_cadastro DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('aguardando', 'notificado', 'confirmado', 'agendado', 'desistiu')) DEFAULT 'aguardando',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_lista_espera_updated_at
  BEFORE UPDATE ON public.lista_espera
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Lançamentos Financeiros
CREATE TABLE public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('receita', 'despesa')) NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  status public.status_pagamento DEFAULT 'pendente',
  paciente_id UUID REFERENCES public.pacientes(id),
  agendamento_id UUID REFERENCES public.agendamentos(id),
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'convenio', 'boleto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Estoque
CREATE TABLE public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 0,
  unidade TEXT,
  valor_unitario DECIMAL(10,2) DEFAULT 0,
  fornecedor TEXT,
  lote TEXT,
  validade DATE,
  localizacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_estoque_updated_at
  BEFORE UPDATE ON public.estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Movimentações de Estoque
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('entrada', 'saida', 'ajuste')) NOT NULL,
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  data TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Tabela de Templates de Prescrição
CREATE TABLE public.templates_prescricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('simples', 'controle_especial', 'antimicrobiano')) DEFAULT 'simples',
  medicamentos JSONB DEFAULT '[]',
  observacoes_gerais TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.templates_prescricao ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_templates_prescricao_updated_at
  BEFORE UPDATE ON public.templates_prescricao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Templates de Atestado
CREATE TABLE public.templates_atestado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('comparecimento', 'afastamento', 'aptidao', 'acompanhante')) DEFAULT 'comparecimento',
  conteudo TEXT,
  dias_afastamento INTEGER,
  cid TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.templates_atestado ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_templates_atestado_updated_at
  BEFORE UPDATE ON public.templates_atestado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Audit Log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_name TEXT,
  changes JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;