import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gebygucrpipaufrlyqqj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tenta inserir com clinica_id NULL (como no SQL original)
const template1 = {
  categoria: 'confirmacao_consulta',
  tipo: 'email',
  nome: 'Confirmação de Consulta',
  assunto: 'Sua consulta foi confirmada - {{clinica_nome}}',
  conteudo: '<test>',
  variaveis: ['paciente_nome'],
  ativo: true,
  clinica_id: null,
};

const { data, error } = await supabase
  .from('notification_templates')
  .insert([template1])
  .select();

if (error) {
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Full error:', JSON.stringify(error, null, 2));
} else {
  console.log('Success:', data);
}
