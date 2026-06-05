const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function createBuckets() {
  const { data: salonImagesData, error: salonImagesError } = await supabase.storage.createBucket('salon-images', {
    public: true,
    fileSizeLimit: 20971520, // 20 MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  });
  console.log("Create 'salon-images' Bucket:", salonImagesData, salonImagesError);

  const { data: staffData, error: staffError } = await supabase.storage.createBucket('staff-avatars', {
    public: true,
    fileSizeLimit: 10485760, // 10 MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  });
  console.log("Create 'staff-avatars' Bucket:", staffData, staffError);
}

createBuckets();
