
-- Update handle_new_user to auto-create clinic and assign admin role for direct signups (buyers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinica_id uuid;
  _is_invite boolean;
  _nome text;
BEGIN
  _nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  _is_invite := (NEW.raw_user_meta_data->>'invite_token') IS NOT NULL;

  IF _is_invite THEN
    -- Invited user: just create profile, no clinic or admin role
    INSERT INTO public.profiles (id, nome, email, telefone, cpf_cnpj)
    VALUES (
      NEW.id,
      _nome,
      NEW.email,
      NEW.raw_user_meta_data->>'telefone',
      NEW.raw_user_meta_data->>'cpf_cnpj'
    );
  ELSE
    -- Direct signup (buyer): create clinic, profile with clinic, and admin role
    INSERT INTO public.clinicas (id, nome, owner_id)
    VALUES (gen_random_uuid(), 'Clínica de ' || _nome, NEW.id)
    RETURNING id INTO _clinica_id;

    INSERT INTO public.profiles (id, nome, email, telefone, cpf_cnpj, clinica_id)
    VALUES (
      NEW.id,
      _nome,
      NEW.email,
      NEW.raw_user_meta_data->>'telefone',
      NEW.raw_user_meta_data->>'cpf_cnpj',
      _clinica_id
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$;
