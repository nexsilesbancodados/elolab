-- Criar bucket para mídias do painel TV
INSERT INTO storage.buckets (id, name, public)
VALUES ('tv-panel-media', 'tv-panel-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de mídias do painel TV
CREATE POLICY "Permitir leitura pública de mídias do painel"
ON storage.objects FOR SELECT
USING (bucket_id = 'tv-panel-media');

CREATE POLICY "Admins podem fazer upload de mídias do painel"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tv-panel-media' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins podem deletar mídias do painel"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tv-panel-media' 
  AND public.is_admin(auth.uid())
);

-- Tabela para gerenciar mídias do painel TV
CREATE TABLE public.tv_panel_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('imagem', 'video')),
  nome VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  duracao_exibicao INTEGER DEFAULT 10, -- segundos para imagens
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tv_panel_media ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura pública das mídias ativas"
ON public.tv_panel_media FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem ver todas as mídias"
ON public.tv_panel_media FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem inserir mídias"
ON public.tv_panel_media FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar mídias"
ON public.tv_panel_media FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar mídias"
ON public.tv_panel_media FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_tv_panel_media_updated_at
BEFORE UPDATE ON public.tv_panel_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();