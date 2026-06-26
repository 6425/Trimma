const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('provinces').select('*');
  console.log("Provinces in DB:", data);
}

check();
