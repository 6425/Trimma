import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve('apps/web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching existing subscription plans...");
  
  const { data: plans, error: fetchError } = await supabase
    .from('subscription_plans')
    .select('*');
    
  if (fetchError) {
    console.error("Error fetching plans:", fetchError);
    process.exit(1);
  }
  
  console.log(`Found ${plans.length} plans. Updating feature lists...`);
  
  const requiredFeatures = [
    "Staff Management",
    "FB/WA Integration",
    "Free Gmail Integration",
    "Free Google Business Page",
    "Performance Insights",
    "Salon Dashboard with QR",
    "Personalized Support"
  ];
  
  for (const plan of plans) {
    const flags = plan.feature_flags || {};
    flags.features = requiredFeatures;
    
    const { error: updateError } = await supabase
      .from('subscription_plans')
      .update({ feature_flags: flags })
      .eq('id', plan.id);
      
    if (updateError) {
      console.error(`Failed to update plan ${plan.name}:`, updateError);
    } else {
      console.log(`Successfully updated plan: ${plan.name}`);
    }
  }
  
  console.log("All updates completed.");
}

run();
