import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Connecting to:", supabaseUrl);
  // Let's do a select * on bookings limit 1
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (error) {
    console.error("Error fetching bookings:", error);
  } else {
    console.log("Success! Columns:", data.length > 0 ? Object.keys(data[0]) : "No rows found");
    console.log("Sample Row:", data[0]);
  }
}

inspect();
