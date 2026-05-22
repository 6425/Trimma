const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const anonKey = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].replace(/"/g, '');
const serviceKey = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');

fetch('https://whxmyfjlrvyjqbmqhnzd.supabase.co/rest/v1/salons?select=id,name,owner_gmail,assign_to,phone,onboarding_status', { 
  headers: { 
    apikey: anonKey, 
    Authorization: 'Bearer ' + serviceKey 
  } 
})
.then(r => r.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(console.error);
