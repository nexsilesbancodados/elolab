-- =============================================
-- TABELAS DE AUTOMAÇÃO PARA O ELOLAB
-- =============================================

-- 1. Templates de Notificação
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'sms', 'whatsapp', 'push')),
  categoria TEXT NOT NULL CHECK (categoria IN ('lembrete_consulta', 'confirmacao', 'resultado_exame', 'aniversario', 'financeiro', 'estoque', 'geral')),
  assunto TEXT,
  conteudo TEXT NOT NULL,
  variaveis TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Fila de Notificações
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.notification_templates(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'sms', 'whatsapp', 'push')),
  destinatario_id UUID,
  destinatario_email TEXT,
  destinatario_telefone TEXT,
  destinatario_nome TEXT,
  assunto TEXT,
  conteudo TEXT NOT NULL,
  dados_extras JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviando', 'enviado', 'erro', 'cancelado')),
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  erro_mensagem TEXT,
  agendado_para TIMESTAMP WITH TIME ZONE DEFAULT now(),
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Log de Automações
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('iniciado', 'sucesso', 'erro', 'parcial')),
  registros_processados INTEGER DEFAULT 0,
  registros_sucesso INTEGER DEFAULT 0,
  registros_erro INTEGER DEFAULT 0,
  detalhes JSONB DEFAULT '{}',
  erro_mensagem TEXT,
  duracao_ms INTEGER,
  executado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Configurações de Automação
CREATE TABLE public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.automation_settings (chave, valor, descricao) VALUES
('lembrete_consulta_24h', '{"ativo": true, "horas_antes": 24}', 'Lembrete de consulta 24h antes'),
('lembrete_consulta_2h', '{"ativo": true, "horas_antes": 2}', 'Lembrete de consulta 2h antes'),
('alerta_estoque_critico', '{"ativo": true, "email_destino": null}', 'Alertas de estoque crítico'),
('faturamento_automatico', '{"ativo": true}', 'Faturamento automático ao finalizar consulta'),
('aniversariantes', '{"ativo": true, "hora_envio": "09:00"}', 'Mensagens de aniversário');

-- Inserir templates padrão
INSERT INTO public.notification_templates (nome, tipo, categoria, assunto, conteudo, variaveis) VALUES
('Lembrete 24h - Email', 'email', 'lembrete_consulta', 
 'Lembrete: Sua consulta amanhã - {{clinica_nome}}',
 'Olá {{paciente_nome}},

Lembramos que você tem uma consulta agendada para amanhã:

📅 Data: {{data}}
⏰ Horário: {{horario}}
👨‍⚕️ Médico(a): {{medico_nome}}
📍 Local: {{clinica_endereco}}

Por favor, chegue com 15 minutos de antecedência.

Caso precise reagendar, entre em contato conosco.

Atenciosamente,
{{clinica_nome}}',
 ARRAY['paciente_nome', 'data', 'horario', 'medico_nome', 'clinica_nome', 'clinica_endereco']),

('Lembrete 2h - Email', 'email', 'lembrete_consulta',
 'Sua consulta é HOJE às {{horario}} - {{clinica_nome}}',
 'Olá {{paciente_nome}},

Sua consulta é HOJE!

⏰ Horário: {{horario}}
👨‍⚕️ Médico(a): {{medico_nome}}

Não se esqueça de trazer seus documentos.

Até logo!
{{clinica_nome}}',
 ARRAY['paciente_nome', 'horario', 'medico_nome', 'clinica_nome']),

('Alerta Estoque Crítico', 'email', 'estoque',
 '⚠️ Alerta: Estoque Crítico - {{item_nome}}',
 'Atenção!

O item "{{item_nome}}" está com estoque crítico:

📦 Quantidade atual: {{quantidade_atual}}
📉 Quantidade mínima: {{quantidade_minima}}
📍 Localização: {{localizacao}}

Providencie a reposição o mais rápido possível.

Sistema EloLab',
 ARRAY['item_nome', 'quantidade_atual', 'quantidade_minima', 'localizacao']),

('Resultado de Exame Disponível', 'email', 'resultado_exame',
 'Seu resultado de exame está disponível - {{clinica_nome}}',
 'Olá {{paciente_nome}},

Informamos que o resultado do seu exame "{{tipo_exame}}" já está disponível.

Você pode retirá-lo em nossa unidade ou solicitar o envio por e-mail.

Atenciosamente,
{{clinica_nome}}',
 ARRAY['paciente_nome', 'tipo_exame', 'clinica_nome']),

('Aniversário', 'email', 'aniversario',
 '🎂 Feliz Aniversário, {{paciente_nome}}!',
 'Olá {{paciente_nome}},

A equipe {{clinica_nome}} deseja a você um Feliz Aniversário! 🎉

Que este novo ciclo seja repleto de saúde, paz e realizações.

Um grande abraço,
{{clinica_nome}}',
 ARRAY['paciente_nome', 'clinica_nome']);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admins podem gerenciar
