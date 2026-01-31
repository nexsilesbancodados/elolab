-- =============================================
-- PARTE 4: POLÍTICAS RLS PARA TODAS AS TABELAS
-- =============================================

-- CONVENIOS (todos com role podem ver, admin pode gerenciar)
CREATE POLICY "convenios_select" ON public.convenios
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "convenios_insert" ON public.convenios
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "convenios_update" ON public.convenios
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "convenios_delete" ON public.convenios
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- PACIENTES (recepção/admin podem criar, clínicos podem ver/atualizar)
CREATE POLICY "pacientes_select" ON public.pacientes
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) AND NOT public.is_financeiro(auth.uid()));

CREATE POLICY "pacientes_insert" ON public.pacientes
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_data(auth.uid()));

CREATE POLICY "pacientes_update" ON public.pacientes
  FOR UPDATE TO authenticated
  USING (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()))
  WITH CHECK (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()));

CREATE POLICY "pacientes_delete" ON public.pacientes
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- MEDICOS (admin gerencia, outros podem ver)
CREATE POLICY "medicos_select" ON public.medicos
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "medicos_insert" ON public.medicos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "medicos_update" ON public.medicos
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "medicos_delete" ON public.medicos
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- FUNCIONARIOS (admin gerencia)
CREATE POLICY "funcionarios_select" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_recepcao(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "funcionarios_insert" ON public.funcionarios
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "funcionarios_update" ON public.funcionarios
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "funcionarios_delete" ON public.funcionarios
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- SALAS (equipe clínica e recepção)
CREATE POLICY "salas_select" ON public.salas
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) AND NOT public.is_financeiro(auth.uid()));

CREATE POLICY "salas_insert" ON public.salas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "salas_update" ON public.salas
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_recepcao(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_recepcao(auth.uid()));

CREATE POLICY "salas_delete" ON public.salas
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- AGENDAMENTOS (recepção, médicos, enfermagem)
CREATE POLICY "agendamentos_select" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) AND NOT public.is_financeiro(auth.uid()));

CREATE POLICY "agendamentos_insert" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_data(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "agendamentos_update" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()))
  WITH CHECK (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()));

CREATE POLICY "agendamentos_delete" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_recepcao(auth.uid()));

-- FILA_ATENDIMENTO (recepção, médicos, enfermagem)
CREATE POLICY "fila_atendimento_select" ON public.fila_atendimento
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) AND NOT public.is_financeiro(auth.uid()));

CREATE POLICY "fila_atendimento_insert" ON public.fila_atendimento
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_data(auth.uid()) OR public.is_enfermagem(auth.uid()));

CREATE POLICY "fila_atendimento_update" ON public.fila_atendimento
  FOR UPDATE TO authenticated
  USING (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()))
  WITH CHECK (public.can_manage_data(auth.uid()) OR public.can_access_clinical(auth.uid()));

CREATE POLICY "fila_atendimento_delete" ON public.fila_atendimento
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- TRIAGENS (enfermagem e médicos)
CREATE POLICY "triagens_select" ON public.triagens
  FOR SELECT TO authenticated
  USING (public.can_access_clinical(auth.uid()) OR public.is_recepcao(auth.uid()));

CREATE POLICY "triagens_insert" ON public.triagens
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_clinical(auth.uid()));

CREATE POLICY "triagens_update" ON public.triagens
  FOR UPDATE TO authenticated
  USING (public.can_access_clinical(auth.uid()))
  WITH CHECK (public.can_access_clinical(auth.uid()));

CREATE POLICY "triagens_delete" ON public.triagens
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- PRONTUARIOS (médicos e enfermagem - dados sensíveis)
CREATE POLICY "prontuarios_select" ON public.prontuarios
  FOR SELECT TO authenticated
  USING (public.can_access_clinical(auth.uid()));

CREATE POLICY "prontuarios_insert" ON public.prontuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_clinical(auth.uid()));

CREATE POLICY "prontuarios_update" ON public.prontuarios
  FOR UPDATE TO authenticated
  USING (public.can_access_clinical(auth.uid()))
  WITH CHECK (public.can_access_clinical(auth.uid()));

