
-- Tabela de configurações da clínica (migração de localStorage para Supabase)
CREATE TABLE public.configuracoes_clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chave text NOT NULL,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chave)
);

ALTER TABLE public.configuracoes_clinica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_select" ON public.configuracoes_clinica
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid()));

CREATE POLICY "config_insert" ON public.configuracoes_clinica
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "config_update" ON public.configuracoes_clinica
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "config_delete" ON public.configuracoes_clinica
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- Adicionar último acesso ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ultimo_acesso timestamptz;

-- Função para atualizar último acesso
CREATE OR REPLACE FUNCTION public.update_ultimo_acesso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET ultimo_acesso = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
