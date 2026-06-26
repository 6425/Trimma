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
  
  console.log(`Starting deletion process for ${email}...`);

  // 1. Delete Salons
  console.log('Deleting salons...');
  const { error: salonErr } = await supabase.from('salons').delete().or(`owner_email.eq.${email},owner_gmail.eq.${email}`);
  if (salonErr) console.error('Error deleting salons:', salonErr);
  else console.log('Salons deleted successfully.');

  // 2. Delete Leads
  console.log('Deleting leads...');
  const { error: leadErr } = await supabase.from('leads').delete().or(`owner_email.eq.${email},owner_gmail.eq.${email}`);
  if (leadErr) console.error('Error deleting leads:', leadErr);
  else console.log('Leads deleted successfully.');

  // 3. Get Auth User ID from public.users
  console.log('Fetching user ID...');
  const { data: user, error: userErr } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  
  if (userErr) {
    console.error('Error fetching user ID:', userErr);
  } else if (user) {
    const id = user.id;
    console.log(`Found user ID: ${id}`);
    
    // 4. Delete from Auth
    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (authErr) console.error('Error deleting from auth:', authErr);
    else console.log('Deleted from Auth successfully.');
  } else {
    console.log('User not found in public.users. Checking auth directly by listing users...');
  }

  // 5. Delete from public.users
  console.log('Deleting from public.users...');
  const { error: pubErr } = await supabase.from('users').delete().eq('email', email);
  if (pubErr) console.error('Error deleting from public.users:', pubErr);
  else console.log('Deleted from public.users successfully.');

  console.log('Done!');
}

run();
