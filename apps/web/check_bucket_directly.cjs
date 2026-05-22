const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function checkBucketDirectly() {
  const { data, error } = await supabase.from('buckets').select('*').limit(1); // Wait, storage is not public schema.
  // let's use the REST API via RPC if possible or just fetch via REST using the schema header.
  const res = await fetch(`${url}/rest/v1/buckets`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Accept-Profile': 'storage'
    }
  });
  console.log(await res.json());
}

checkBucketDirectly();
