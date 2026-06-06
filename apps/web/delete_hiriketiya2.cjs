const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://whxmyfjlrvyjqbmqhnzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG15ZmpscnZ5anFibXFobnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwMzM0MSwiZXhwIjoyMDk0NDc5MzQxfQ.v3yUrGXzo_KqFVekY9KCU7IsVsolKQXavbsxV2BDXyQ';
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
