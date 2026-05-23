import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: "ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check; ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'reservation_paid', 'paid', 'refunded', 'pending', 'failed'));"
  });
  if (error) {
    console.error("RPC failed:", error.message);
  } else {
    console.log("Success");
  }
}
fix();
