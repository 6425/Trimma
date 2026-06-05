require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const emailsToDelete = [
  "ruchika.siiriyaoatabandi@gmail.com",
  "thusitha.jayalath@sysenact.com",
  "skiruba56+trimma@gmail.com"
].map(e => e.toLowerCase());

async function run() {
  console.log("Fetching auth.users to resolve UUIDs...");
  let authUsers = [];
  let page = 1;
  while(true) {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 1000
    });
    if (authError || !authData || !authData.users || authData.users.length === 0) break;
    authUsers = authUsers.concat(authData.users);
    page++;
  }

  const idsToDelete = authUsers
    .filter(u => u.email && emailsToDelete.includes(u.email.toLowerCase()))
    .map(u => u.id);

  console.log(`Found ${idsToDelete.length} matching UUIDs in auth.users.`);

  // 1. Delete from auth.users via Admin API
  let authDeletedCount = 0;
  for (const id of idsToDelete) {
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`Failed to delete auth user ${id}:`, error);
    } else {
      authDeletedCount++;
    }
  }
  console.log(`Successfully deleted ${authDeletedCount} accounts from auth.users.`);

  // 2. Explicitly delete from public.users (just in case cascade wasn't set up)
  const { data, error, count } = await supabase
    .from('users')
    .delete({ count: 'exact' })
    .in('email', emailsToDelete);
    
  if (error) {
    console.error("Error deleting from public.users:", error);
  } else {
    console.log(`Successfully deleted ${count || 0} profiles from public.users.`);
  }

  console.log("Duplicate deletion process complete.");
}

run();
