const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://whxmyfjlrvyjqbmqhnzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG15ZmpscnZ5anFibXFobnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwMzM0MSwiZXhwIjoyMDk0NDc5MzQxfQ.v3yUrGXzo_KqFVekY9KCU7IsVsolKQXavbsxV2BDXyQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const idsToDelete = [
    'dc100422-ec17-4999-baa6-48c95d3523d9', // sharetravellerlk@gmail.com
    '6d0b1f3c-3a6b-4f50-8675-1617e3951b68'  // trimhublk@gmail.com
  ];

  for (const id of idsToDelete) {
    console.log(`Deleting user ${id}...`);
    
    // Delete from public.users first to avoid FK constraints if any
    const { error: pubErr } = await supabase.from('users').delete().eq('email', id === idsToDelete[0] ? 'sharetravellerlk@gmail.com' : 'trimhublk@gmail.com');
    if (pubErr) console.error(`Error deleting from public.users for ${id}:`, pubErr);
    else console.log(`Deleted from public.users for ${id}`);

    // Delete from auth.users
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`Error deleting auth user ${id}:`, error);
    } else {
      console.log(`Deleted auth user ${id} successfully.`);
    }
  }

  // Also clear any salons owned by these emails so onboarding is completely fresh
  const emails = ['sharetravellerlk@gmail.com', 'trimhublk@gmail.com'];
  for (const email of emails) {
    const { error: salonErr } = await supabase.from('salons').delete().or(`owner_email.eq.${email},owner_gmail.eq.${email}`);
    if (salonErr) console.error(`Error deleting salons for ${email}:`, salonErr);
    else console.log(`Deleted salons for ${email}`);
  }
}

run();
