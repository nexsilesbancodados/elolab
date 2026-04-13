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
      .select("*, pacientes(id, nome, email, telefone, foto_url, cpf, data_nascimento, sexo, alergias, observacoes)")
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
          .select("id, data, hora_inicio, hora_fim, tipo, status, medicos(nome, crm, especialidade)")
          .eq("paciente_id", pacienteId)
          .order("data", { ascending: false })
          .limit(50);
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

      case "get_medicos": {
        const { data } = await supabase
          .from("medicos")
          .select("id, nome, crm, especialidade, foto_url")
          .eq("ativo", true)
          .order("nome");
        result = data || [];
        break;
      }

      case "get_available_slots": {
        const { medico_id, data_inicio, data_fim } = body;
        if (!medico_id || !data_inicio || !data_fim) {
          return new Response(
            JSON.stringify({ error: "medico_id, data_inicio, data_fim são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all appointments for this doctor in the date range (excluding cancelled)
        const { data: agendados } = await supabase
          .from("agendamentos")
          .select("hora_inicio, hora_fim")
          .eq("medico_id", medico_id)
          .gte("data", data_inicio)
          .lte("data", data_fim)
          .not("status", "in", '("cancelado")');

        // Generate 30-minute slots from 8am to 6pm
        const slots = [];
        for (let hour = 8; hour < 18; hour++) {
          for (let min of [0, 30]) {
            const slotTime = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            const isBooked = agendados?.some(
              a => a.hora_inicio && a.hora_inicio.slice(0, 5) === slotTime
            );
            if (!isBooked) {
              slots.push(slotTime);
            }
          }
        }
        result = slots;
        break;
      }

      case "create_agendamento": {
        const { medico_id, data, hora_inicio, tipo } = body;
        if (!medico_id || !data || !hora_inicio || !tipo) {
          return new Response(
            JSON.stringify({ error: "medico_id, data, hora_inicio, tipo são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate end time (30 minutes after start)
        const [h, m] = hora_inicio.split(":").map(Number);
        const endTime = `${String(h).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`;

        const { data: newAgendamento, error: insertError } = await supabase
          .from("agendamentos")
          .insert({
            paciente_id: pacienteId,
            medico_id: medico_id,
            data: data,
            hora_inicio: hora_inicio,
            hora_fim: endTime,
            tipo: tipo,
            status: "pendente",
            nota_cancelamento: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = { success: true, agendamento_id: newAgendamento.id };
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
