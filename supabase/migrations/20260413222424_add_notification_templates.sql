-- Add new notification templates for confirmacao_consulta, resultado_exame, recibo_pagamento

INSERT INTO public.notification_templates (nome, tipo, categoria, assunto, conteudo, ativo, variaveis)
VALUES
(
  'Confirmação de Consulta',
  'email',
  'confirmacao_consulta',
  '✅ Sua Consulta foi Confirmada - {{clinica_nome}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">✅ Consulta Confirmada!</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Olá <strong>{{paciente_nome}}</strong>,</p>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Sua consulta foi confirmada com sucesso! Abaixo estão os detalhes:</p>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 8px 0; color: #333;"><strong>📅 Data:</strong> {{data}}</p>
        <p style="margin: 8px 0; color: #333;"><strong>🕐 Horário:</strong> {{horario}}</p>
        <p style="margin: 8px 0; color: #333;"><strong>👨‍⚕️ Médico:</strong> {{medico_nome}}</p>
        <p style="margin: 8px 0; color: #333;"><strong>📍 Local:</strong> {{clinica_nome}}</p>
        <p style="margin: 8px 0; color: #666; font-size: 13px;">Endereço: {{clinica_endereco}}</p>
      </div>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;"><strong>⏰ Lembrete:</strong> Chegue 10 minutos antes. Traga seus documentos de identificação.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link_portal}}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ver Detalhes</a>
      </div>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        Se tiver dúvidas, entre em contato conosco.
      </p>
    </div>
    <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0;">{{clinica_nome}}</p>
    </div>
  </div>',
  true,
  ARRAY['paciente_nome', 'data', 'horario', 'medico_nome', 'clinica_nome', 'clinica_endereco', 'link_portal']::text[]
),
(
  'Resultado de Exame Disponível',
  'email',
  'resultado_exame',
  '📋 Seu Resultado de Exame Está Disponível - {{clinica_nome}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">📋 Resultado Disponível!</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Olá <strong>{{paciente_nome}}</strong>,</p>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Seu resultado do exame está pronto para consulta:</p>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 8px 0; color: #333;"><strong>🔬 Tipo de Exame:</strong> {{tipo_exame}}</p>
        <p style="margin: 8px 0; color: #333;"><strong>📅 Data do Resultado:</strong> {{data_resultado}}</p>
        <p style="margin: 8px 0; color: #333;"><strong>🏥 Clínica:</strong> {{clinica_nome}}</p>
      </div>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Acesse o portal do paciente para visualizar os detalhes do seu resultado.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link_portal}}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Acessar Portal</a>
      </div>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        Se tiver dúvidas sobre seu resultado, entre em contato com a clínica.
      </p>
    </div>
    <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0;">{{clinica_nome}}</p>
    </div>
  </div>',
  true,
  ARRAY['paciente_nome', 'tipo_exame', 'data_resultado', 'link_portal', 'clinica_nome']::text[]
),
(
  'Recibo de Pagamento',
  'email',
  'recibo_pagamento',
  '💳 Recibo de Pagamento - {{clinica_nome}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
    <div style="background: #2d3748; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">💳 Recibo de Pagamento</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Prezado(a) <strong>{{paciente_nome}}</strong>,</p>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Seguem os detalhes do seu pagamento:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 2px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #555; font-weight: bold;">Descrição:</td>
          <td style="padding: 12px 0; text-align: right; color: #333;">{{descricao}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #555; font-weight: bold;">Valor:</td>
          <td style="padding: 12px 0; text-align: right; color: #333; font-size: 18px; font-weight: bold;">{{valor}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #555; font-weight: bold;">Forma de Pagamento:</td>
          <td style="padding: 12px 0; text-align: right; color: #333;">{{forma_pagamento}}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #555; font-weight: bold;">Data:</td>
          <td style="padding: 12px 0; text-align: right; color: #333;">{{data}}</td>
        </tr>
      </table>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #333; font-weight: bold;">✅ Pagamento Confirmado</p>
      </div>

      <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Este é um recibo digital do seu pagamento. Guarde este email como comprovante.</p>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        Obrigado por sua confiança. Em caso de dúvidas, entre em contato com nossa equipe.
      </p>
    </div>
    <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0;">{{clinica_nome}}</p>
      <p style="margin: 5px 0; font-size: 11px;">CNPJ: {{clinica_cnpj}}</p>
    </div>
  </div>',
  true,
  ARRAY['paciente_nome', 'valor', 'forma_pagamento', 'data', 'descricao', 'clinica_nome', 'clinica_cnpj']::text[]
);
