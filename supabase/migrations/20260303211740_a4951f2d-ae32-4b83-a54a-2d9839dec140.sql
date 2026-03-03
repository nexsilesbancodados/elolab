
-- Recreate get_user_plan with trial support
CREATE FUNCTION public.get_user_plan(_user_id uuid)
 RETURNS TABLE(plano_slug text, plano_nome text, status text, em_trial boolean, trial_fim timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.slug, p.nome, ap.status, ap.em_trial, ap.trial_fim
  FROM public.assinaturas_plano ap
  JOIN public.planos p ON p.id = ap.plano_id
  WHERE ap.user_id = _user_id
    AND ap.status IN ('ativa', 'trial')
  ORDER BY CASE WHEN ap.status = 'ativa' THEN 0 ELSE 1 END
  LIMIT 1
$function$;

-- Function to start a free trial
CREATE OR REPLACE FUNCTION public.start_free_trial(_user_id uuid, _plano_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plano RECORD;
  v_existing RECORD;
  v_trial_end timestamp with time zone;
  v_subscription_id uuid;
BEGIN
  SELECT * INTO v_existing 
  FROM public.assinaturas_plano 
  WHERE user_id = _user_id 
  AND (status IN ('ativa', 'trial') OR em_trial = true)
  LIMIT 1;
  
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já possui uma assinatura ativa ou já utilizou o período de teste.');
  END IF;
  
  SELECT * INTO v_plano FROM public.planos WHERE slug = _plano_slug AND ativo = true;
  IF v_plano IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plano não encontrado.');
  END IF;
  
  v_trial_end := now() + (COALESCE(v_plano.trial_dias, 3) || ' days')::interval;
  
  INSERT INTO public.assinaturas_plano (user_id, plano_id, plano_slug, status, em_trial, trial_fim, data_inicio, data_fim)
  VALUES (_user_id, v_plano.id, v_plano.slug, 'trial', true, v_trial_end, now(), v_trial_end)
  RETURNING id INTO v_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'subscription_id', v_subscription_id,
    'trial_end', v_trial_end,
    'plano_nome', v_plano.nome
  );
END;
$function$;

-- Function to expire trials
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.assinaturas_plano
  SET status = 'expirada', em_trial = false, updated_at = now()
  WHERE status = 'trial' 
    AND em_trial = true 
    AND trial_fim < now();
END;
$function$;
