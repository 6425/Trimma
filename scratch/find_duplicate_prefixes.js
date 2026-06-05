require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const idCounts = {};
  for (const u of users) {
    if (!u.email) continue;
    const shortId = u.email.substring(0, 8).toUpperCase();
    if (!idCounts[shortId]) {
      idCounts[shortId] = [];
    }
    idCounts[shortId].push(u);
  }

  const duplicates = [];
  for (const [id, groupedUsers] of Object.entries(idCounts)) {
    if (groupedUsers.length > 1) {
      duplicates.push({ id, users: groupedUsers });
    }
  }

  if (duplicates.length === 0) {
    console.log("No duplicate 8-character IDs found.");
  } else {
    console.log(`Found ${duplicates.length} duplicate 8-character IDs:\n`);
    for (const d of duplicates) {
      console.log(`ID: ${d.id} (${d.users.length} users)`);
      d.users.forEach(u => console.log(`  - ${u.email} (created: ${u.created_at})`));
      console.log('');
    }
  }
}

run();
