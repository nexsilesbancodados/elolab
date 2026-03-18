import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("paciente_portal_tokens")
      .select("*, pacientes(id, nome, email, telefone, foto_url)")
      .eq("token", token)
      .eq("ativo", true)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Token inválido ou expirado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pacienteId = tokenData.paciente_id;

    // Update last access
    await supabase
      .from("paciente_portal_tokens")
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq("id", tokenData.id);

    let result: any;

    switch (action) {
      case "get_profile":
        result = tokenData.pacientes;
        break;

      case "get_agendamentos": {
        const { data } = await supabase
          .from("agendamentos")
          .select("id, data, hora_inicio, hora_fim, tipo, status, medicos(crm, especialidade)")
          .eq("paciente_id", pacienteId)
          .gte("data", new Date().toISOString().split("T")[0])
          .order("data", { ascending: true })
          .limit(20);
        result = data || [];
        break;
      }

      case "get_historico": {
        const { data } = await supabase
          .from("agendamentos")
          .select("id, data, hora_inicio, tipo, status, medicos(crm, especialidade)")
          .eq("paciente_id", pacienteId)
          .lt("data", new Date().toISOString().split("T")[0])
          .order("data", { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      case "get_exames": {
        const { data } = await supabase
          .from("exames")
          .select("id, tipo_exame, status, data_solicitacao, data_realizacao, resultado, medicos:medico_solicitante_id(crm)")
          .eq("paciente_id", pacienteId)
          .order("data_solicitacao", { ascending: false })
          .limit(30);
        result = data || [];
        break;
      }

      case "get_pagamentos": {
        const { data } = await supabase
          .from("pagamentos_mercadopago")
          .select("id, descricao, valor, status, checkout_url, created_at, metodo_pagamento")
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false })
          .limit(20);
        result = data || [];
        break;
      }

      case "get_prescricoes": {
        const { data } = await supabase
          .from("prescricoes")
          .select("id, medicamento, dosagem, posologia, quantidade, duracao, observacoes, tipo, data_emissao, medicos:medico_id(nome, especialidade)")
          .eq("paciente_id", pacienteId)
          .order("data_emissao", { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro portal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
