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

async function check() {
  const targetId = '58ec1704-1d0e-4e0b-ab08-0e201a4d2e6f';
  
  // Check if it's a salon
  const { data: salon } = await supabase.from('salons').select('*').eq('id', targetId).single();
  if (salon) {
    console.log("It's a SALON:", salon);
    return;
  }
  
  // Check if it's a booking
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', targetId).single();
  if (booking) {
    console.log("It's a BOOKING:", booking);
    return;
  }
  
  // Check leads
  const { data: lead } = await supabase.from('leads').select('*').eq('id', targetId).single();
  if (lead) {
    console.log("It's a LEAD:", lead);
    return;
  }

  console.log("UUID not found in salons, bookings, or leads");
}
check();
