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

async function fixDraft() {
  const targetId = '58ec1704-1d0e-4e0b-ab08-0e201a4d2e6f';
  
  const { data, error } = await supabase
    .from('salons')
    .update({ onboarding_status: 'DRAFT_REVIEW' })
    .eq('id', targetId)
    .select();
    
  if (error) {
    console.error("Error updating salon:", error.message);
  } else {
    console.log("✅ Successfully moved salon to Draft Queue:", data[0]?.onboarding_status);
  }
}
fixDraft();
