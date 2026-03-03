
-- Tabela de planos disponíveis
CREATE TABLE public.planos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  valor numeric NOT NULL,
  frequencia text NOT NULL DEFAULT 'mensal',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  destaque boolean DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de assinaturas dos usuários/clínicas
CREATE TABLE public.assinaturas_plano (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plano_id uuid REFERENCES public.planos(id) ON DELETE SET NULL,
  plano_slug text NOT NULL,
  status text NOT NULL DEFAULT 'ativa', -- ativa, cancelada, expirada, pendente
  mp_assinatura_id uuid REFERENCES public.assinaturas_mercadopago(id) ON DELETE SET NULL,
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  data_cancelamento timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_plano ENABLE ROW LEVEL SECURITY;

-- Planos: leitura pública para autenticados, gestão apenas admin
CREATE POLICY "planos_select" ON public.planos
  FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "planos_admin" ON public.planos
  FOR ALL USING (is_admin(auth.uid()));

-- Assinaturas: usuário vê a própria, admin vê todas
CREATE POLICY "assinaturas_plano_select_own" ON public.planos
  FOR SELECT USING (has_any_role(auth.uid()));

-- Drop duplicate policy name
DROP POLICY IF EXISTS "assinaturas_plano_select_own" ON public.planos;

CREATE POLICY "assinatura_select" ON public.assinaturas_plano
  FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "assinatura_insert" ON public.assinaturas_plano
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "assinatura_update" ON public.assinaturas_plano
  FOR UPDATE USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "assinatura_delete" ON public.assinaturas_plano
  FOR DELETE USING (is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assinaturas_plano_updated_at
  BEFORE UPDATE ON public.assinaturas_plano
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os dois planos
INSERT INTO public.planos (nome, slug, descricao, valor, frequencia, features, destaque, ordem)
VALUES
  (
    'EloLab Max',
    'elolab-max',
    'Acesso total a todo o app e todas as funcionalidades',
    299.00,
    'mensal',
    '["dashboard", "agenda", "pacientes", "prontuarios", "prescricoes", "atestados", "exames", "triagem", "fila", "salas", "estoque", "financeiro", "relatorios", "convenios", "funcionarios", "automacoes", "analytics", "templates", "encaminhamentos", "lista_espera", "painel_tv", "pagamentos"]'::jsonb,
    false,
    1
  ),
  (
    'EloLab Ultra',
    'elolab-ultra',
    'Tudo do Max + Chatbot Atendente com IA via WhatsApp',
    399.00,
    'mensal',
    '["dashboard", "agenda", "pacientes", "prontuarios", "prescricoes", "atestados", "exames", "triagem", "fila", "salas", "estoque", "financeiro", "relatorios", "convenios", "funcionarios", "automacoes", "analytics", "templates", "encaminhamentos", "lista_espera", "painel_tv", "pagamentos", "agente_ia", "chatbot_whatsapp"]'::jsonb,
    true,
    2
  );

-- Função para verificar se usuário tem feature no plano
CREATE OR REPLACE FUNCTION public.user_has_feature(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assinaturas_plano ap
    JOIN public.planos p ON p.id = ap.plano_id
    WHERE ap.user_id = _user_id
      AND ap.status = 'ativa'
      AND p.features ? _feature
  )
$$;

-- Função para pegar o plano ativo do usuário
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS TABLE(plano_slug text, plano_nome text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.slug, p.nome, ap.status
  FROM public.assinaturas_plano ap
  JOIN public.planos p ON p.id = ap.plano_id
  WHERE ap.user_id = _user_id
    AND ap.status = 'ativa'
  LIMIT 1
$$;
