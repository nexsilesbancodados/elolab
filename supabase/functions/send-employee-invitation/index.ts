import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  funcionarioId: string;
  email: string;
  nome: string;
  roles: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Create client with user's token to verify auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { funcionarioId, email, nome, roles }: InvitationRequest = await req.json();

    // Validate inputs
    if (!funcionarioId || !email || !nome) {
      throw new Error("Missing required fields: funcionarioId, email, nome");
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Use service role client for database operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create invitation record
    const { error: insertError } = await serviceClient
      .from("employee_invitations")
      .insert({
        funcionario_id: funcionarioId,
        email,
        token,
        roles: roles || [],
        status: "pending",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create invitation: " + insertError.message);
    }

    // Get the origin from request or use default
    const origin = req.headers.get("origin") || "https://lovable.app";
    const inviteUrl = `${origin}/aceitar-convite?token=${token}`;

    // Format roles for display
    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      medico: "Médico",
      recepcao: "Recepção",
      enfermagem: "Enfermagem",
      financeiro: "Financeiro",
    };

    const rolesDisplay = roles.map(r => roleLabels[r] || r).join(", ") || "Usuário";

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Sistema Clínico <noreply@resend.dev>",
      to: [email],
      subject: "Convite para acessar o Sistema Clínico",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 32px; }
            .greeting { font-size: 18px; color: #18181b; margin-bottom: 16px; }
            .text { color: #52525b; line-height: 1.6; margin-bottom: 24px; }
            .role-badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; }
            .button { display: inline-block; background: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .button:hover { background: #0284c7; }
            .footer { background: #f4f4f5; padding: 24px; text-align: center; color: #71717a; font-size: 12px; }
            .warning { color: #a16207; background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 16px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Sistema Clínico</h1>
            </div>
            <div class="content">
              <p class="greeting">Olá, ${nome}!</p>
              <p class="text">
                Você foi convidado(a) para fazer parte da nossa equipe no Sistema Clínico. 
                Com este convite, você terá acesso ao sistema com as seguintes permissões:
              </p>
              <p>
                <span class="role-badge">${rolesDisplay}</span>
              </p>
              <p class="text">
                Clique no botão abaixo para criar sua conta e começar a usar o sistema:
              </p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Aceitar Convite e Criar Conta</a>
              </div>
              <p class="warning">
                ⚠️ Este convite expira em 7 dias. Se você não reconhece este convite, ignore este e-mail.
              </p>
            </div>
            <div class="footer">
              <p>Sistema Clínico - Gestão Hospitalar</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso",
        token 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
