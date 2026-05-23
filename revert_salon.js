import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function revert() {
  const targetId = '58ec1704-1d0e-4e0b-ab08-0e201a4d2e6f';
  
  const { data, error } = await supabase
    .from('salons')
    .update({ onboarding_status: 'ASSIGNED_TO_AGENT' })
    .eq('id', targetId)
    .select();
    
  if (error) {
    console.error("Error reverting salon:", error.message);
  } else {
    console.log("✅ Successfully reverted salon status:", data[0]?.onboarding_status);
  }
}
revert();
