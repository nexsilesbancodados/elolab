
-- Provision existing user who is stuck without roles
DO $$
DECLARE
  _user_id uuid := '3aaed601-24f5-43e8-b4d5-c0ca3bed89b2';
  _clinica_id uuid;
BEGIN
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create clinica
  INSERT INTO public.clinicas (nome, owner_id)
  VALUES ('Minha Clínica', _user_id)
  RETURNING id INTO _clinica_id;

  -- Link to profile
  UPDATE public.profiles
  SET clinica_id = _clinica_id
  WHERE id = _user_id;
END;
$$;
