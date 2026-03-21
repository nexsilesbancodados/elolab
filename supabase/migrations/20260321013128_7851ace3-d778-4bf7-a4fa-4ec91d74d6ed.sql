
-- Update accept_employee_invitation to propagate clinica_id
CREATE OR REPLACE FUNCTION public.accept_employee_invitation(_user_id uuid, _token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_func RECORD;
  v_clinica_id uuid;
BEGIN
  -- Validate invitation
  SELECT * INTO v_invite
  FROM public.employee_invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido, expirado ou já utilizado.');
  END IF;

  -- Get clinica_id from invitation or from funcionario
  v_clinica_id := v_invite.clinica_id;
  IF v_clinica_id IS NULL THEN
    SELECT f.clinica_id INTO v_clinica_id FROM public.funcionarios f WHERE f.id = v_invite.funcionario_id;
  END IF;

  -- 1. Update invitation status
  UPDATE public.employee_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  -- 2. Link funcionario to user
  UPDATE public.funcionarios
  SET user_id = _user_id
  WHERE id = v_invite.funcionario_id;

  -- Get funcionario data
  SELECT * INTO v_func
  FROM public.funcionarios
  WHERE id = v_invite.funcionario_id;

  -- 3. Set clinica_id on the new user's profile
  IF v_clinica_id IS NOT NULL THEN
    UPDATE public.profiles
    SET clinica_id = v_clinica_id
    WHERE id = _user_id;
  END IF;

  -- 4. Add user roles
  IF array_length(v_invite.roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _user_id, unnest(v_invite.roles)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- 5. Auto-create medico record if role includes 'medico'
  IF 'medico' = ANY(v_invite.roles) THEN
    INSERT INTO public.medicos (nome, email, crm, user_id, ativo, clinica_id)
    VALUES (
      COALESCE(v_func.nome, 'Médico'),
      COALESCE(v_func.email, ''),
      'PENDENTE',
      _user_id,
      true,
      v_clinica_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
