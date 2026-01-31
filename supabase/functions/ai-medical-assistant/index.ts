import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MedicalAssistantRequest {
  action: 'suggest_diagnosis' | 'check_interactions' | 'fill_prescription'
  data: {
    // Para suggest_diagnosis
    queixa_principal?: string
    historia_doenca_atual?: string
    exames_fisicos?: string
    // Para check_interactions
    medicamentos?: string[]
    alergias?: string[]
    // Para fill_prescription
    diagnostico?: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: MedicalAssistantRequest = await req.json()
    const { action, data } = body

    let systemPrompt = ''
    let userPrompt = ''

    switch (action) {
      case 'suggest_diagnosis':
        systemPrompt = `Você é um assistente médico de apoio à decisão clínica. Sua função é sugerir hipóteses diagnósticas baseadas nos sintomas e exames fornecidos.

IMPORTANTE: Suas sugestões são apenas para apoio - a decisão final é SEMPRE do médico.

Formato de resposta:
1. Liste as 3-5 hipóteses diagnósticas mais prováveis em ordem de probabilidade
2. Para cada hipótese, explique brevemente os achados que a suportam
3. Sugira exames complementares se necessário
4. Use linguagem técnica apropriada para profissionais de saúde

Responda em português brasileiro.`

        userPrompt = `Paciente apresenta:

**Queixa Principal:** ${data.queixa_principal || 'Não informada'}

**História da Doença Atual:** ${data.historia_doenca_atual || 'Não informada'}

**Exames Físicos:** ${data.exames_fisicos || 'Não realizados'}

Com base nessas informações, quais são as hipóteses diagnósticas mais prováveis?`
        break

      case 'check_interactions':
        systemPrompt = `Você é um farmacêutico clínico especializado em interações medicamentosas e alergias.

Sua função é analisar uma lista de medicamentos e alergias e identificar:
1. Interações medicamentosas (gravidade: leve, moderada, grave)
2. Possíveis reações alérgicas cruzadas
3. Contraindicações importantes
4. Sugestões de ajuste se necessário

Formato:
- Se houver interações GRAVES, destaque com ⚠️ ALERTA
- Liste cada interação com explicação clara
- Sugira alternativas quando apropriado

Responda em português brasileiro de forma concisa.`

        userPrompt = `Analise a seguinte prescrição:

**Medicamentos:**
${(data.medicamentos || []).map((m, i) => `${i + 1}. ${m}`).join('\n')}

**Alergias conhecidas:**
${data.alergias && data.alergias.length > 0 ? data.alergias.join(', ') : 'Nenhuma informada'}

Existem interações medicamentosas ou contraindicações?`
        break

      case 'fill_prescription':
        systemPrompt = `Você é um assistente médico que ajuda a elaborar prescrições.

Com base no diagnóstico fornecido, sugira:
1. Medicamentos apropriados com dosagem e posologia
2. Duração do tratamento
3. Orientações ao paciente
4. Cuidados especiais

Use apenas medicamentos comuns e disponíveis no Brasil.
Formate como uma prescrição médica estruturada.

Responda em português brasileiro.`

        userPrompt = `Elabore uma sugestão de prescrição para:

**Diagnóstico:** ${data.diagnostico || 'Não informado'}

Sugira os medicamentos mais apropriados.`
        break

      default:
        throw new Error(`Ação desconhecida: ${action}`)
    }

    // Chamar Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const error = await aiResponse.text()
      throw new Error(`Erro na API de IA: ${error}`)
    }

    const aiResult = await aiResponse.json()
    const suggestion = aiResult.choices?.[0]?.message?.content || 'Não foi possível gerar sugestão'

    const duration = Date.now() - startTime

    // Log da automação
    await supabase.from('automation_logs').insert({
      tipo: 'ia_medica',
      nome: `Assistente IA - ${action}`,
      status: 'sucesso',
      registros_processados: 1,
      registros_sucesso: 1,
      detalhes: {
        action,
        input_length: userPrompt.length,
        output_length: suggestion.length,
      },
      duracao_ms: duration,
      executado_por: 'usuario',
    })

    return new Response(
      JSON.stringify({
        success: true,
        action,
        suggestion,
        disclaimer: '⚠️ Esta é uma sugestão gerada por IA para apoio à decisão clínica. A responsabilidade pela conduta médica é exclusiva do profissional de saúde.',
        stats: {
          duracao_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na função ai-medical-assistant:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