CREATE POLICY "prontuarios_delete" ON public.prontuarios
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- PRESCRICOES (médicos podem criar, enfermagem pode ver)
CREATE POLICY "prescricoes_select" ON public.prescricoes
  FOR SELECT TO authenticated
  USING (public.can_access_clinical(auth.uid()));

CREATE POLICY "prescricoes_insert" ON public.prescricoes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "prescricoes_update" ON public.prescricoes
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "prescricoes_delete" ON public.prescricoes
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

-- ATESTADOS (médicos podem criar)
CREATE POLICY "atestados_select" ON public.atestados
  FOR SELECT TO authenticated
  USING (public.can_access_clinical(auth.uid()) OR public.is_recepcao(auth.uid()));

CREATE POLICY "atestados_insert" ON public.atestados
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "atestados_update" ON public.atestados
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "atestados_delete" ON public.atestados
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- EXAMES (equipe clínica e recepção)
CREATE POLICY "exames_select" ON public.exames
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) AND NOT public.is_financeiro(auth.uid()));

CREATE POLICY "exames_insert" ON public.exames
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "exames_update" ON public.exames
  FOR UPDATE TO authenticated
  USING (public.can_access_clinical(auth.uid()) OR public.is_recepcao(auth.uid()))
  WITH CHECK (public.can_access_clinical(auth.uid()) OR public.is_recepcao(auth.uid()));

CREATE POLICY "exames_delete" ON public.exames
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- LISTA_ESPERA (recepção e admin)
CREATE POLICY "lista_espera_select" ON public.lista_espera
  FOR SELECT TO authenticated
  USING (public.can_manage_data(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "lista_espera_insert" ON public.lista_espera
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_data(auth.uid()));

CREATE POLICY "lista_espera_update" ON public.lista_espera
  FOR UPDATE TO authenticated
  USING (public.can_manage_data(auth.uid()))
  WITH CHECK (public.can_manage_data(auth.uid()));

CREATE POLICY "lista_espera_delete" ON public.lista_espera
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- LANCAMENTOS (financeiro e admin)
CREATE POLICY "lancamentos_select" ON public.lancamentos
  FOR SELECT TO authenticated
  USING (public.can_access_financial(auth.uid()));

CREATE POLICY "lancamentos_insert" ON public.lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_financial(auth.uid()) OR public.is_recepcao(auth.uid()));

CREATE POLICY "lancamentos_update" ON public.lancamentos
  FOR UPDATE TO authenticated
  USING (public.can_access_financial(auth.uid()))
  WITH CHECK (public.can_access_financial(auth.uid()));

CREATE POLICY "lancamentos_delete" ON public.lancamentos
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ESTOQUE (todos com role, exceto clínicos básicos)
CREATE POLICY "estoque_select" ON public.estoque
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "estoque_insert" ON public.estoque
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_enfermagem(auth.uid()));

CREATE POLICY "estoque_update" ON public.estoque
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_enfermagem(auth.uid()) OR public.is_financeiro(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_enfermagem(auth.uid()) OR public.is_financeiro(auth.uid()));

CREATE POLICY "estoque_delete" ON public.estoque
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- MOVIMENTACOES_ESTOQUE
CREATE POLICY "movimentacoes_estoque_select" ON public.movimentacoes_estoque
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "movimentacoes_estoque_insert" ON public.movimentacoes_estoque
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_enfermagem(auth.uid()) OR public.is_financeiro(auth.uid()));

-- TEMPLATES_PRESCRICAO (médicos e admin)
CREATE POLICY "templates_prescricao_select" ON public.templates_prescricao
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_prescricao_insert" ON public.templates_prescricao
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_prescricao_update" ON public.templates_prescricao
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_prescricao_delete" ON public.templates_prescricao
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- TEMPLATES_ATESTADO (médicos e admin)
CREATE POLICY "templates_atestado_select" ON public.templates_atestado
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_atestado_insert" ON public.templates_atestado
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_atestado_update" ON public.templates_atestado
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_medico(auth.uid()));

CREATE POLICY "templates_atestado_delete" ON public.templates_atestado
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- AUDIT_LOG (todos com role podem ver, sistema insere)
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid()));