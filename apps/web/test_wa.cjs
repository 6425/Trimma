const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const anonKey = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');
const serviceKey = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');
const supabaseUrl = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].replace(/"/g, '').replace('\r', '');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey);

async function testWA() {
  const { data, error } = await supabase
    .from('global_payment_settings')
    .select('whatsapp_phone_number_id, whatsapp_access_token, whatsapp_onboarding_invite_enabled, whatsapp_template_onboarding_invite')
    .single();

  console.log("DB Data:", data);
  if (error) console.log("Error:", error);

  if (!data || !data.whatsapp_phone_number_id) {
    console.log("No WA credentials found in DB.");
    return;
  }

  // Try sending a test message to a safe number, or just check the config
  console.log("Credentials exist. Checking Meta Graph API...");
  
  const response = await fetch(`https://graph.facebook.com/v18.0/${data.whatsapp_phone_number_id}`, {
    headers: {
      "Authorization": `Bearer ${data.whatsapp_access_token}`
    }
  });

  const resData = await response.json();
  console.log("Meta Graph API Response:", resData);
}

testWA();
