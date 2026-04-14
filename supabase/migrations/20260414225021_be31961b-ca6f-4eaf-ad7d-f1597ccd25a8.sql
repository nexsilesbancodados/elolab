UPDATE public.assinaturas_plano
SET status = 'ativa',
    em_trial = false,
    trial_fim = NULL,
    data_inicio = now(),
    data_fim = now() + interval '30 days',
    updated_at = now()
WHERE id = 'ae78bc7a-74aa-4650-9c4b-64c0a1f4311f';