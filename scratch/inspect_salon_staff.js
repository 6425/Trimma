import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSalonStaff() {
  console.log("🔄 Querying public.salon_staff schema...");
  
  const { data, error } = await supabase.from('salon_staff').select('*').limit(1);
  if (error) {
    console.error("❌ ERROR SELECTING FROM salon_staff:", error);
  } else {
    console.log("✅ Success! Sample record from salon_staff:", data);
  }
}

inspectSalonStaff();
