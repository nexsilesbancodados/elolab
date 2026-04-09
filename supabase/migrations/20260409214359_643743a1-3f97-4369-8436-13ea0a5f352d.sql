
-- Function to auto-provision user on subscription creation
CREATE OR REPLACE FUNCTION public.auto_provision_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_roles boolean;
  _clinica_id uuid;
  _profile_clinica uuid;
BEGIN
  -- Check if user already has roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id
  ) INTO _has_roles;

  -- If no roles, assign admin
  IF NOT _has_roles THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Check if user has a clinica
  SELECT clinica_id INTO _profile_clinica
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If no clinica, create one
  IF _profile_clinica IS NULL THEN
    INSERT INTO public.clinicas (nome, owner_id)
    VALUES ('Minha Clínica', NEW.user_id)
    RETURNING id INTO _clinica_id;

    UPDATE public.profiles
    SET clinica_id = _clinica_id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on assinaturas_plano insert
DROP TRIGGER IF EXISTS trg_auto_provision_subscriber ON public.assinaturas_plano;
CREATE TRIGGER trg_auto_provision_subscriber
  AFTER INSERT ON public.assinaturas_plano
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_subscriber();
