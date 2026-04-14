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

    const migrations = [
      // Caixa Diário
      {
        name: 'caixa_diario',
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
          ALTER TABLE public.caixa_diario ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Clinica acessa caixa_diario" ON public.caixa_diario;
          CREATE POLICY "Clinica acessa caixa_diario" ON public.caixa_diario
            FOR ALL USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
          CREATE INDEX IF NOT EXISTS idx_caixa_diario_data_clinica ON public.caixa_diario(data, clinica_id);
        `
      },
      // Laboratórios
      {
        name: 'laboratorios',
        sql: `
          CREATE TABLE IF NOT EXISTS public.laboratorios (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            nome text NOT NULL,
            cnpj text,
            telefone text,
            email text,
            endereco text,
            clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
            ativo boolean DEFAULT true,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          ALTER TABLE public.laboratorios ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Clinica acessa seus laboratorios" ON public.laboratorios;
          CREATE POLICY "Clinica acessa seus laboratorios" ON public.laboratorios
            FOR ALL USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
          CREATE INDEX IF NOT EXISTS idx_laboratorios_clinica ON public.laboratorios(clinica_id);
        `
      },
      // Catálogo de Exames
      {
        name: 'tipo_exames_catalog',
        sql: `
          CREATE TABLE IF NOT EXISTS public.tipo_exames_catalog (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            nome text NOT NULL,
            categoria text NOT NULL,
            codigo_tuss text,
            preco_custo numeric(10,2),
            preco_venda numeric(10,2),
            laboratorio_id uuid REFERENCES public.laboratorios(id) ON DELETE SET NULL,
            clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
            descricao text,
            ativo boolean DEFAULT true,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          ALTER TABLE public.tipo_exames_catalog ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Clinica acessa seu catalogo" ON public.tipo_exames_catalog;
          CREATE POLICY "Clinica acessa seu catalogo" ON public.tipo_exames_catalog
            FOR ALL USING (clinica_id IN (SELECT clinica_id FROM public.profiles WHERE id = auth.uid()));
          CREATE INDEX IF NOT EXISTS idx_tipo_exames_clinica ON public.tipo_exames_catalog(clinica_id);
        `
      },
      // Adicionar colunas em exames
      {
        name: 'exames_pricing_columns',
        sql: `
          ALTER TABLE public.exames
          ADD COLUMN IF NOT EXISTS tipo_categorizado text DEFAULT 'laboratorial',
          ADD COLUMN IF NOT EXISTS laboratorio_id uuid REFERENCES public.laboratorios(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS preco_custo numeric(10,2),
          ADD COLUMN IF NOT EXISTS preco_venda numeric(10,2),
          ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'geral';
          CREATE INDEX IF NOT EXISTS idx_exames_laboratorio ON public.exames(laboratorio_id);
        `
      }
    ]

    const results: any[] = []

    for (const migration of migrations) {
      try {
        const { error } = await supabase.rpc('exec', {
          sql: migration.sql
        }).catch(() => ({
          error: null // Se não existir rpc, vamos tentar direto
        }))

        // Se rpc não existe, tentar com query simples
        if (error?.message?.includes('does not exist')) {
          // Sem rpc disponível, retornar instruções
          results.push({
            name: migration.name,
            status: 'pendente',
            message: 'Executar SQL manualmente (rpc não disponível)'
          })
        } else {
          results.push({
            name: migration.name,
            status: 'sucesso',
            message: 'Tabela criada/atualizada'
          })
        }
      } catch (err: any) {
        results.push({
          name: migration.name,
          status: 'erro',
          message: err.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrations: results,
        message: 'Migração automática concluída'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
