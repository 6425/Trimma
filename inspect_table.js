import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAgents() {
  console.log("🔄 Querying public.agents schema...");
  
  // 1. Try selecting everything (*)
  const { data: selectAll, error: errAll } = await supabase.from('agents').select('*').limit(1);
  console.log("SELECT * Response:", { data: selectAll, error: errAll });

  // 2. Try selecting only specific columns we want
  const { data: selectCols, error: errCols } = await supabase.from('agents').select('user_email, status, commission_rate').limit(1);
  console.log("SELECT cols Response:", { data: selectCols, error: errCols });
}

inspectAgents();
