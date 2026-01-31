-- =============================================
-- CORREÇÃO: search_path para função update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 2: TABELAS PRINCIPAIS DO SISTEMA
-- =============================================

-- Tabela de Convênios
CREATE TABLE public.convenios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  tipo_planos TEXT[] DEFAULT '{}',
  valor_consulta DECIMAL(10,2) DEFAULT 0,
  valor_retorno DECIMAL(10,2) DEFAULT 0,
  carencia INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.convenios ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_convenios_updated_at
  BEFORE UPDATE ON public.convenios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Pacientes
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  sexo TEXT CHECK (sexo IN ('M', 'F', 'O')),
  -- Endereço
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  -- Convênio
  convenio_id UUID REFERENCES public.convenios(id),
  numero_carteira TEXT,
  validade_carteira DATE,
  -- Outros
  alergias TEXT[] DEFAULT '{}',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Médicos (info adicional vinculada ao perfil)
CREATE TABLE public.medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crm TEXT NOT NULL,
  especialidade TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_medicos_updated_at
  BEFORE UPDATE ON public.medicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Funcionários
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  departamento TEXT,
  telefone TEXT,
  email TEXT,
  data_admissao DATE,
  salario DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Salas
CREATE TABLE public.salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('consultorio', 'exame', 'procedimento', 'triagem', 'espera')),
  capacidade INTEGER DEFAULT 1,
  equipamentos TEXT[] DEFAULT '{}',
  status public.status_sala DEFAULT 'disponivel',
  medico_responsavel UUID REFERENCES public.medicos(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_salas_updated_at
  BEFORE UPDATE ON public.salas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Agendamentos
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME,
  tipo TEXT CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento', 'telemedicina')) DEFAULT 'consulta',
  status public.status_agendamento DEFAULT 'agendado',
  observacoes TEXT,
  sala_id UUID REFERENCES public.salas(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_agendamentos_updated_at
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Fila de Atendimento
CREATE TABLE public.fila_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL,
  horario_chegada TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('aguardando', 'chamado', 'em_atendimento', 'finalizado')) DEFAULT 'aguardando',
  sala_id UUID REFERENCES public.salas(id),
  prioridade TEXT CHECK (prioridade IN ('normal', 'preferencial', 'urgente')) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fila_atendimento ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_fila_atendimento_updated_at
  BEFORE UPDATE ON public.fila_atendimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Triagem
CREATE TABLE public.triagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  enfermeiro_id UUID NOT NULL REFERENCES auth.users(id),
  pressao_arterial TEXT,
  frequencia_cardiaca INTEGER,
  frequencia_respiratoria INTEGER,
  temperatura DECIMAL(4,1),
  saturacao INTEGER,
  peso DECIMAL(5,2),
  altura DECIMAL(4,2),
  imc DECIMAL(4,2),
  queixa_principal TEXT,
  classificacao_risco public.classificacao_risco DEFAULT 'verde',
  observacoes TEXT,
  data_hora TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.triagens ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_triagens_updated_at
  BEFORE UPDATE ON public.triagens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Prontuários
CREATE TABLE public.prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  agendamento_id UUID REFERENCES public.agendamentos(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  queixa_principal TEXT,
  historia_doenca_atual TEXT,
  exames_fisicos TEXT,
  hipotese_diagnostica TEXT,
  conduta TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_prontuarios_updated_at
  BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Prescrições
CREATE TABLE public.prescricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID REFERENCES public.prontuarios(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  tipo TEXT CHECK (tipo IN ('simples', 'controle_especial', 'antimicrobiano')) DEFAULT 'simples',
  medicamento TEXT NOT NULL,
  dosagem TEXT,
  posologia TEXT,
  quantidade TEXT,
  duracao TEXT,
  observacoes TEXT,
  data_emissao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prescricoes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_prescricoes_updated_at
  BEFORE UPDATE ON public.prescricoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Atestados
CREATE TABLE public.atestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  tipo TEXT CHECK (tipo IN ('comparecimento', 'afastamento', 'acompanhante', 'aptidao')) DEFAULT 'comparecimento',
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_inicio DATE,
  data_fim DATE,
  dias INTEGER,
  cid TEXT,
  motivo TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.atestados ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_atestados_updated_at
  BEFORE UPDATE ON public.atestados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de Exames
CREATE TABLE public.exames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id),
  medico_solicitante_id UUID NOT NULL REFERENCES public.medicos(id),
  tipo_exame TEXT NOT NULL,
  descricao TEXT,
  status public.status_exame DEFAULT 'solicitado',
  data_solicitacao DATE DEFAULT CURRENT_DATE,
  data_agendamento DATE,
  data_realizacao DATE,
  resultado TEXT,
  arquivo_resultado TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_exames_updated_at
  BEFORE UPDATE ON public.exames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();