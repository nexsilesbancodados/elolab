
-- Clean up ALL remaining unscoped duplicate policies

-- triagens: remove old unscoped update
DROP POLICY IF EXISTS "triagens_update" ON public.triagens;
DROP POLICY IF EXISTS "Equipe clínica pode atualizar triagens" ON public.triagens;

-- lista_espera: remove old unscoped update  
DROP POLICY IF EXISTS "lista_espera_update" ON public.lista_espera;
DROP POLICY IF EXISTS "Recepção e admins podem atualizar lista de espera" ON public.lista_espera;

-- templates_prescricao: remove old unscoped policies
DROP POLICY IF EXISTS "templates_prescricao_select" ON public.templates_prescricao;
DROP POLICY IF EXISTS "templates_prescricao_insert" ON public.templates_prescricao;
DROP POLICY IF EXISTS "templates_prescricao_update" ON public.templates_prescricao;

-- templates_atestado: remove old unscoped policies
DROP POLICY IF EXISTS "templates_atestado_select" ON public.templates_atestado;
DROP POLICY IF EXISTS "templates_atestado_insert" ON public.templates_atestado;
DROP POLICY IF EXISTS "templates_atestado_update" ON public.templates_atestado;

-- protocolos_clinicos: remove old unscoped update
DROP POLICY IF EXISTS "protocolos_update" ON public.protocolos_clinicos;
DROP POLICY IF EXISTS "Admins e médicos podem editar protocolos" ON public.protocolos_clinicos;

-- precos: remove old unscoped select policies
DROP POLICY IF EXISTS "precos_consulta_select" ON public.precos_consulta_convenio;
DROP POLICY IF EXISTS "precos_select" ON public.precos_exames_convenio;

-- funcionarios_safe view: enable RLS is not possible on views, 
-- but grant access only to authenticated
REVOKE ALL ON public.funcionarios_safe FROM anon;
GRANT SELECT ON public.funcionarios_safe TO authenticated;
