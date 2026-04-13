import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gebygucrpipaufrlyqqj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data, error } = await supabase
  .from('notification_templates')
  .select('categoria, nome')
  .limit(20);

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Existing templates:');
  data.forEach(t => console.log(`- ${t.categoria}: ${t.nome}`));
}
