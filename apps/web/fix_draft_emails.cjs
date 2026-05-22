const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'services' });
  console.log(data, error);
}

// Since I can't guarantee rpc exists, let's just forcefully replace owner_email if owner_gmail exists and owner_email starts with "draft-"
async function fixDraftEmails() {
  const { data: salons } = await supabase
    .from('salons')
    .select('id, owner_email, owner_gmail')
    .not('owner_gmail', 'is', null)
    .like('owner_email', 'draft-%');

  console.log('Salons with draft emails to fix:', salons?.length);

  if (salons) {
    for (const s of salons) {
      await supabase.from('salons').update({ owner_email: s.owner_gmail }).eq('id', s.id);
      console.log(`Updated ${s.id} to ${s.owner_gmail}`);
    }
  }
}

fixDraftEmails();
