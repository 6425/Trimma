const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const supabase = createClient(url, key);
async function run() {
  const { data } = await supabase.from('salons').select('working_hours').limit(1);
  console.log(typeof data[0].working_hours, data[0].working_hours);
}
run();
