
-- Create clinicas for existing admins and assign data
DO $$
DECLARE
  v_admin RECORD;
  v_clinica_id uuid;
BEGIN
  -- For each admin without a clinica, create one
  FOR v_admin IN
    SELECT ur.user_id, p.nome
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.clinica_id IS NULL
  LOOP
    -- Create clinica
    INSERT INTO public.clinicas (nome, owner_id)
    VALUES ('Clínica ' || v_admin.nome, v_admin.user_id)
    RETURNING id INTO v_clinica_id;

    -- Assign to profile
    UPDATE public.profiles SET clinica_id = v_clinica_id WHERE id = v_admin.user_id;

    -- Assign all data created by users with this admin's roles to this clinica
    -- (for now, assign all NULL clinica_id data to the first admin)
  END LOOP;

  -- Assign orphaned data to the first clinica created (primary admin)
  SELECT id INTO v_clinica_id FROM public.clinicas ORDER BY created_at LIMIT 1;

  IF v_clinica_id IS NOT NULL THEN
    -- Assign all non-admin profiles without clinica to first clinica
    UPDATE public.profiles SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    
    -- Update all data tables
    UPDATE public.medicos SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.funcionarios SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.pacientes SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.agendamentos SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.prontuarios SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.prescricoes SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.atestados SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.exames SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.encaminhamentos SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.triagens SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.retornos SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.lancamentos SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.estoque SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.convenios SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.salas SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.tarefas SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.bloqueios_agenda SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.coletas_laboratorio SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.lista_espera SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.employee_invitations SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.configuracoes_clinica SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
    UPDATE public.automation_settings SET clinica_id = v_clinica_id WHERE clinica_id IS NULL;
  END IF;
END;
$$;
