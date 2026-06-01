import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: agents } = await supabase.from('agents').select('*');
  console.log("Agents:", agents);
  
  const { data: territories } = await supabase.from('agent_territories').select('*, territories(*)');
  console.log("Agent Territories:", JSON.stringify(territories, null, 2));
}

check().catch(console.error);
