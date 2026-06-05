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

const prefixes = [
  'AMAL@TRI', 'ANU1@TRI', 'CARD_PAY', 'COL1@TRI', 'COL2@TIM', 'COL3@TRI', 
  'DMB1@TRI', 'GAM1@TRI', 'GAM2@TRI', 'GAM3@TRI', 'GLE1@TRI', 'GLE2@TRI', 
  'GLE3@TRI', 'GUEST_CH', 'KDY1@TRI', 'KDY2@TRI', 'KDY3@TRI', 'KEG1@TRI', 
  'MOVI@TRI', 'MTL1@TRI', 'NUE@TRIM', 'TEST_AUT', 'TEST_DUM', 'TEST@EXA', 
  'WARUNA@G'
].map(p => p.toLowerCase());

async function run() {
  // Get public.users
  const { data: publicUsers } = await supabase.from('users').select('*');
  
  // Get auth.users
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

  const toDeleteEmails = new Set();
  
  publicUsers.forEach(u => {
    for (const p of prefixes) {
      if (u.email && u.email.toLowerCase().startsWith(p)) {
        toDeleteEmails.add(u.email.toLowerCase());
      }
    }
  });

  authUsers.forEach(u => {
    for (const p of prefixes) {
      if (u.email && u.email.toLowerCase().startsWith(p)) {
        toDeleteEmails.add(u.email.toLowerCase());
      }
    }
  });

  console.log("=== EMAILS TO DELETE ===");
  Array.from(toDeleteEmails).forEach(email => console.log(email));

  const duplicates = {};
  authUsers.forEach(u => {
    const email = u.email ? u.email.toLowerCase() : '';
    if (email) {
      if (!duplicates[email]) duplicates[email] = [];
      duplicates[email].push(u.id);
    }
  });

  console.log("\n=== AUTH.USERS DUPLICATES ===");
  for (const [email, ids] of Object.entries(duplicates)) {
    if (ids.length > 1) {
      console.log(`${email}: ${ids.join(', ')}`);
    }
  }
}

run();
