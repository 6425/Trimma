const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'hiriketiyadiving@gmail.com';
  
  console.log(`Starting Auth deletion process for ${email}...`);

  // List auth users
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  
  if (listErr) {
    console.error('Error listing auth users:', listErr);
    return;
  }

  const user = users.find(u => u.email === email);
  if (user) {
    console.log(`Found auth user ID: ${user.id}`);
    
    // Delete from Auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
    if (authErr) console.error('Error deleting from auth:', authErr);
    else console.log('Deleted from Auth successfully.');
  } else {
    console.log('User not found in Auth database.');
  }

  console.log('Done!');
}

run();
