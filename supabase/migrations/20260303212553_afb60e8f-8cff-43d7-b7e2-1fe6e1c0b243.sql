
-- Table for pending registrations from the public site
CREATE TABLE public.registros_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  clinica text,
  plano_id uuid REFERENCES public.planos(id),
  plano_slug text NOT NULL,
  codigo_convite text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pendente',
  mp_payment_id text,
  expires_at timestamp with time zone NOT NULL,
  activated_at timestamp with time zone,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.registros_pendentes ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (edge functions use service key)
-- Admins can view
CREATE POLICY "admins_select_registros" ON public.registros_pendentes
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Public can't access directly, only via edge functions with service key
