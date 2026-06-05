require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Fallback to .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: packages, error } = await supabase
    .from("salon_promotion_packages")
    .select("id, name, salon_id, status, start_date, end_date")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching packages:", error);
    return;
  }

  console.log("Found", packages?.length, "packages");
  
  const salonIds = [...new Set(packages.map((pkg) => pkg.salon_id).filter(Boolean))];
  
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, status, is_verified, public_visibility")
    .in("id", salonIds);

  const salonsById = new Map((salons || []).map((s) => [s.id, s]));

  for (const pkg of packages) {
    const salon = salonsById.get(pkg.salon_id);
    let reason = "";
    
    if (pkg.status !== 'active') reason += "Package not active. ";
    if (!salon) reason += "Salon missing. ";
    else {
        if (!salon.slug) reason += "Salon missing slug. ";
        if (salon.public_visibility === 'hidden') reason += "Salon hidden. ";
        if (!(salon.status === 'active' || salon.status === 'verified' || salon.is_verified === true)) {
            reason += `Salon not publicly visible (status=${salon.status}, is_verified=${salon.is_verified}). `;
        }
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (pkg.start_date && today < pkg.start_date.split('T')[0]) reason += "Not started yet. ";
    if (pkg.end_date && today > pkg.end_date.split('T')[0]) reason += "Expired. ";

    console.log(`Package: ${pkg.name} | Status: ${pkg.status} | Salon: ${salon?.name || 'N/A'}`);
    if (reason) {
        console.log(`  -> Filtered out because: ${reason}`);
    } else {
        console.log(`  -> Valid & Active`);
    }
  }
}

run();
