
-- Tabela de pagamentos Mercado Pago
CREATE TABLE public.pagamentos_mercadopago (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id uuid REFERENCES public.lancamentos(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  
  -- Mercado Pago IDs
  mp_payment_id text,
  mp_preference_id text,
  mp_external_reference text,
  
  -- Valores
  valor numeric NOT NULL,
  valor_pago numeric,
  moeda text DEFAULT 'BRL',
  
  -- Status e tipo
  status text NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, cancelado, reembolsado, em_processo
  tipo text NOT NULL DEFAULT 'pagamento', -- pagamento, assinatura, link_pagamento
  metodo_pagamento text, -- credit_card, debit_card, pix, boleto
  
  -- Checkout info
  checkout_url text,
  qr_code_pix text,
  qr_code_base64 text,
  boleto_url text,
  
  -- Datas
  data_criacao timestamp with time zone DEFAULT now(),
  data_aprovacao timestamp with time zone,
  data_vencimento date,
  data_expiracao timestamp with time zone,
  
  -- Detalhes adicionais
  descricao text,
  parcelas integer DEFAULT 1,
  detalhes_pagamento jsonb DEFAULT '{}'::jsonb,
  notificacao_webhook jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de assinaturas/planos recorrentes
CREATE TABLE public.assinaturas_mercadopago (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  
  -- Mercado Pago IDs
  mp_preapproval_id text,
  mp_plan_id text,
  
  -- Plano
  nome_plano text NOT NULL,
  descricao text,
  valor numeric NOT NULL,
  frequencia text NOT NULL DEFAULT 'mensal', -- mensal, trimestral, semestral, anual
  dia_cobranca integer DEFAULT 1,
  
  -- Status
  status text NOT NULL DEFAULT 'pendente', -- pendente, ativa, pausada, cancelada, finalizada
  
  -- Datas
  data_inicio date,
  data_fim date,
  proximo_pagamento date,
  
  -- URL
  checkout_url text,
  
  -- Metadata
  detalhes jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de logs de webhook do Mercado Pago
CREATE TABLE public.mercadopago_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_id text,
  data_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processado boolean DEFAULT false,
  erro_mensagem text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos_mercadopago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_mercadopago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pagamentos_mercadopago
CREATE POLICY "pagamentos_mp_select" ON public.pagamentos_mercadopago
  FOR SELECT USING (can_access_financial(auth.uid()));

CREATE POLICY "pagamentos_mp_insert" ON public.pagamentos_mercadopago
  FOR INSERT WITH CHECK (can_access_financial(auth.uid()) OR is_recepcao(auth.uid()));

CREATE POLICY "pagamentos_mp_update" ON public.pagamentos_mercadopago
  FOR UPDATE USING (can_access_financial(auth.uid()))
  WITH CHECK (can_access_financial(auth.uid()));

CREATE POLICY "pagamentos_mp_delete" ON public.pagamentos_mercadopago
  FOR DELETE USING (is_admin(auth.uid()));

-- RLS Policies para assinaturas
CREATE POLICY "assinaturas_mp_select" ON public.assinaturas_mercadopago
  FOR SELECT USING (can_access_financial(auth.uid()));

CREATE POLICY "assinaturas_mp_insert" ON public.assinaturas_mercadopago
  FOR INSERT WITH CHECK (can_access_financial(auth.uid()));

CREATE POLICY "assinaturas_mp_update" ON public.assinaturas_mercadopago
  FOR UPDATE USING (can_access_financial(auth.uid()))
  WITH CHECK (can_access_financial(auth.uid()));

CREATE POLICY "assinaturas_mp_delete" ON public.assinaturas_mercadopago
  FOR DELETE USING (is_admin(auth.uid()));

-- Webhook logs - service role e admins
CREATE POLICY "webhook_logs_select" ON public.mercadopago_webhook_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "webhook_logs_insert" ON public.mercadopago_webhook_logs
  FOR INSERT WITH CHECK (true); -- webhook precisa inserir sem auth

-- Triggers updated_at
CREATE TRIGGER update_pagamentos_mp_updated_at
  BEFORE UPDATE ON public.pagamentos_mercadopago
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assinaturas_mp_updated_at
  BEFORE UPDATE ON public.assinaturas_mercadopago
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
