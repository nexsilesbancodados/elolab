
-- 1) Create clinicas table (no RLS policies referencing clinica_id yet)
CREATE TABLE public.clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Minha Clínica',
  cnpj text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- 2) Add clinica_id to profiles FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE SET NULL;

-- 3) Now create RLS for clinicas (profiles.clinica_id exists now)
CREATE POLICY "clinicas_select" ON public.clinicas FOR SELECT TO authenticated
  USING (id = (SELECT p.clinica_id FROM public.profiles p WHERE p.id = auth.uid()));
CREATE POLICY "clinicas_update" ON public.clinicas FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "clinicas_insert" ON public.clinicas FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 4) Add clinica_id to all data tables
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.prontuarios ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.prescricoes ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.atestados ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.encaminhamentos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.triagens ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.retornos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.convenios ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.salas ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.fila_atendimento ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.bloqueios_agenda ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.coletas_laboratorio ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.consentimentos_lgpd ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.anexos_prontuario ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.configuracoes_clinica ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.employee_invitations ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.pagamentos_mercadopago ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.assinaturas_mercadopago ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.paciente_portal_tokens ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.precos_consulta_convenio ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.precos_exames_convenio ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.resultados_laboratorio ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.protocolos_clinicos ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.templates_atestado ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.templates_prescricao ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.tipos_consulta ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.tipos_exame_custom ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.tv_panel_media ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_agents ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_agent_actions ADD COLUMN IF NOT EXISTS clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE;

-- 5) Create security definer function
CREATE OR REPLACE FUNCTION public.get_my_clinica_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_clinica ON public.profiles(clinica_id);
CREATE INDEX IF NOT EXISTS idx_medicos_clinica ON public.medicos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica ON public.funcionarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON public.pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica ON public.agendamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica ON public.prontuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_clinica ON public.lancamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_estoque_clinica ON public.estoque(clinica_id);
CREATE INDEX IF NOT EXISTS idx_exames_clinica ON public.exames(clinica_id);