CREATE POLICY "Admins podem gerenciar templates"
ON public.notification_templates
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem gerenciar fila"
ON public.notification_queue
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem ver logs"
ON public.automation_logs
FOR SELECT
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins podem inserir logs"
ON public.automation_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar configurações"
ON public.automation_settings
FOR ALL
USING (public.is_admin(auth.uid()));

-- Índices para performance
CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX idx_notification_queue_agendado ON public.notification_queue(agendado_para);
CREATE INDEX idx_automation_logs_tipo ON public.automation_logs(tipo);
CREATE INDEX idx_automation_logs_created ON public.automation_logs(created_at DESC);

-- Triggers para updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_settings_updated_at
BEFORE UPDATE ON public.automation_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: Faturamento automático ao finalizar consulta
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_billing_on_appointment_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_paciente_nome TEXT;
  v_medico_crm TEXT;
  v_convenio_valor NUMERIC;
  v_descricao TEXT;
BEGIN
  -- Só executa se o status mudou para 'finalizado'
  IF NEW.status = 'finalizado' AND (OLD.status IS NULL OR OLD.status != 'finalizado') THEN
    
    -- Buscar nome do paciente
    SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
    
    -- Buscar CRM do médico
    SELECT crm INTO v_medico_crm FROM public.medicos WHERE id = NEW.medico_id;
    
    -- Buscar valor do convênio do paciente (se houver)
    SELECT c.valor_consulta INTO v_convenio_valor
    FROM public.pacientes p
    LEFT JOIN public.convenios c ON p.convenio_id = c.id
    WHERE p.id = NEW.paciente_id;
    
    -- Montar descrição
    v_descricao := 'Consulta - ' || COALESCE(v_paciente_nome, 'Paciente') || ' - ' || COALESCE(NEW.tipo, 'Consulta');
    
    -- Criar lançamento de receita
    INSERT INTO public.lancamentos (
      tipo,
      categoria,
      descricao,
      valor,
      data,
      data_vencimento,
      status,
      paciente_id,
      agendamento_id,
      forma_pagamento
    ) VALUES (
      'receita',
      'consulta',
      v_descricao,
      COALESCE(v_convenio_valor, 150.00), -- Valor padrão se não houver convênio
      CURRENT_DATE,
      CURRENT_DATE,
      'pendente',
      NEW.paciente_id,
      NEW.id,
      'pendente'
    );
    
    -- Log da automação
    INSERT INTO public.automation_logs (tipo, nome, status, registros_processados, registros_sucesso, detalhes)
    VALUES (
      'faturamento',
      'Faturamento Automático',
      'sucesso',
      1,
      1,
      jsonb_build_object(
        'agendamento_id', NEW.id,
        'paciente_id', NEW.paciente_id,
        'valor', COALESCE(v_convenio_valor, 150.00)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
CREATE TRIGGER trigger_auto_billing
AFTER UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_billing_on_appointment_complete();

-- =============================================
-- TRIGGER: Alerta de estoque crítico
-- =============================================
CREATE OR REPLACE FUNCTION public.check_critical_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Se quantidade ficou abaixo do mínimo
  IF NEW.quantidade <= COALESCE(NEW.quantidade_minima, 0) AND 
     (OLD.quantidade IS NULL OR OLD.quantidade > COALESCE(OLD.quantidade_minima, 0)) THEN
    
    -- Adicionar à fila de notificações
    INSERT INTO public.notification_queue (
      tipo,
      assunto,
      conteudo,
      dados_extras,
      status
    ) VALUES (
      'email',
      '⚠️ Alerta: Estoque Crítico - ' || NEW.nome,
      'O item "' || NEW.nome || '" está com estoque crítico. Quantidade atual: ' || NEW.quantidade || '. Mínimo: ' || COALESCE(NEW.quantidade_minima, 0),
      jsonb_build_object(
        'item_id', NEW.id,
        'item_nome', NEW.nome,
        'quantidade_atual', NEW.quantidade,
        'quantidade_minima', NEW.quantidade_minima,
        'categoria', NEW.categoria,
        'localizacao', NEW.localizacao
      ),
      'pendente'
    );
    
    -- Log
    INSERT INTO public.automation_logs (tipo, nome, status, registros_processados, registros_sucesso, detalhes)
    VALUES (
      'estoque',
      'Alerta Estoque Crítico',
      'sucesso',
      1,
      1,
      jsonb_build_object('item_id', NEW.id, 'item_nome', NEW.nome, 'quantidade', NEW.quantidade)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_critical_stock
AFTER INSERT OR UPDATE ON public.estoque
FOR EACH ROW
EXECUTE FUNCTION public.check_critical_stock();