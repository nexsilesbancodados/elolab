UPDATE public.coletas_laboratorio c
SET clinica_id = p.clinica_id
FROM public.pacientes p
WHERE c.paciente_id = p.id
  AND c.clinica_id IS NULL
  AND p.clinica_id IS NOT NULL;