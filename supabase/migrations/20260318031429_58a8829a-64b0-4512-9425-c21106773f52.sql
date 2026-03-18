
-- SECURITY DEFINER function to activate public registration (trial or paid)
-- This bypasses RLS so newly signed-up users can activate their subscription
CREATE OR REPLACE FUNCTION public.activate_public_registration(_user_id uuid, _codigo_convite text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registro RECORD;
  v_plano RECORD;
  v_trial_end timestamp with time zone;
  v_subscription_id uuid;
BEGIN
  -- 1. Find the pending registration
  SELECT * INTO v_registro
  FROM public.registros_pendentes
  WHERE codigo_convite = _codigo_convite
    AND status IN ('pendente', 'pago')
    AND expires_at > now()
  LIMIT 1;

  IF v_registro IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de convite inválido, expirado ou já utilizado.');
  END IF;

  -- 2. Mark registration as activated
  UPDATE public.registros_pendentes
  SET status = 'ativado', user_id = _user_id, activated_at = now()
  WHERE id = v_registro.id;

  -- 3. Get plan details
  SELECT * INTO v_plano
  FROM public.planos
  WHERE slug = v_registro.plano_slug AND ativo = true;

  IF v_plano IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plano não encontrado.');
  END IF;

  -- 4. Check for existing subscription
  IF EXISTS (
    SELECT 1 FROM public.assinaturas_plano
    WHERE user_id = _user_id AND status IN ('ativa', 'trial')
  ) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Assinatura já existe.', 'plano_nome', v_plano.nome);
  END IF;

  -- 5. Create subscription based on registration status
  IF v_registro.status = 'pago' THEN
    -- Paid plan - full activation
    INSERT INTO public.assinaturas_plano (user_id, plano_id, plano_slug, status, em_trial, data_inicio)
    VALUES (_user_id, v_plano.id, v_plano.slug, 'ativa', false, now())
    RETURNING id INTO v_subscription_id;

    RETURN jsonb_build_object(
      'success', true,
      'mode', 'paid',
      'subscription_id', v_subscription_id,
      'plano_nome', v_plano.nome
    );
  ELSE
    -- Trial activation
    v_trial_end := now() + (COALESCE(v_plano.trial_dias, 3) || ' days')::interval;

    INSERT INTO public.assinaturas_plano (user_id, plano_id, plano_slug, status, em_trial, trial_fim, data_inicio, data_fim)
    VALUES (_user_id, v_plano.id, v_plano.slug, 'trial', true, v_trial_end, now(), v_trial_end)
    RETURNING id INTO v_subscription_id;

    RETURN jsonb_build_object(
      'success', true,
      'mode', 'trial',
      'subscription_id', v_subscription_id,
      'trial_end', v_trial_end,
      'plano_nome', v_plano.nome
    );
  END IF;
END;
$$;
