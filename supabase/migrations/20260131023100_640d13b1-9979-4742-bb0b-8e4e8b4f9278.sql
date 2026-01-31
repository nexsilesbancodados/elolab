-- =============================================
-- TRIGGER: Notificação quando resultado de exame fica disponível
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_exam_result_available()
RETURNS TRIGGER AS $$
DECLARE
  v_paciente_nome TEXT;
  v_paciente_email TEXT;
  v_template RECORD;
BEGIN
  -- Só executa se o status mudou para 'laudo_disponivel'
  IF NEW.status = 'laudo_disponivel' AND (OLD.status IS NULL OR OLD.status != 'laudo_disponivel') THEN
    
    -- Buscar dados do paciente
    SELECT nome, email INTO v_paciente_nome, v_paciente_email
    FROM public.pacientes 
    WHERE id = NEW.paciente_id;
    
    -- Se paciente tem e-mail, adicionar à fila de notificações
    IF v_paciente_email IS NOT NULL THEN
      -- Buscar template
      SELECT * INTO v_template
      FROM public.notification_templates
      WHERE categoria = 'resultado_exame' AND tipo = 'email' AND ativo = true
      LIMIT 1;
      
      IF v_template.id IS NOT NULL THEN
        INSERT INTO public.notification_queue (
          template_id,
          tipo,
          destinatario_id,
          destinatario_email,
          destinatario_nome,
          assunto,
          conteudo,
          dados_extras,
          status
        ) VALUES (
          v_template.id,
          'email',
          NEW.paciente_id,
          v_paciente_email,
          v_paciente_nome,
          REPLACE(REPLACE(v_template.assunto, '{{paciente_nome}}', v_paciente_nome), '{{clinica_nome}}', 'EloLab Clínica'),
          REPLACE(REPLACE(REPLACE(v_template.conteudo, '{{paciente_nome}}', v_paciente_nome), '{{tipo_exame}}', NEW.tipo_exame), '{{clinica_nome}}', 'EloLab Clínica'),
          jsonb_build_object('exame_id', NEW.id, 'tipo_exame', NEW.tipo_exame),
          'pendente'
        );
        
        -- Log
        INSERT INTO public.automation_logs (tipo, nome, status, registros_processados, registros_sucesso, detalhes)
        VALUES (
          'exame',
          'Notificação Resultado Exame',
          'sucesso',
          1,
          1,
          jsonb_build_object('exame_id', NEW.id, 'paciente_id', NEW.paciente_id, 'tipo_exame', NEW.tipo_exame)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_exam_result
AFTER UPDATE ON public.exames
FOR EACH ROW
EXECUTE FUNCTION public.notify_exam_result_available();