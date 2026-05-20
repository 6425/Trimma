import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearLeads() {
  console.log("Connecting to Supabase...");
  
  // Deletes all rows by checking for any non-null created_at timestamp
  const { error } = await supabase
    .from('salon_leads')
    .delete()
    .gt('created_at', '1970-01-01T00:00:00Z');
  
  if (error) {
    console.error("Error clearing salon_leads:", error);
  } else {
    console.log("SUCCESS: Successfully cleared all salon_leads records!");
  }
}

clearLeads();
