const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function reloadSchemaCache() {
  const { data, error } = await supabase.rpc('reload_schema_cache');
  if (error) {
    console.log("RPC fail, trying raw query...", error);
    // Alternatively, we can just fetch some data that forces a cache check, or tell the user.
    // Let's just try to insert a dummy query or see if the column exists.
    const { data: cols, error: colErr } = await supabase.from('salon_staff').select('avatar_url').limit(1);
    console.log("Column check:", colErr || "Success!");
  } else {
    console.log("Schema cache reloaded:", data);
  }
}

reloadSchemaCache();
