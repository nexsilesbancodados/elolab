ALTER TABLE public.agendamentos DROP CONSTRAINT agendamentos_tipo_check;

ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_tipo_check CHECK (tipo = ANY (ARRAY[
  'consulta'::text, 'retorno'::text, 'exame'::text, 'procedimento'::text, 'telemedicina'::text,
  'checkup'::text, 'avaliacao'::text, 'cirurgia'::text, 'triagem'::text,
  'coleta'::text, 'enfermagem'::text, 'vacina'::text, 'curativo'::text
]));