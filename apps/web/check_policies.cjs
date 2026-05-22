const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'objects', schema_name: 'storage' });
  if (error) {
    // If rpc doesn't exist, we can use raw query
    const { data: p, error: pe } = await supabase.from('pg_policies').select('*').eq('schemaname', 'storage').eq('tablename', 'objects');
    console.log(p || pe);
  } else {
    console.log(data);
  }
}

checkPolicies();
