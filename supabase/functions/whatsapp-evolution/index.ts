import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface EvolutionRequest {
  action: 'create_instance' | 'get_qr_code' | 'check_status' | 'send_message' | 'delete_instance' | 'list_instances'
  instance_name?: string
  session_id?: string
  to?: string
  message?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body: EvolutionRequest = await req.json()
    const { action, instance_name, session_id, to, message } = body

    console.log(`[WhatsApp Evolution] Action: ${action}, Instance: ${instance_name || session_id}`)

    let result: any = null

    switch (action) {
      case 'create_instance': {
        if (!instance_name) throw new Error('instance_name é obrigatório')

        // Criar instância na Evolution API
        const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            instanceName: instance_name,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        })

        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error('[Evolution API] Create error:', errorText)
          throw new Error(`Erro ao criar instância: ${errorText}`)
        }

        const createData = await createResponse.json()
        console.log('[Evolution API] Instance created:', createData)

        // Obter QR Code
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        })

        let qrCode = null
        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          qrCode = qrData.base64 || qrData.code
        }

        // Salvar sessão no banco
        const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('whatsapp_sessions')
          .insert({
            instance_name,
            instance_id: createData.instance?.instanceId || instance_name,
            status: qrCode ? 'qr_code' : 'connecting',
            qr_code: qrCode,
            qr_code_expires_at: qrCode ? new Date(Date.now() + 60000).toISOString() : null,
            webhook_url: webhookUrl,
          })
          .select()
          .single()

        if (sessionError) {
          console.error('[Supabase] Session insert error:', sessionError)
          throw sessionError
        }

        // Configurar webhook na Evolution API
        await fetch(`${evolutionApiUrl}/webhook/set/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          }),
        })

        result = {
          session: sessionData,
          qr_code: qrCode,
        }
        break
      }

      case 'get_qr_code': {
        if (!instance_name && !session_id) throw new Error('instance_name ou session_id é obrigatório')

        let instanceName = instance_name
        if (session_id) {
          const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('instance_name')
            .eq('id', session_id)
            .single()
          instanceName = session?.instance_name
        }

        if (!instanceName) throw new Error('Sessão não encontrada')

        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        })

        if (!qrResponse.ok) {
          const errorText = await qrResponse.text()
          throw new Error(`Erro ao obter QR Code: ${errorText}`)
        }

        const qrData = await qrResponse.json()
        const qrCode = qrData.base64 || qrData.code

        // Atualizar no banco
        await supabase
          .from('whatsapp_sessions')
          .update({
            qr_code: qrCode,
            qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            status: 'qr_code',
          })
          .eq('instance_name', instanceName)

        result = { qr_code: qrCode }
        break
      }

      case 'check_status': {
        if (!instance_name && !session_id) throw new Error('instance_name ou session_id é obrigatório')

        let instanceName = instance_name
        if (session_id) {
          const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('instance_name')
            .eq('id', session_id)
            .single()
          instanceName = session?.instance_name
        }

        if (!instanceName) throw new Error('Sessão não encontrada')

        const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        })

        if (!statusResponse.ok) {
          result = { status: 'disconnected', connected: false }
          break
        }

        const statusData = await statusResponse.json()
        const isConnected = statusData.state === 'open'

        // Atualizar status no banco
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: isConnected ? 'connected' : 'disconnected',
            phone_number: statusData.instance?.profilePictureUrl ? statusData.instance.owner : null,
          })
          .eq('instance_name', instanceName)

        result = {
          status: isConnected ? 'connected' : 'disconnected',
          connected: isConnected,
          state: statusData.state,
        }
        break
      }

      case 'send_message': {
        if (!instance_name || !to || !message) {
          throw new Error('instance_name, to e message são obrigatórios')
        }

        const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            number: to,
            text: message,
          }),
        })

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text()
          throw new Error(`Erro ao enviar mensagem: ${errorText}`)
        }

        result = await sendResponse.json()
        break
      }

      case 'delete_instance': {
        if (!instance_name && !session_id) throw new Error('instance_name ou session_id é obrigatório')

        let instanceName = instance_name
        if (session_id) {
          const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('instance_name')
            .eq('id', session_id)
            .single()
          instanceName = session?.instance_name
        }

        if (!instanceName) throw new Error('Sessão não encontrada')

        // Deletar da Evolution API
        await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionApiKey,
          },
        })

        // Deletar do banco
        await supabase
          .from('whatsapp_sessions')
          .delete()
          .eq('instance_name', instanceName)

        result = { deleted: true }
        break
      }

      case 'list_instances': {
        const listResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        })

        if (listResponse.ok) {
          result = await listResponse.json()
        } else {
          result = []
        }
        break
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[WhatsApp Evolution] Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
