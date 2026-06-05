const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const url = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const key = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim().replace(/\"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function applyPolicies() {
  const sql = `
    -- Policies for salon-images
    DROP POLICY IF EXISTS "Public read salon-images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated upload salon-images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated update salon-images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated delete salon-images" ON storage.objects;

    CREATE POLICY "Public read salon-images" ON storage.objects FOR SELECT USING (bucket_id = 'salon-images');
    CREATE POLICY "Authenticated upload salon-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'salon-images');
    CREATE POLICY "Authenticated update salon-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'salon-images') WITH CHECK (bucket_id = 'salon-images');
    CREATE POLICY "Authenticated delete salon-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'salon-images');

    -- Policies for staff-avatars
    DROP POLICY IF EXISTS "Public read staff-avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated upload staff-avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated update staff-avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated delete staff-avatars" ON storage.objects;

    CREATE POLICY "Public read staff-avatars" ON storage.objects FOR SELECT USING (bucket_id = 'staff-avatars');
    CREATE POLICY "Authenticated upload staff-avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'staff-avatars');
    CREATE POLICY "Authenticated update staff-avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'staff-avatars') WITH CHECK (bucket_id = 'staff-avatars');
    CREATE POLICY "Authenticated delete staff-avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'staff-avatars');
  `;

  // We can't execute raw SQL easily from supabase-js unless we use an RPC.
  // Instead, let's create an RPC or execute this with psql.
}

applyPolicies();
