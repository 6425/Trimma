const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function forceRecreate() {
  console.log("Emptying bucket...");
  const { data: eData, error: eError } = await supabase.storage.emptyBucket('staff-avatars');
  console.log("Empty result:", eData, eError);

  console.log("Deleting bucket...");
  const { data: dData, error: dError } = await supabase.storage.deleteBucket('staff-avatars');
  console.log("Delete result:", dData, dError);

  console.log("Recreating bucket...");
  const { data: cData, error: cError } = await supabase.storage.createBucket('staff-avatars', {
    public: true
  });
  console.log("Create result:", cData, cError);
}

forceRecreate();
