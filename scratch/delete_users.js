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
  "anu1@trima.lk",
  "col2@timma.lk",
  "col3@trima.lk",
  "dmb1@trima.lk",
  "gam2@trima.lk",
  "gam3@trima.lk",
  "gle1@trima.lk",
  "amal@trimma.io",
  "gle2@trima.lk",
  "gle3@trima.lk",
  "test_dummy_user_123@trimma.io",
  "kdy1@trima.lk",
  "kdy2@trima.lk",
  "kdy3@trima.lk",
  "keg1@trima.lk",
  "mtl1@trima.lk",
  "nue@trima.lk",
  "test@example.com",
  "waruna@gmail.com",
  "guest_checkout@example.com",
  "card_pay_guest@example.com",
  "movi@trimma.com",
  "gam1@trima.lk",
  "test_auth_123@example.com",
  "col1@trimma.lk"
];

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

  console.log("Deletion process complete.");
}

run();
