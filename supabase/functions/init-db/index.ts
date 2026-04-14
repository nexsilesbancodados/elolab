import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Criar tabela caixa_diario
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.caixa_diario (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          data date NOT NULL,
          aberto boolean NOT NULL DEFAULT true,
          valor_abertura numeric(10,2) NOT NULL DEFAULT 0,
          valor_fechamento numeric(10,2),
          operador_abertura text,
          operador_fechamento text,
          observacoes text,
          clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          UNIQUE(data, clinica_id)
        );
      `
    })

    if (createError && !createError.message.includes('already exists')) {
      throw createError
    }

    // Enable RLS
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE public.caixa_diario ENABLE ROW LEVEL SECURITY;'
    })

    // Create RLS Policy
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Clinica acessa caixa_diario" ON public.caixa_diario
          FOR ALL
          USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
      `
    })

    // Create Index
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_caixa_diario_data_clinica
          ON public.caixa_diario(data, clinica_id);
      `
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Database initialized' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
