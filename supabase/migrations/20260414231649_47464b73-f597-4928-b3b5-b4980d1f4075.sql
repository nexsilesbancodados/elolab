
ALTER TABLE public.coletas_laboratorio
ADD COLUMN IF NOT EXISTS numero_guia text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS trouxe_material boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cid text,
ADD COLUMN IF NOT EXISTS procedimento_codigo text,
ADD COLUMN IF NOT EXISTS convenio_id uuid REFERENCES public.convenios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS grupo text;
