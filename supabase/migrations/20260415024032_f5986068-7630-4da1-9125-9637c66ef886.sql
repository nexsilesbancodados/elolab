DELETE FROM public.lancamentos WHERE id IN (
  SELECT l1.id FROM public.lancamentos l1
  JOIN public.lancamentos l2 ON l1.agendamento_id = l2.agendamento_id AND l1.id != l2.id
  WHERE l1.valor = 0 AND l2.valor > 0 AND l1.agendamento_id IS NOT NULL
);