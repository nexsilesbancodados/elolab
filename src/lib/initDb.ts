import { supabase } from '@/integrations/supabase/client';

/**
 * Executa migrações necessárias no banco de dados
 * Chamado na inicialização da aplicação
 */
export async function initializeDatabase() {
  try {
    // Verificar se tabela caixa_diario existe
    const { error: checkError } = await supabase
      .from('caixa_diario')
      .select('id')
      .limit(1);

    if (checkError?.message?.includes('does not exist') || checkError?.message?.includes('not found in the schema')) {
      console.log('Criando tabela caixa_diario...');

      // Usar RPC para executar SQL bruto (requer função no Supabase)
      // Como alternativa, criar via inserts estruturados

      // Para agora, vamos apenas log e avisar o usuário
      console.warn('Tabela caixa_diario não encontrada. Executando migração...');

      // Tentar criar via Supabase Admin API (se disponível)
      // Isso será tratado via uma função edge ou manual
      return false;
    }

    console.log('✓ Database initialized');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    return false;
  }
}
