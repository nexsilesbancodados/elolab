
-- Create a SECURITY DEFINER function to validate invitation tokens
-- This bypasses the USING(false) RLS policy safely
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_func record;
BEGIN
  SELECT id, email, roles, funcionario_id, status, expires_at
  INTO v_invite
  FROM public.employee_invitations
  WHERE token = _token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_invite.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_used');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  -- Get funcionario data
  SELECT nome, cargo INTO v_func
  FROM public.funcionarios
  WHERE id = v_invite.funcionario_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_invite.id,
    'email', v_invite.email,
    'roles', v_invite.roles,
    'funcionario_id', v_invite.funcionario_id,
    'funcionario_nome', COALESCE(v_func.nome, ''),
    'funcionario_cargo', COALESCE(v_func.cargo, '')
  );
END;
$$;

-- Grant execute to anon so unauthenticated users can validate their invite
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(text) TO authenticated;
