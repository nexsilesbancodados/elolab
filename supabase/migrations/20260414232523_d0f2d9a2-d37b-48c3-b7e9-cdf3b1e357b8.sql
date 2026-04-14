
ALTER TABLE public.funcionarios
ADD COLUMN IF NOT EXISTS tipo_funcionario text DEFAULT 'outro',
ADD COLUMN IF NOT EXISTS registro_profissional text,
ADD COLUMN IF NOT EXISTS tipo_registro text,
ADD COLUMN IF NOT EXISTS uf_registro text DEFAULT 'SP',
ADD COLUMN IF NOT EXISTS especialidade text,
ADD COLUMN IF NOT EXISTS data_nascimento date,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS carga_horaria integer,
ADD COLUMN IF NOT EXISTS turno text DEFAULT 'integral';
