import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationItem {
  id: string
  tipo: string
  destinatario_email: string | null
  destinatario_telefone: string | null
  destinatario_nome: string | null
  assunto: string | null
  conteudo: string
  tentativas: number
  max_tentativas: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar notificações pendentes
    const { data: pendentes, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pendente')
      .lte('agendado_para', new Date().toISOString())
      .lt('tentativas', 3)
      .order('agendado_para', { ascending: true })
      .limit(50)

    if (fetchError) {
      throw new Error(`Erro ao buscar fila: ${fetchError.message}`)
    }

    if (!pendentes || pendentes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma notificação pendente', processados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processando ${pendentes.length} notificações pendentes`)

    let successCount = 0
    let errorCount = 0

    for (const notif of pendentes as NotificationItem[]) {
      // Marcar como enviando
      await supabase
        .from('notification_queue')
        .update({ status: 'enviando', tentativas: notif.tentativas + 1 })
        .eq('id', notif.id)

      try {
        if (notif.tipo === 'email' && notif.destinatario_email) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'EloLab <onboarding@resend.dev>',
              to: [notif.destinatario_email],
              subject: notif.assunto || 'Notificação EloLab',
              html: notif.conteudo.replace(/\n/g, '<br>'),
            }),
          })

          const result = await emailRes.json()

          if (emailRes.ok) {
            await supabase
              .from('notification_queue')
              .update({
                status: 'enviado',
                enviado_em: new Date().toISOString(),
              })
              .eq('id', notif.id)

            successCount++
            console.log(`✅ E-mail enviado para ${notif.destinatario_email}`)
          } else {
            const novasTentativas = notif.tentativas + 1
            await supabase
              .from('notification_queue')
              .update({
                status: novasTentativas >= notif.max_tentativas ? 'erro' : 'pendente',
                erro_mensagem: JSON.stringify(result),
              })
              .eq('id', notif.id)

            errorCount++
            console.error(`❌ Erro ao enviar para ${notif.destinatario_email}:`, result)
          }
        } else if (notif.tipo === 'sms' || notif.tipo === 'whatsapp') {
          // TODO: Implementar integração com Twilio/Z-API
          console.log(`⏭️ SMS/WhatsApp não implementado ainda para ${notif.destinatario_telefone}`)
          
          await supabase
            .from('notification_queue')
            .update({
              status: 'erro',
              erro_mensagem: 'Integração SMS/WhatsApp não configurada',
            })
            .eq('id', notif.id)

          errorCount++
        } else {
          console.log(`⏭️ Tipo de notificação não suportado: ${notif.tipo}`)
          errorCount++
        }
      } catch (err) {
        const novasTentativas = notif.tentativas + 1
        await supabase
          .from('notification_queue')
          .update({
            status: novasTentativas >= notif.max_tentativas ? 'erro' : 'pendente',
            erro_mensagem: String(err),
          })
          .eq('id', notif.id)

        errorCount++
        console.error(`❌ Exceção ao processar notificação ${notif.id}:`, err)
      }
    }

    const duration = Date.now() - startTime

    // Log da automação
    await supabase.from('automation_logs').insert({
      tipo: 'fila_notificacao',
      nome: 'Processamento de Fila de Notificações',
      status: errorCount === 0 ? 'sucesso' : successCount === 0 ? 'erro' : 'parcial',
      registros_processados: pendentes.length,
      registros_sucesso: successCount,
      registros_erro: errorCount,
      duracao_ms: duration,
      executado_por: 'cron',
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fila processada',
        stats: {
          processados: pendentes.length,
          sucesso: successCount,
          erros: errorCount,
          duracao_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na função process-notification-queue:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
