import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = ['bookings', 'appointments', 'salons', 'salon_leads', 'users', 'commission_ledger'];
  console.log("Checking tables...");
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(3);
    if (error) {
      console.log(`❌ Table ${t} error:`, error.message);
    } else {
      console.log(`✅ Table ${t} exists. Sample:`, data);
    }
  }
}

inspect();
