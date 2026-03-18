
-- 1. Allow anonymous users to SELECT employee_invitations by token (for validation)
CREATE POLICY "anon_select_invitation_by_token"
ON public.employee_invitations
FOR SELECT
TO anon
USING (true);

-- 2. Allow anonymous users to SELECT funcionarios (for getting name during invite)
CREATE POLICY "anon_select_funcionarios_for_invite"
ON public.funcionarios
FOR SELECT
TO anon
USING (true);

-- 3. Create a SECURITY DEFINER function to handle all post-signup invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_employee_invitation(
  _token text,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite RECORD;
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

  -- 1. Update invitation status
  UPDATE public.employee_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  -- 2. Link funcionario to user
  UPDATE public.funcionarios
  SET user_id = _user_id
  WHERE id = v_invite.funcionario_id;

  -- 3. Add user roles
  IF array_length(v_invite.roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT _user_id, unnest(v_invite.roles)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
