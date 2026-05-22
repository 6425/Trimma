const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function testUpload() {
  const dummyBlob = new Blob(["test"], { type: 'text/plain' });
  const { data, error } = await supabase.storage.from('staff-avatars').upload('test.txt', dummyBlob);
  console.log("Upload test result:", error || "Success");
}

testUpload();
