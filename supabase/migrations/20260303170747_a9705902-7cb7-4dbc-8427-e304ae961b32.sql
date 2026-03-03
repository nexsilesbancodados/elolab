
-- Tabela de tokens de acesso do paciente ao portal
CREATE TABLE public.paciente_portal_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  ativo boolean DEFAULT true,
  ultimo_acesso timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '90 days')
);

ALTER TABLE public.paciente_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Admins/recepção gerenciam tokens
CREATE POLICY "portal_tokens_select" ON public.paciente_portal_tokens
  FOR SELECT USING (can_manage_data(auth.uid()));

CREATE POLICY "portal_tokens_insert" ON public.paciente_portal_tokens
  FOR INSERT WITH CHECK (can_manage_data(auth.uid()));

CREATE POLICY "portal_tokens_delete" ON public.paciente_portal_tokens
  FOR DELETE USING (is_admin(auth.uid()));
