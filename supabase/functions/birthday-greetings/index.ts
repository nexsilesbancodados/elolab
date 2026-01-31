import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Buscar configuração
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('valor, ativo')
      .eq('chave', 'aniversariantes')
      .single()

    if (settings?.ativo === false) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aniversariantes desativado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar template
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('categoria', 'aniversario')
      .eq('tipo', 'email')
      .eq('ativo', true)
      .single()

    if (!template) {
      throw new Error('Template de aniversário não encontrado')
    }

    // Data de hoje
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')

    // Buscar pacientes que fazem aniversário hoje
    // Usando EXTRACT para pegar dia e mês da data de nascimento
    const { data: aniversariantes, error: fetchError } = await supabase
      .from('pacientes')
      .select('id, nome, email, data_nascimento')
      .not('email', 'is', null)
      .not('data_nascimento', 'is', null)

    if (fetchError) {
      throw new Error(`Erro ao buscar pacientes: ${fetchError.message}`)
    }

    // Filtrar aniversariantes de hoje
    const aniversariantesHoje = aniversariantes?.filter(p => {
      if (!p.data_nascimento) return false
      const [ano, m, d] = p.data_nascimento.split('-')
      return d === dia && m === mes
    }) || []

    if (aniversariantesHoje.length === 0) {
      console.log('Nenhum aniversariante hoje')
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum aniversariante hoje', aniversariantes: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Encontrados ${aniversariantesHoje.length} aniversariantes`)

    let successCount = 0
    let errorCount = 0

    for (const paciente of aniversariantesHoje) {
      if (!paciente.email) continue

      // Verificar se já enviou hoje
      const { data: existing } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('destinatario_id', paciente.id)
        .eq('dados_extras->tipo', 'aniversario')
        .gte('created_at', hoje.toISOString().split('T')[0])
        .single()

      if (existing) {
        console.log(`Mensagem de aniversário já enviada para ${paciente.nome}`)
        continue
      }

      // Substituir variáveis no template
      const conteudo = template.conteudo
        .replace(/\{\{paciente_nome\}\}/g, paciente.nome)
        .replace(/\{\{clinica_nome\}\}/g, 'EloLab Clínica')

      const assunto = (template.assunto || 'Feliz Aniversário!')
        .replace(/\{\{paciente_nome\}\}/g, paciente.nome)

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'EloLab <onboarding@resend.dev>',
            to: [paciente.email],
            subject: assunto,
            html: conteudo.replace(/\n/g, '<br>'),
          }),
        })

        const result = await emailRes.json()

        if (emailRes.ok) {
          successCount++

          // Registrar na fila como enviado
          await supabase.from('notification_queue').insert({
            template_id: template.id,
            tipo: 'email',
            destinatario_id: paciente.id,
            destinatario_email: paciente.email,
            destinatario_nome: paciente.nome,
            assunto,
            conteudo,
            dados_extras: { tipo: 'aniversario' },
            status: 'enviado',
            enviado_em: new Date().toISOString(),
          })

          console.log(`✅ Aniversário enviado para ${paciente.nome} (${paciente.email})`)
        } else {
          errorCount++
          console.error(`❌ Erro ao enviar para ${paciente.email}:`, result)
        }
      } catch (err) {
        errorCount++
        console.error(`❌ Exceção ao enviar para ${paciente.email}:`, err)
      }
    }

    const duration = Date.now() - startTime

    // Log da automação
    await supabase.from('automation_logs').insert({
      tipo: 'aniversario',
      nome: 'Mensagens de Aniversário',
      status: errorCount === 0 ? 'sucesso' : 'parcial',
      registros_processados: aniversariantesHoje.length,
      registros_sucesso: successCount,
      registros_erro: errorCount,
      detalhes: {
        data: hoje.toISOString().split('T')[0],
        aniversariantes: aniversariantesHoje.map(p => ({ id: p.id, nome: p.nome })),
      },
      duracao_ms: duration,
      executado_por: 'cron',
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagens de aniversário processadas',
        stats: {
          aniversariantes: aniversariantesHoje.length,
          enviados: successCount,
          erros: errorCount,
          duracao_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na função birthday-greetings:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
