
-- Create a secure function to validate invite codes without exposing the table
CREATE OR REPLACE FUNCTION public.validate_invite_code(_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registro RECORD;
BEGIN
  SELECT id, status, expires_at, plano_slug
  INTO v_registro
  FROM public.registros_pendentes
  WHERE codigo_convite = _codigo
    AND status IN ('pendente', 'pago')
  LIMIT 1;

  IF v_registro IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código inválido ou já utilizado.');
  END IF;

  IF v_registro.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código expirado.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'plano_slug', v_registro.plano_slug,
    'status', v_registro.status
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;
