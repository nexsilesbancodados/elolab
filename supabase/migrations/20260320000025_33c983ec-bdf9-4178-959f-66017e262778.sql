
-- Create a medico record for MARIA APARECIDA and link to her user account
INSERT INTO public.medicos (nome, email, crm, crm_uf, especialidade, user_id, ativo)
VALUES (
  'MARIA APARECIDA',
  'cidadiasbuffett@gmail.com',
  'PENDENTE',
  'SP',
  'Clínica Geral',
  'bdcdca71-3840-484f-8ea1-1e25f7b5e7f1',
  true
);
