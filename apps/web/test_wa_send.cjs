const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const anonKey = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');
const serviceKey = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');
const supabaseUrl = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].replace(/"/g, '').replace('\r', '');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey);

async function sendTestMessage() {
  const { data, error } = await supabase
    .from('global_payment_settings')
    .select('whatsapp_phone_number_id, whatsapp_access_token, whatsapp_onboarding_invite_enabled, whatsapp_template_onboarding_invite')
    .single();

  if (!data || !data.whatsapp_phone_number_id) return;

  const targetPhone = "94717597759"; // Using the salon's phone number
  const testMessage = `Hi! This is a direct test from the Trimma app backend to verify Sandbox delivery.`;

  console.log(`Sending test payload to ${targetPhone}...`);
  
  const response = await fetch(`https://graph.facebook.com/v18.0/${data.whatsapp_phone_number_id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${data.whatsapp_access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: targetPhone,
      type: "text",
      text: {
        preview_url: false,
        body: testMessage,
      },
    }),
  });

  const resData = await response.json();
  console.log("Send Message Response:", JSON.stringify(resData, null, 2));
}

sendTestMessage();
