import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(
        JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_preference") {
      return await createPreference(body, mpToken, supabase, corsHeaders);
    } else if (action === "create_subscription") {
      return await createSubscription(body, mpToken, supabase, corsHeaders);
    } else if (action === "get_payment") {
      return await getPayment(body, mpToken, corsHeaders);
    } else if (action === "cancel_subscription") {
      return await cancelSubscription(body, mpToken, supabase, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Erro no mercadopago-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createPreference(
  body: any,
  mpToken: string,
  supabase: any,
  headers: Record<string, string>
) {
  const { paciente_id, lancamento_id, agendamento_id, descricao, valor, parcelas_max } = body;

  const externalReference = crypto.randomUUID();

  const preference = {
    items: [
      {
        title: descricao || "Consulta Médica",
        quantity: 1,
        unit_price: Number(valor),
        currency_id: "BRL",
      },
    ],
    external_reference: externalReference,
    payment_methods: {
      installments: parcelas_max || 12,
    },
    back_urls: {
      success: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?status=success`,
      failure: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?status=failure`,
      pending: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?status=pending`,
    },
    auto_return: "approved",
    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
  };

  const response = await callMercadoPagoWithRetry(
    `${MP_API_BASE}/checkout/preferences`,
    "POST",
    preference,
    mpToken
  );

  // Save to DB
  const { data: pagamento, error } = await supabase
    .from("pagamentos_mercadopago")
    .insert({
      paciente_id,
      lancamento_id,
      agendamento_id,
      mp_preference_id: response.id,
      mp_external_reference: externalReference,
      valor: Number(valor),
      descricao: descricao || "Consulta Médica",
      tipo: "pagamento",
      checkout_url: response.init_point,
      parcelas: parcelas_max || 1,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar pagamento:", error);
    throw new Error("Erro ao registrar pagamento no banco");
  }

  return new Response(
    JSON.stringify({
      checkout_url: response.init_point,
      sandbox_url: response.sandbox_init_point,
      preference_id: response.id,
      pagamento_id: pagamento.id,
    }),
    { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

async function createSubscription(
  body: any,
  mpToken: string,
  supabase: any,
  headers: Record<string, string>
) {
  const { paciente_id, nome_plano, descricao, valor, frequencia } = body;

  const frequenciaMap: Record<string, { frequency: number; frequency_type: string }> = {
    mensal: { frequency: 1, frequency_type: "months" },
    trimestral: { frequency: 3, frequency_type: "months" },
    semestral: { frequency: 6, frequency_type: "months" },
    anual: { frequency: 12, frequency_type: "months" },
  };

  const freq = frequenciaMap[frequencia] || frequenciaMap.mensal;

  const preapproval = {
    reason: nome_plano,
    auto_recurring: {
      frequency: freq.frequency,
      frequency_type: freq.frequency_type,
      transaction_amount: Number(valor),
      currency_id: "BRL",
    },
    back_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?type=subscription`,
    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
  };

  const response = await callMercadoPagoWithRetry(
    `${MP_API_BASE}/preapproval`,
    "POST",
    preapproval,
    mpToken
  );

  const { data: assinatura, error } = await supabase
    .from("assinaturas_mercadopago")
    .insert({
      paciente_id,
      mp_preapproval_id: response.id,
      nome_plano,
      descricao,
      valor: Number(valor),
      frequencia,
      checkout_url: response.init_point,
      status: "pendente",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar assinatura:", error);
    throw new Error("Erro ao registrar assinatura no banco");
  }

  return new Response(
    JSON.stringify({
      checkout_url: response.init_point,
      preapproval_id: response.id,
      assinatura_id: assinatura.id,
    }),
    { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

async function getPayment(
  body: any,
  mpToken: string,
  headers: Record<string, string>
) {
  const { payment_id } = body;
  const response = await callMercadoPagoWithRetry(
    `${MP_API_BASE}/v1/payments/${payment_id}`,
    "GET",
    null,
    mpToken
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function cancelSubscription(
  body: any,
  mpToken: string,
  supabase: any,
  headers: Record<string, string>
) {
  const { assinatura_id, mp_preapproval_id } = body;

  const response = await callMercadoPagoWithRetry(
    `${MP_API_BASE}/preapproval/${mp_preapproval_id}`,
    "PUT",
    { status: "cancelled" },
    mpToken
  );

  await supabase
    .from("assinaturas_mercadopago")
    .update({ status: "cancelada" })
    .eq("id", assinatura_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function callMercadoPagoWithRetry(
  url: string,
  method: string,
  payload: any,
  token: string,
  attempt = 1
): Promise<any> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(90000),
    };

    if (payload && method !== "GET") {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Mercado Pago retornou não-JSON:", text.substring(0, 200));
      throw new Error("Mercado Pago retornou resposta inválida");
    }

    const data = await response.json();

    if (response.status >= 400 && response.status < 500) {
      console.error("Mercado Pago 4xx:", JSON.stringify(data));
      throw new Error(data.message || `Erro do Mercado Pago: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`Erro do gateway Mercado Pago: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.message?.includes("Erro do Mercado Pago") || error.message?.includes("4")) {
      throw error;
    }

    console.error(`Tentativa ${attempt}/3 falhou:`, error.message);
    if (attempt >= 3) {
      throw new Error(`Mercado Pago indisponível após 3 tentativas: ${error.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    return callMercadoPagoWithRetry(url, method, payload, token, attempt + 1);
  }
}
