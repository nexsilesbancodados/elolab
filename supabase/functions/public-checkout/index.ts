import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    const { plano_id, plano_slug, nome, email, telefone, clinica, mode = 'trial' } = body

    if (!nome || !email || !plano_slug) {
      return new Response(
        JSON.stringify({ error: 'Nome, e-mail e plano são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('*')
      .eq('id', plano_id)
      .single()

    if (planoError || !plano) {
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a unique invitation code
    const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days to activate

    // Store the pending registration
    const { data: registro, error: regError } = await supabase
      .from('registros_pendentes')
      .insert({
        nome,
        email,
        telefone,
        clinica,
        plano_id: plano.id,
        plano_slug: plano.slug,
        codigo_convite: inviteCode,
        expires_at: expiresAt.toISOString(),
        status: mode === 'buy' ? 'aguardando_pagamento' : 'pendente',
      })
      .select()
      .single()

    if (regError) {
      console.error('Erro ao criar registro:', regError)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar registro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let checkoutUrl = null

    // MODE: BUY — create Mercado Pago checkout and redirect
    if (mode === 'buy' && mpAccessToken) {
      try {
        const appUrl = 'https://real-world-made.lovable.app'
        const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              title: `${plano.nome} - Assinatura Mensal`,
              description: plano.descricao || `Plano ${plano.nome} EloLab`,
              unit_price: Number(plano.valor),
              quantity: 1,
              currency_id: 'BRL',
            }],
            payer: { name: nome, email },
            external_reference: registro.id,
            back_urls: {
              success: `${appUrl}/?status=success&id=${registro.id}`,
              failure: `${appUrl}/?status=error`,
              pending: `${appUrl}/?status=pending`,
            },
            auto_return: 'approved',
          }),
        })

        if (preferenceRes.ok) {
          const prefData = await preferenceRes.json()
          checkoutUrl = prefData.init_point || prefData.sandbox_init_point

          // Update registro with MP reference
          await supabase
            .from('registros_pendentes')
            .update({ mp_payment_id: prefData.id })
            .eq('id', registro.id)
        } else {
          console.error('MP error:', await preferenceRes.text())
        }
      } catch (mpErr) {
        console.error('Erro Mercado Pago:', mpErr)
      }
    }

    // Send welcome email with invite code via Brevo
    if (brevoApiKey) {
      const appUrl = 'https://real-world-made.lovable.app'
      const activationLink = `${appUrl}/auth?codigo=${inviteCode}&email=${encodeURIComponent(email)}&plano=${plano.slug}`

      const isTrial = mode === 'trial'
      const subject = isTrial
        ? `🎁 Seu teste grátis de ${plano.trial_dias || 3} dias começou! Código de ativação`
        : `🎉 Compra confirmada! Seu código de ativação do ${plano.nome}`

      const headerText = isTrial
        ? `Teste Grátis de ${plano.trial_dias || 3} Dias`
        : `Compra Confirmada!`

      const bodyText = isTrial
        ? `Seu período de teste gratuito de <strong>${plano.trial_dias || 3} dias</strong> começa assim que você criar sua conta. Use o código abaixo:`
        : `Sua assinatura do <strong>${plano.nome}</strong> foi processada com sucesso. Use o código abaixo para criar sua conta e começar a usar:`

      const footerText = isTrial
        ? `Este código expira em 7 dias. Após o teste, o plano custa R$ ${Number(plano.valor).toFixed(2)}/mês.`
        : `Este código expira em 7 dias. Sua assinatura de R$ ${Number(plano.valor).toFixed(2)}/mês já está ativa.`

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'EloLab', email: 'noreply@elolab.com.br' },
          to: [{ email, name: nome }],
          subject,
          htmlContent: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1a9a7a, #14b8a6); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Bem-vindo ao EloLab!</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">${headerText}</p>
              </div>
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Olá, <strong>${nome}</strong>!</p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">${bodyText}</p>
                <div style="background: #f0fdf4; border: 2px dashed #1a9a7a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Seu código de ativação</p>
                  <p style="color: #1a9a7a; font-size: 36px; font-weight: 800; letter-spacing: 4px; margin: 0;">${inviteCode}</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #1a9a7a, #14b8a6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Criar Minha Conta →
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">${footerText}</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">EloLab — Gestão Inteligente para Clínicas</p>
              </div>
            </div>
          `,
        }),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        message: mode === 'buy' && checkoutUrl
          ? 'Redirecionando para pagamento...'
          : 'Registro criado! Verifique seu e-mail para o código de ativação.',
        checkout_url: checkoutUrl,
        invite_code: inviteCode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no public-checkout:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
