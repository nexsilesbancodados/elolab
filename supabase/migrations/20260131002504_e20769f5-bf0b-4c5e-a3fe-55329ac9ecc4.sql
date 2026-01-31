-- =============================================
-- PARTE 1: ENUMS, PERFIS, ROLES E FUNÇÕES DE SEGURANÇA
-- =============================================

-- Enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'medico', 'recepcao', 'enfermagem', 'financeiro');

-- Enum para status de agendamento
CREATE TYPE public.status_agendamento AS ENUM ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'finalizado', 'cancelado', 'faltou');

-- Enum para status de pagamento
CREATE TYPE public.status_pagamento AS ENUM ('pendente', 'pago', 'cancelado', 'estornado', 'atrasado');

-- Enum para status de exame
CREATE TYPE public.status_exame AS ENUM ('solicitado', 'agendado', 'realizado', 'laudo_disponivel', 'cancelado');

-- Enum para status de sala
CREATE TYPE public.status_sala AS ENUM ('disponivel', 'ocupado', 'manutencao', 'limpeza');

-- Enum para classificação de risco
CREATE TYPE public.classificacao_risco AS ENUM ('verde', 'amarelo', 'laranja', 'vermelho');

-- =============================================
-- TABELA DE PERFIS (vinculada ao auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABELA DE ROLES (separada para segurança)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- =============================================

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Função para verificar se é médico
CREATE OR REPLACE FUNCTION public.is_medico(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'medico')
$$;

-- Função para verificar se é recepção
CREATE OR REPLACE FUNCTION public.is_recepcao(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'recepcao')
$$;

-- Função para verificar se é enfermagem
CREATE OR REPLACE FUNCTION public.is_enfermagem(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'enfermagem')
$$;

-- Função para verificar se é financeiro
CREATE OR REPLACE FUNCTION public.is_financeiro(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'financeiro')
$$;

-- Função para verificar se usuário pode acessar área clínica
CREATE OR REPLACE FUNCTION public.can_access_clinical(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) 
      OR public.is_medico(_user_id) 
      OR public.is_enfermagem(_user_id)
$$;

-- Função para verificar se pode gerenciar dados
CREATE OR REPLACE FUNCTION public.can_manage_data(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) 
      OR public.is_recepcao(_user_id)
$$;

-- Função para verificar se pode acessar financeiro
CREATE OR REPLACE FUNCTION public.can_access_financial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) 
      OR public.is_financeiro(_user_id)
$$;

-- Função para verificar se tem qualquer role (autenticado com permissões)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- =============================================
-- RLS POLICIES PARA PROFILES
-- =============================================
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- =============================================
-- RLS POLICIES PARA USER_ROLES
-- =============================================
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND user_id <> auth.uid());

CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) AND user_id <> auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) AND user_id <> auth.uid());

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) AND user_id <> auth.uid());

-- =============================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();