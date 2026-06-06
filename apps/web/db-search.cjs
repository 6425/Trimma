const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://whxmyfjlrvyjqbmqhnzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG15ZmpscnZ5anFibXFobnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwMzM0MSwiZXhwIjoyMDk0NDc5MzQxfQ.v3yUrGXzo_KqFVekY9KCU7IsVsolKQXavbsxV2BDXyQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check auth.users
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) console.error('user error', userErr);
  else {
    const matchedUsers = users.users.filter(u => 
      JSON.stringify(u).toLowerCase().includes('trimhubl') || JSON.stringify(u).toLowerCase().includes('sharetra')
    );
    console.log('Matched Auth Users:', matchedUsers.map(u => ({ id: u.id, email: u.email })));
  }

  // Check public.users
  const { data: pubUsers, error: pubErr } = await supabase.from('users').select('*');
  if (pubErr) console.error('pub error', pubErr);
  else {
    const matchedPub = pubUsers.filter(u => 
      JSON.stringify(u).toLowerCase().includes('trimhubl') || JSON.stringify(u).toLowerCase().includes('sharetra')
    );
    console.log('Matched Public Users:', matchedPub);
  }

  // Check salons
  const { data: salons, error: salonErr } = await supabase.from('salons').select('*');
  if (salonErr) console.error('salon error', salonErr);
  else {
    const matchedSalons = salons.filter(s => 
      JSON.stringify(s).toLowerCase().includes('trimhubl') || JSON.stringify(s).toLowerCase().includes('sharetra')
    );
    console.log('Matched Salons:', matchedSalons);
  }
}

run();
