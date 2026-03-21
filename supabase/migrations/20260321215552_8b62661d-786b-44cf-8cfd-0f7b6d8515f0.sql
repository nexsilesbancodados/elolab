CREATE OR REPLACE FUNCTION public.auto_billing_on_appointment_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_paciente_nome TEXT;
  v_medico_crm TEXT;
  v_convenio_valor NUMERIC;
  v_descricao TEXT;
BEGIN
  IF NEW.status = 'finalizado' AND (OLD.status IS NULL OR OLD.status != 'finalizado') THEN
    SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
    SELECT crm INTO v_medico_crm FROM public.medicos WHERE id = NEW.medico_id;
    SELECT c.valor_consulta INTO v_convenio_valor
    FROM public.pacientes p
    LEFT JOIN public.convenios c ON p.convenio_id = c.id
    WHERE p.id = NEW.paciente_id;
    
    v_descricao := 'Consulta - ' || COALESCE(v_paciente_nome, 'Paciente') || ' - ' || COALESCE(NEW.tipo, 'Consulta');
    
    INSERT INTO public.lancamentos (
      tipo, categoria, descricao, valor, data, data_vencimento, status, paciente_id, agendamento_id, forma_pagamento
    ) VALUES (
      'receita', 'consulta', v_descricao,
      COALESCE(v_convenio_valor, 150.00),
      CURRENT_DATE, CURRENT_DATE, 'pendente',
      NEW.paciente_id, NEW.id, NULL
    );
    
    INSERT INTO public.automation_logs (tipo, nome, status, registros_processados, registros_sucesso, detalhes)
    VALUES ('faturamento', 'Faturamento Automático', 'sucesso', 1, 1,
      jsonb_build_object('agendamento_id', NEW.id, 'paciente_id', NEW.paciente_id, 'valor', COALESCE(v_convenio_valor, 150.00))
    );
  END IF;
  RETURN NEW;
END;
$function$;