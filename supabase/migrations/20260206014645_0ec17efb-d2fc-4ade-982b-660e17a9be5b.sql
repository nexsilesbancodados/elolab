-- Adicionar role de admin para devcriador1@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('ad27a18e-d836-4c23-8ba0-899772c6f70f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;