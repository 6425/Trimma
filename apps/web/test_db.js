const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://whxmyfjlrvyjqbmqhnzd.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG15ZmpscnZ5anFibXFobnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwMzM0MSwiZXhwIjoyMDk0NDc5MzQxfQ.v3yUrGXzo_KqFVekY9KCU7IsVsolKQXavbsxV2BDXyQ";

const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('provinces').select('*');
  console.log("Provinces in DB:", data);
}

check();
