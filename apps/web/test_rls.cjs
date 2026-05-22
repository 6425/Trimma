const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);
supabase.rpc('get_policies').then(console.log).catch(console.error);

// Wait, the rpc might not exist. Better to query pg_policies.
// You can't query pg_policies via standard supabase-js unless it's exposed.
// Let's use the postgres connection string if available, or just create an edge function/sql file.
