
CREATE TABLE public.tipos_exame_custom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text DEFAULT 'Personalizado',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nome)
);

ALTER TABLE public.tipos_exame_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.tipos_exame_custom FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.tipos_exame_custom FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.tipos_exame_custom FOR DELETE TO authenticated USING (user_id = auth.uid());
