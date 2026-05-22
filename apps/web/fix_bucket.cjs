const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function fixBucket() {
  // Try to create the bucket via the API to force cache update
  const { data, error } = await supabase.storage.createBucket('staff-avatars', {
    public: true
  });
  console.log("Create Bucket via API:", data, error);
}

fixBucket();
