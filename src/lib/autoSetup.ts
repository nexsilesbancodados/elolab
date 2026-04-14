import { supabase } from '@/integrations/supabase/client';

/**
 * Auto-setup: Verifica e cria tabelas necessárias automaticamente
 * Executado na inicialização da aplicação
 */

const MIGRATIONS = [
  {
    name: 'caixa_diario',
    check: 'SELECT 1 FROM information_schema.tables WHERE table_name = \'caixa_diario\'',
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
  {
    name: 'laboratorios',
    check: 'SELECT 1 FROM public.laboratorios LIMIT 1',
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
  {
    name: 'tipo_exames_catalog',
    check: 'SELECT 1 FROM public.tipo_exames_catalog LIMIT 1',
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
];

export async function autoSetupDatabase() {
  try {
    console.log('🔄 Verificando banco de dados...');

    for (const migration of MIGRATIONS) {
      try {
        // Tenta verificar se a tabela existe
        const { error } = await supabase
          .from(migration.name === 'caixa_diario' ? 'caixa_diario' :
                 migration.name === 'laboratorios' ? 'laboratorios' : 'tipo_exames_catalog')
          .select('id')
          .limit(1);

        if (error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
          console.log(`⚠️  ${migration.name} não encontrada, criando...`);

          // Chamar função edge para criar
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-migrate`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${(supabase.auth.session())?.access_token || ''}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              console.log(`✅ ${migration.name} criada com sucesso`);
            } else {
              console.warn(`⚠️  Não foi possível criar ${migration.name} automaticamente`);
            }
          } catch (err) {
            console.warn(`⚠️  Erro ao criar ${migration.name}:`, err);
          }
        } else {
          console.log(`✅ ${migration.name} já existe`);
        }
      } catch (err) {
        console.warn(`⚠️  Erro ao verificar ${migration.name}:`, err);
      }
    }

    console.log('✅ Setup do banco de dados concluído');
    return true;
  } catch (error) {
    console.error('❌ Erro no setup automático:', error);
    return false;
  }
}
