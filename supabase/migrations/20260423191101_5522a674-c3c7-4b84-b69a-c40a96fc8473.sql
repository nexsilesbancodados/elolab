-- Create a function to fill clinica_id automatically on insert if it's missing
CREATE OR REPLACE FUNCTION public.fn_fill_clinica_id()
RETURNS TRIGGER AS $$
DECLARE
  my_clinica_id UUID;
BEGIN
  -- If clinica_id is already set, don't change it
  IF (NEW.clinica_id IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  -- Try to find the clinica_id of the current user from their profile
  SELECT clinica_id INTO my_clinica_id FROM public.profiles WHERE id = auth.uid();
  
  -- Set it if found
  IF (my_clinica_id IS NOT NULL) THEN
    NEW.clinica_id := my_clinica_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to ALL tables that have a clinica_id column, excluding views
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t_info ON c.table_name = t_info.table_name AND c.table_schema = t_info.table_schema
        WHERE c.column_name = 'clinica_id' 
        AND c.table_schema = 'public'
        AND t_info.table_type = 'BASE TABLE'
        AND c.table_name NOT IN ('profiles', 'clinicas', 'configuracoes_clinica')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_fill_clinica_id ON %I', t);
        EXECUTE format('CREATE TRIGGER tr_fill_clinica_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION public.fn_fill_clinica_id()', t);
    END LOOP;
END;
$$;

-- Attempt to recover orphaned records (those with NULL clinica_id)
UPDATE public.agendamentos a
SET clinica_id = m.clinica_id
FROM public.medicos m
WHERE a.medico_id = m.id AND a.clinica_id IS NULL AND m.clinica_id IS NOT NULL;

UPDATE public.pacientes p
SET clinica_id = (SELECT clinica_id FROM public.profiles WHERE clinica_id IS NOT NULL LIMIT 1)
WHERE clinica_id IS NULL;

UPDATE public.agendamentos a
SET clinica_id = (SELECT clinica_id FROM public.profiles WHERE clinica_id IS NOT NULL LIMIT 1)
WHERE clinica_id IS NULL;

UPDATE public.whatsapp_agents
SET clinica_id = (SELECT clinica_id FROM public.profiles WHERE clinica_id IS NOT NULL LIMIT 1)
WHERE clinica_id IS NULL;

-- Ensure is_same_clinica is robust
CREATE OR REPLACE FUNCTION public.is_same_clinica(record_clinica_id uuid)
RETURNS boolean AS $$
  SELECT CASE 
    WHEN record_clinica_id IS NULL THEN false
    ELSE record_clinica_id = (SELECT clinica_id FROM public.profiles WHERE id = auth.uid())
  END;
$$ LANGUAGE sql SECURITY DEFINER;
