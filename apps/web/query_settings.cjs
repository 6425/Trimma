const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const anonKey = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].replace(/"/g, '');
const serviceKey = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/"/g, '').replace('\r', '');

fetch('https://whxmyfjlrvyjqbmqhnzd.supabase.co/rest/v1/global_payment_settings?select=*', { 
  headers: { 
    apikey: anonKey, 
    Authorization: 'Bearer ' + serviceKey 
  } 
})
.then(r => r.json())
.then(data => {
  console.log(JSON.stringify(data[0] ? Object.keys(data[0]) : [], null, 2));
})
.catch(console.error);
