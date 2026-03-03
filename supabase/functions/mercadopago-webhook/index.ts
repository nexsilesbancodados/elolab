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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Handle redirect back_urls (GET) — user returning from checkout
    if (req.method === "GET") {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "unknown";
      const appUrl = "https://real-world-made.lovable.app";
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${appUrl}/financeiro?mp_status=${status}`,
        },
      });
    }

    // Handle webhook notification (POST)
    const body = await req.json();
    console.log("Webhook recebido:", JSON.stringify(body));

    // Log webhook event
    await supabase.from("mercadopago_webhook_logs").insert({
      event_type: body.type || body.action || "unknown",
      event_id: body.id?.toString(),
      data_id: body.data?.id?.toString(),
      payload: body,
    });

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process payment notification (payment.created, payment.updated)
    if (
      body.type === "payment" ||
      body.action === "payment.created" ||
      body.action === "payment.updated"
    ) {
      const paymentId = body.data?.id;
      if (paymentId) {
        await processPaymentNotification(paymentId.toString(), mpToken, supabase);
      }
    }

    // Process subscription notification (subscription_preapproval)
    if (
      body.type === "subscription_preapproval" ||
      body.action?.includes("preapproval") ||
      body.type === "subscription_preapproval_plan"
    ) {
      const preapprovalId = body.data?.id;
      if (preapprovalId) {
        await processSubscriptionNotification(preapprovalId.toString(), mpToken, supabase);
      }
    }

    // Process authorized_payment (subscription payment)
    if (
      body.type === "subscription_authorized_payment" ||
      body.action?.includes("authorized_payment")
    ) {
      const paymentId = body.data?.id;
      if (paymentId) {
        await processPaymentNotification(paymentId.toString(), mpToken, supabase);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro no webhook:", error);
    // Always return 200 to MP to prevent retries
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processPaymentNotification(
  paymentId: string,
  mpToken: string,
  supabase: any
) {
  try {
    // GET /v1/payments/{id} per MP API docs
    const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Erro ao buscar pagamento ${paymentId}:`, response.status);
      return;
    }

    const payment = await response.json();
    console.log("Pagamento processado:", payment.id, payment.status, "ref:", payment.external_reference);

    const statusMap: Record<string, string> = {
      approved: "aprovado",
      pending: "pendente",
      in_process: "em_processo",
      rejected: "rejeitado",
      cancelled: "cancelado",
      refunded: "reembolsado",
      charged_back: "reembolsado",
    };

    const status = statusMap[payment.status] || payment.status;

    // Update pagamentos_mercadopago by external_reference
    const { data: pagamentos } = await supabase
      .from("pagamentos_mercadopago")
      .select("id, lancamento_id")
      .eq("mp_external_reference", payment.external_reference)
      .limit(1);

    if (pagamentos && pagamentos.length > 0) {
      await supabase
        .from("pagamentos_mercadopago")
        .update({
          mp_payment_id: payment.id?.toString(),
          status,
          valor_pago: payment.transaction_amount,
          metodo_pagamento: payment.payment_type_id,
          data_aprovacao: payment.status === "approved" ? new Date().toISOString() : null,
          parcelas: payment.installments,
          detalhes_pagamento: payment,
          notificacao_webhook: payment,
        })
        .eq("id", pagamentos[0].id);

      // Update linked lancamento if payment is approved
      if (pagamentos[0].lancamento_id && status === "aprovado") {
        await supabase
          .from("lancamentos")
          .update({
            status: "pago",
            forma_pagamento:
              payment.payment_type_id === "credit_card"
                ? "cartao_credito"
                : payment.payment_type_id === "debit_card"
                ? "cartao_debito"
                : payment.payment_type_id === "account_money"
                ? "mercadopago"
                : payment.payment_type_id || "mercadopago",
          })
          .eq("id", pagamentos[0].lancamento_id);
      }
    }

    // Check if this payment is for a registro_pendente (public checkout)
    if (payment.external_reference && payment.status === "approved") {
      const { data: registro } = await supabase
        .from("registros_pendentes")
        .select("*")
        .eq("id", payment.external_reference)
        .eq("status", "aguardando_pagamento")
        .single();

      if (registro) {
        console.log("Activating registro_pendente:", registro.id);
        await supabase
          .from("registros_pendentes")
          .update({
            status: "pago",
            mp_payment_id: payment.id?.toString(),
          })
          .eq("id", registro.id);
      }
    }

    // Mark webhook log as processed
    await supabase
      .from("mercadopago_webhook_logs")
      .update({ processado: true })
      .eq("data_id", paymentId);
  } catch (error) {
    console.error("Erro ao processar notificação de pagamento:", error);
    await supabase
      .from("mercadopago_webhook_logs")
      .update({ erro_mensagem: (error as Error).message })
      .eq("data_id", paymentId);
  }
}

async function processSubscriptionNotification(
  preapprovalId: string,
  mpToken: string,
  supabase: any
) {
  try {
    // GET /preapproval/{id} per MP API docs
    const response = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
      headers: {
        Authorization: `Bearer ${mpToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Erro ao buscar assinatura ${preapprovalId}:`, response.status);
      return;
    }

    const preapproval = await response.json();
    console.log("Assinatura processada:", preapproval.id, preapproval.status, "ref:", preapproval.external_reference);

    const statusMap: Record<string, string> = {
      authorized: "ativa",
      pending: "pendente",
      paused: "pausada",
      cancelled: "cancelada",
    };

    const status = statusMap[preapproval.status] || preapproval.status;

    // Update assinaturas_mercadopago
    await supabase
      .from("assinaturas_mercadopago")
      .update({
        status,
        data_inicio: preapproval.date_created,
        detalhes: preapproval,
      })
      .eq("mp_preapproval_id", preapprovalId);

    // If subscription is now authorized, activate the registro_pendente
    if (preapproval.status === "authorized" && preapproval.external_reference) {
      const { data: registro } = await supabase
        .from("registros_pendentes")
        .select("*")
        .eq("id", preapproval.external_reference)
        .eq("status", "aguardando_pagamento")
        .single();

      if (registro) {
        console.log("Activating registro_pendente from subscription:", registro.id);
        await supabase
          .from("registros_pendentes")
          .update({
            status: "pago",
            mp_payment_id: preapproval.id?.toString(),
          })
          .eq("id", registro.id);
      }
    }

    // Mark webhook log as processed
    await supabase
      .from("mercadopago_webhook_logs")
      .update({ processado: true })
      .eq("data_id", preapprovalId);
  } catch (error) {
    console.error("Erro ao processar notificação de assinatura:", error);
  }
}