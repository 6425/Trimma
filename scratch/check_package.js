const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackage() {
  const { data: packages, error } = await supabase
    .from('salon_promotion_packages')
    .select('*')
    .ilike('name', '%Glow Package%');

  if (error) {
    console.error('Error fetching package:', error);
    return;
  }

  console.log('Packages found:', JSON.stringify(packages, null, 2));

  if (packages && packages.length > 0) {
    for (const pkg of packages) {
      console.log(`\nChecking salon for package ${pkg.id} (Salon ID: ${pkg.salon_id})`);
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('id', pkg.salon_id)
        .single();
      
      if (salonError) {
        console.error('Error fetching salon:', salonError);
      } else {
        console.log('Salon details:', JSON.stringify(salon, null, 2));
      }
    }
  }

  // Also check top deals logic
  const { data: activePackages, error: activeErr } = await supabase
    .from('salon_promotion_packages')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!activeErr && activePackages) {
    console.log(`\nTotal active packages: ${activePackages.length}`);
    activePackages.forEach(p => {
        let discount = 0;
        if (p.original_price > 0 && p.original_price > p.package_price) {
            discount = Math.round(((p.original_price - p.package_price) / p.original_price) * 100);
        }
        console.log(`Package: ${p.name}, Price: ${p.package_price}, Original: ${p.original_price}, Discount: ${discount}%`);
    });
  }
}

checkPackage();
