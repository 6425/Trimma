const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function checkServices() {
  const { data: salons } = await supabase
    .from('salons')
    .select('id, owner_email, owner_gmail')
    .eq('owner_gmail', 'ceylonwildtourslk@gmail.com');

  console.log('Salons for ceylonwildtourslk@gmail.com (by owner_gmail):', salons);
  
  if (salons && salons.length > 0) {
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salons[0].id);
      
    console.log(`Found ${services?.length || 0} services.`);
  }
}

checkServices();
