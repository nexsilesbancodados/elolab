import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

/**
 * Executa migrações necessárias no banco de dados
 * Chamado na inicialização da aplicação
 */
export async function initializeDatabase() {
  try {
    const { error: checkError } = await db
      .from('caixa_diario')
      .select('id')
      .limit(1);

    if (checkError?.message?.includes('does not exist') || checkError?.message?.includes('not found in the schema')) {
      console.warn('Tabela caixa_diario não encontrada. Executando migração...');
      return false;
    }

    console.log('✓ Database initialized');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    return false;
  }
}
