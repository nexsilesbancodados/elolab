import { supabase } from '@/integrations/supabase/client';

/**
 * Auto-setup: Verifica e cria tabelas necessárias automaticamente
 * Executado na inicialização da aplicação
 */

const db = supabase as any;

const TABLE_NAMES = ['caixa_diario', 'laboratorios', 'tipo_exames_catalog'] as const;

export async function autoSetupDatabase() {
  try {
    console.log('🔄 Verificando banco de dados...');

    for (const tableName of TABLE_NAMES) {
      try {
        const { error } = await db
          .from(tableName)
          .select('id')
          .limit(1);

        if (error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
          console.log(`⚠️  ${tableName} não encontrada, criando...`);

          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-migrate`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              console.log(`✅ ${tableName} criada com sucesso`);
            } else {
              console.warn(`⚠️  Não foi possível criar ${tableName} automaticamente`);
            }
          } catch (err) {
            console.warn(`⚠️  Erro ao criar ${tableName}:`, err);
          }
        } else {
          console.log(`✅ ${tableName} já existe`);
        }
      } catch (err) {
        console.warn(`⚠️  Erro ao verificar ${tableName}:`, err);
      }
    }

    console.log('✅ Setup do banco de dados concluído');
    return true;
  } catch (error) {
    console.error('❌ Erro no setup automático:', error);
    return false;
  }
}
