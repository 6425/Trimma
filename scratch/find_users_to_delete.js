require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const prefixes = [
  'AMAL@TRI', 'ANU1@TRI', 'CARD_PAY', 'COL1@TRI', 'COL2@TIM', 'COL3@TRI', 
  'DMB1@TRI', 'GAM1@TRI', 'GAM2@TRI', 'GAM3@TRI', 'GLE1@TRI', 'GLE2@TRI', 
  'GLE3@TRI', 'GUEST_CH', 'KDY1@TRI', 'KDY2@TRI', 'KDY3@TRI', 'KEG1@TRI', 
  'MOVI@TRI', 'MTL1@TRI', 'NUE@TRIM', 'TEST_AUT', 'TEST_DUM', 'TEST@EXA', 
  'WARUNA@G'
].map(p => p.toLowerCase());

async function run() {
  const { data: allUsers, error } = await supabase.from('users').select('*');
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const toDeleteByPrefix = [];
  const emailCounts = {};
  const duplicates = [];

  for (const u of allUsers) {
    const email = u.email || '';
    
    // Check prefixes
    for (const p of prefixes) {
      if (email.toLowerCase().startsWith(p)) {
        toDeleteByPrefix.push(u);
        break; // matched one prefix
      }
    }

    // Check duplicates
    if (!emailCounts[email]) {
      emailCounts[email] = [u];
    } else {
      emailCounts[email].push(u);
    }
  }

  for (const [email, users] of Object.entries(emailCounts)) {
    if (users.length > 1) {
      duplicates.push({ email, count: users.length, users });
    }
  }

  console.log("=== USERS MATCHING PREFIXES ===");
  toDeleteByPrefix.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));

  console.log("\n=== DUPLICATE USERS ===");
  duplicates.forEach(d => {
    console.log(`Email: ${d.email} (${d.count} copies)`);
    d.users.forEach(u => console.log(`  - ID: ${u.id}, Created: ${u.created_at}`));
  });
}

run();
