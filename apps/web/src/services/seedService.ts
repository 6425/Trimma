import { supabase } from "../config/supabase";

export const seedMarketplaceData = async () => {
  try {
    // 1. SEED PROVINCES
    const provinces = [
      { name: 'Central Province', slug: 'central-province' },
      { name: 'Eastern Province', slug: 'eastern-province' },
      { name: 'North Central Province', slug: 'north-central-province' },
      { name: 'North Western Province', slug: 'north-western-province' },
      { name: 'Northern Province', slug: 'northern-province' },
      { name: 'Sabaragamuwa Province', slug: 'sabaragamuwa-province' },
      { name: 'Southern Province', slug: 'southern-province' },
      { name: 'Uva Province', slug: 'uva-province' },
      { name: 'Western Province', slug: 'western-province' }
    ];

    const provinceData = provinces.map(p => ({ ...p, type: 'province', parent_id: null }));

    const { data: dbProvinces, error: pError } = await supabase
      .from("territories")
      .upsert(provinceData, { onConflict: 'slug' })
      .select();

    if (pError) throw pError;

    // 2. SEED CATEGORIES (Primary for Services)
    const categories = [
      { name: 'Barber Salon', slug: 'barber-salon', description: 'Traditional and modern gents grooming.' },
      { name: 'Beauty Parlours', slug: 'beauty-parlours', description: 'Complete beauty care for ladies.' },
      { name: 'Bridal & Beauty', slug: 'bridal-beauty', description: 'Premium bridal dressing and event makeup.' },
      { name: 'Nail Studio', slug: 'nail-studio', description: 'Professional nail care and art.' },
      { name: 'Skincare Clinics', slug: 'skincare-clinics', description: 'Advanced dermatological treatments.' },
      { name: 'Spa & Wellness', slug: 'spa-wellness', description: 'Relaxation and holistic body care.' },
      { name: 'Yoga Studio', slug: 'yoga-studio', description: 'Physical and mental wellness classes.' },
      { name: 'Men\'s Grooming', slug: 'mens-grooming', description: 'Executive level grooming for men.' },
      { name: 'Kids & Family', slug: 'kids-family', description: 'Salon services for children and families.' },
      { name: 'Tattoo Studio', slug: 'tattoo-studio', description: 'Custom body art and piercings.' }
    ];

    const { data: dbCategories, error: catError } = await supabase
      .from("categories")
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (catError) throw catError;

    // 3. SEED DISTRICTS (Must map to Province IDs)
    const districtData = [
      { pName: 'Western Province', name: 'Colombo', slug: 'colombo' },
      { pName: 'Western Province', name: 'Gampaha', slug: 'gampaha' },
      { pName: 'Western Province', name: 'Kalutara', slug: 'kalutara' },
      { pName: 'Central Province', name: 'Kandy', slug: 'kandy' },
      { pName: 'Central Province', name: 'Matale', slug: 'matale' },
      { pName: 'Central Province', name: 'Nuwara Eliya', slug: 'nuwara-eliya' },
      { pName: 'Southern Province', name: 'Galle', slug: 'galle' },
      { pName: 'Southern Province', name: 'Matara', slug: 'matara' },
      { pName: 'Southern Province', name: 'Hambantota', slug: 'hambantota' },
      { pName: 'Northern Province', name: 'Jaffna', slug: 'jaffna' },
      { pName: 'Northern Province', name: 'Kilinochchi', slug: 'kilinochchi' },
      { pName: 'Northern Province', name: 'Mannar', slug: 'mannar' },
      { pName: 'Northern Province', name: 'Vavuniya', slug: 'vavuniya' },
      { pName: 'Northern Province', name: 'Mullaitivu', slug: 'mullaitivu' },
      { pName: 'Eastern Province', name: 'Trincomalee', slug: 'trincomalee' },
      { pName: 'Eastern Province', name: 'Batticaloa', slug: 'batticaloa' },
      { pName: 'Eastern Province', name: 'Ampara', slug: 'ampara' },
      { pName: 'North Western Province', name: 'Kurunegala', slug: 'kurunegala' },
      { pName: 'North Western Province', name: 'Puttalam', slug: 'puttalam' },
      { pName: 'North Central Province', name: 'Anuradhapura', slug: 'anuradhapura' },
      { pName: 'North Central Province', name: 'Polonnaruwa', slug: 'polonnaruwa' },
      { pName: 'Uva Province', name: 'Badulla', slug: 'badulla' },
      { pName: 'Uva Province', name: 'Monaragala', slug: 'monaragala' },
      { pName: 'Sabaragamuwa Province', name: 'Ratnapura', slug: 'ratnapura' },
      { pName: 'Sabaragamuwa Province', name: 'Kegalle', slug: 'kegalle' }
    ];

    const districtsWithIds = districtData.map(d => {
      const province = dbProvinces?.find(p => p.name === d.pName);
      return { parent_id: province?.id, name: d.name, slug: d.slug, type: 'district' };
    });

    const { data: dbDistricts, error: dError } = await supabase
      .from("territories")
      .upsert(districtsWithIds, { onConflict: 'slug' })
      .select();

    if (dError) throw dError;

    // 4. SEED CITIES (Map to District IDs)
    const cityData = [
      // Colombo Districts
      { dName: 'Colombo', name: 'Colombo 01 - Fort', slug: 'colombo-fort' },
      { dName: 'Colombo', name: 'Colombo 03 - Colpetty', slug: 'colombo-colpetty' },
      { dName: 'Colombo', name: 'Colombo 07 - Cinnamon Gardens', slug: 'colombo-cinnamon-gardens' },
      { dName: 'Colombo', name: 'Mount Lavinia', slug: 'mount-lavinia' },
      { dName: 'Colombo', name: 'Nugegoda', slug: 'nugegoda' },
      { dName: 'Colombo', name: 'Maharagama', slug: 'maharagama' },
      { dName: 'Colombo', name: 'Kotte', slug: 'kotte' },
      { dName: 'Colombo', name: 'Malabe', slug: 'malabe' },

      // Gampaha
      { dName: 'Gampaha', name: 'Negombo', slug: 'negombo' },
      { dName: 'Gampaha', name: 'Gampaha Town', slug: 'gampaha-town' },
      { dName: 'Gampaha', name: 'Kiribathgoda', slug: 'kiribathgoda' },
      { dName: 'Gampaha', name: 'Wattala', slug: 'wattala' },
      { dName: 'Gampaha', name: 'Ja-Ela', slug: 'ja-ela' },

      // Kandy
      { dName: 'Kandy', name: 'Kandy City', slug: 'kandy-city' },
      { dName: 'Kandy', name: 'Peradeniya', slug: 'peradeniya' },
      { dName: 'Kandy', name: 'Katugastota', slug: 'katugastota' },

      // Galle
      { dName: 'Galle', name: 'Galle Fort', slug: 'galle-fort' },
      { dName: 'Galle', name: 'Hikkaduwa', slug: 'hikkaduwa' },
      { dName: 'Galle', name: 'Unawatuna', slug: 'unawatuna' },

      // Jaffna
      { dName: 'Jaffna', name: 'Jaffna Town', slug: 'jaffna-town' },
      { dName: 'Jaffna', name: 'Chunnakam', slug: 'chunnakam' },

      // Kurunegala
      { dName: 'Kurunegala', name: 'Kurunegala Town', slug: 'kurunegala-town' },
      { dName: 'Kurunegala', name: 'Kuliyapitiya', slug: 'kuliyapitiya' }
    ];

    const citiesWithIds = cityData.map(c => {
      const district = dbDistricts?.find(d => d.name === c.dName);
      return { parent_id: district?.id, name: c.name, slug: c.slug, type: 'city' };
    });

    const { error: cityError } = await supabase
      .from("territories")
      .upsert(citiesWithIds, { onConflict: 'slug' });

    if (cityError) throw cityError;

    // 5. SEED GLOBAL SERVICES (Map to Category IDs)
    const servicesData = [
      // Barber Salon
      { cName: 'Barber Salon', name: 'Gents Haircut & Wash', slug: 'gents-haircut-wash', description: 'Professional hair trimming, shampooing, and basic styling.', price: 1500, icon: 'Scissors' },
      { cName: 'Barber Salon', name: 'Beard Trimming & Shape', slug: 'beard-trimming-shape', description: 'Classic line-up and beard shaping using clippers or razors.', price: 600, icon: 'Scissors' },
      { cName: 'Barber Salon', name: 'Hot Oil Head Massage', slug: 'hot-oil-head-massage', description: 'Traditional scalp massage using warm oil to boost circulation.', price: 1600, icon: 'Flower2' },
      { cName: 'Barber Salon', name: 'Gents Shaving', slug: 'gents-shaving', description: 'Traditional smooth clean-shave using standard shaving foam/gel.', price: 700, icon: 'User' },
      { cName: 'Barber Salon', name: 'Grey Hair Coverage', slug: 'grey-hair-coverage', description: 'Quick application of black or dark brown hair dye to cover greys.', price: 3000, icon: 'Sparkles' },
      { cName: 'Barber Salon', name: 'Men\'s Hair Perming', slug: 'mens-hair-perming', description: 'Chemically adding curls or waves to the top hair section.', price: 20000, icon: 'Sparkles' },
      
      // Bridal & Beauty
      { cName: 'Bridal & Beauty', name: 'Saree Draping', slug: 'saree-draping', description: 'Professional draping of traditional Kandyan or Normal sarees.', price: 2500, icon: 'Heart' },
      { cName: 'Bridal & Beauty', name: 'Party Makeup & Hair', slug: 'party-makeup-hair', description: 'Full-face makeup and styling for wedding guests or functions.', price: 8000, icon: 'Heart' },
      { cName: 'Bridal & Beauty', name: 'Bridal Hydra Facial', slug: 'bridal-hydra-facial', description: 'Deep-cleaning, exfoliating glow facial specifically for brides.', price: 20000, icon: 'Droplet' },
      { cName: 'Bridal & Beauty', name: 'Bridal Hand Spa + Gel', slug: 'bridal-hand-spa-gel', description: 'Exfoliating hand treatment finished with long-lasting gel polish.', price: 15000, icon: 'Paintbrush' },
      { cName: 'Bridal & Beauty', name: 'Pre-Bridal Full Body Wax', slug: 'pre-bridal-full-body-wax', description: 'Complete body wax (arms, legs, face) before the big day.', price: 25000, icon: 'Sparkles' },
      { cName: 'Bridal & Beauty', name: 'Complete Bridal Dressing', slug: 'complete-bridal-dressing', description: 'Full wedding day package including makeup, hair, and dressing.', price: 60000, icon: 'Heart' },
      
      // Beauty Parlours
      { cName: 'Beauty Parlours', name: 'Eyebrow Threading', slug: 'eyebrow-threading', description: 'Precise shaping of eyebrows using the threading technique.', price: 300, icon: 'Scissors' },
      { cName: 'Beauty Parlours', name: 'Clean Up Facial', slug: 'clean-up-facial', description: 'Standard face exfoliation, steam, and pack for daily upkeep.', price: 3500, icon: 'Sparkles' },
      { cName: 'Beauty Parlours', name: 'Hair Wash & Blast Dry', slug: 'hair-wash-blast-dry', description: 'Basic hair wash followed by standard high-speed blow drying.', price: 1800, icon: 'Droplet' },
      { cName: 'Beauty Parlours', name: 'Full Arms & Legs Wax', slug: 'full-arms-legs-wax', description: 'Normal warm wax hair removal for both hands and legs.', price: 4500, icon: 'Sparkles' },
      { cName: 'Beauty Parlours', name: 'Permanent Rebonding', slug: 'permanent-rebonding', description: 'Chemical straightening system for sleek, permanently flat hair.', price: 15000, icon: 'Sparkles' },
      { cName: 'Beauty Parlours', name: 'Keratin Treatment', slug: 'keratin-treatment', description: 'Smoothing and frizz-reduction protein coat for mid-length hair.', price: 35000, icon: 'Sparkles' },

      // Nail Studio
      { cName: 'Nail Studio', name: 'Express Manicure', slug: 'express-manicure', description: 'Quick nail file, shape, cuticle cleaning, and regular nail polish.', price: 2500, icon: 'Paintbrush' },
      { cName: 'Nail Studio', name: 'Gel Polish Application', slug: 'gel-polish-application', description: 'Standard long-lasting gel color cured under a UV/LED lamp.', price: 4000, icon: 'Paintbrush' },
      { cName: 'Nail Studio', name: 'Acrylic Nail Extensions', slug: 'acrylic-nail-extensions', description: 'Lengthening nails using artificial acrylic tips with base overlays.', price: 12000, icon: 'Paintbrush' },
      { cName: 'Nail Studio', name: 'Custom Nail Art (Per Nail)', slug: 'custom-nail-art', description: 'Hand-painted designs, chrome powder, or stones added to nails.', price: 500, icon: 'Paintbrush' },
      { cName: 'Nail Studio', name: 'Luxury Spa Pedicure', slug: 'luxury-spa-pedicure', description: 'Relaxing foot scrub, mask, massage, and complete toenail care.', price: 6000, icon: 'Paintbrush' },
      { cName: 'Nail Studio', name: 'Acrylic Gel Extension Removal', slug: 'acrylic-gel-extension-removal', description: 'Safe buffing and soaking off to remove old acrylic or gel extensions.', price: 2000, icon: 'Paintbrush' },

      // Skincare Clinics
      { cName: 'Skincare Clinics', name: 'Laser Hair Removal (Session)', slug: 'laser-hair-removal', description: 'Targeting specific body areas (like underarms) for permanent reduction.', price: 8000, icon: 'Sparkles' },
      { cName: 'Skincare Clinics', name: 'Microdermabrasion', slug: 'microdermabrasion', description: 'Medical-grade mechanical exfoliation to reduce acne scars.', price: 10000, icon: 'Droplet' },
      { cName: 'Skincare Clinics', name: 'Chemical Skin Peel', slug: 'chemical-skin-peel', description: 'Dermatological acid application to treat hyperpigmentation.', price: 12000, icon: 'Droplet' },
      { cName: 'Skincare Clinics', name: 'PRP Therapy (Vampire Facial)', slug: 'prp-therapy', description: 'Advanced platelet-rich plasma treatment for skin rejuvenation.', price: 25000, icon: 'Droplet' },
      { cName: 'Skincare Clinics', name: 'Medicated Acne Treatment', slug: 'medicated-acne-treatment', description: 'Clinical extraction followed by high-frequency bacterial zap.', price: 8000, icon: 'Droplet' },
      { cName: 'Skincare Clinics', name: 'Skin Tag/Wart Removal', slug: 'skin-tag-wart-removal', description: 'Minor cauterization or laser treatment to remove skin tags.', price: 3000, icon: 'Droplet' },

      // Spa & Wellness
      { cName: 'Spa & Wellness', name: '10-Min Oil Head Massage', slug: '10-min-oil-head-massage', description: 'Quick head rub using ayurvedic oil to relieve immediate stress.', price: 1500, icon: 'Flower2' },
      { cName: 'Spa & Wellness', name: 'Full Body Herbal Massage', slug: 'full-body-herbal-massage', description: '60 minutes of full-body oil massage using local herbs.', price: 8000, icon: 'Flower2' },
      { cName: 'Spa & Wellness', name: 'Foot Reflexology', slug: 'foot-reflexology', description: 'Pressure-point massage on the feet to boost internal body wellness.', price: 3500, icon: 'Flower2' },
      { cName: 'Spa & Wellness', name: 'Back Pain Relief Ritual', slug: 'back-pain-relief-ritual', description: 'Specialized targeted massage combined with warm herbal compress.', price: 6000, icon: 'Flower2' },
      { cName: 'Spa & Wellness', name: 'Exfoliating Body Scrub', slug: 'exfoliating-body-scrub', description: 'Full-body sand, salt, or coffee scrub to peel dead skin.', price: 6000, icon: 'Flower2' },
      { cName: 'Spa & Wellness', name: 'Herbal Steam Bath Induction', slug: 'herbal-steam-bath', description: 'Sitting in a traditional wooden steam chamber filled with herb vapors.', price: 3000, icon: 'Flower2' },

      // Yoga Studio
      { cName: 'Yoga Studio', name: 'Single Drop-in Class', slug: 'yoga-drop-in', description: 'Admission to one group session of Hatha or Vinyasa flow.', price: 1500, icon: 'Activity' },
      { cName: 'Yoga Studio', name: '10-Class Attendance Pass', slug: 'yoga-10-class-pass', description: 'A bulk punch-card for 10 sessions, usually valid for 2-3 months.', price: 12000, icon: 'Activity' },
      { cName: 'Yoga Studio', name: 'Monthly Unlimited Membership', slug: 'yoga-monthly-unlimited', description: 'Uncapped access to all daily group yoga and stretching classes.', price: 15000, icon: 'Activity' },
      { cName: 'Yoga Studio', name: 'Private One-on-One Session', slug: 'yoga-private-session', description: '1-hour personalized physical or therapy yoga with an instructor.', price: 6000, icon: 'Activity' },
      { cName: 'Yoga Studio', name: 'Pranayama & Meditation', slug: 'pranayama-meditation', description: 'A dedicated breathwork and mental calmness class.', price: 1500, icon: 'Activity' },
      { cName: 'Yoga Studio', name: 'Prenatal/Pregnancy Yoga', slug: 'prenatal-yoga', description: 'Soft, modified yoga tailored strictly for expecting mothers.', price: 2500, icon: 'Activity' },

      // Men's Grooming
      { cName: 'Men\'s Grooming', name: 'Tailored Gents Haircut', slug: 'tailored-gents-haircut', description: 'Executive hair re-styling inclusive of a relaxing hair wash.', price: 3000, icon: 'User' },
      { cName: 'Men\'s Grooming', name: 'Charcoal Deep Clean Facial', slug: 'charcoal-deep-clean-facial', description: 'Blackhead and oil extraction designed specifically for male skin.', price: 5000, icon: 'Sparkles' },
      { cName: 'Men\'s Grooming', name: 'Luxury Head Spa Treatment', slug: 'luxury-head-spa', description: 'Scalp exfoliation, deep conditioning mask, and extended massage.', price: 12000, icon: 'Flower2' },
      { cName: 'Men\'s Grooming', name: 'Premium Beard Sculpting', slug: 'premium-beard-sculpting', description: 'Intricate beard fading, hot oil conditioning, and luxury line-up.', price: 2000, icon: 'User' },
      { cName: 'Men\'s Grooming', name: 'Hair Detox Treatment', slug: 'hair-detox-treatment', description: 'Scalp scaling to treat heavy dandruff or hair thinning problems.', price: 5500, icon: 'Sparkles' },
      { cName: 'Men\'s Grooming', name: 'Gents Mani-Pedi Duo', slug: 'gents-mani-pedi', description: 'Executive nail cleaning and hand/foot moisturizing for men.', price: 7000, icon: 'Paintbrush' },

      // Kids & Family
      { cName: 'Kids & Family', name: 'Boys Haircut (Under 10yrs)', slug: 'boys-haircut-kids', description: 'Fast, friendly trim usually on a specialty chair or car seat.', price: 1200, icon: 'Users' },
      { cName: 'Kids & Family', name: 'Girls Haircut & Blow-dry', slug: 'girls-haircut-kids', description: 'Basic hair shaping and light blast styling for young girls.', price: 1800, icon: 'Users' },
      { cName: 'Kids & Family', name: 'Kids Mini Manicure', slug: 'kids-mini-manicure', description: 'Gentle nail clipping, filing, and optional non-toxic nail paint.', price: 1500, icon: 'Paintbrush' },
      { cName: 'Kids & Family', name: 'Family Haircut Bundle', slug: 'family-haircut-bundle', description: 'Package haircut for Mom, Dad, and one child at a discount.', price: 6000, icon: 'Users' },
      { cName: 'Kids & Family', name: 'Lice Treatment Session', slug: 'lice-treatment', description: 'Natural, safe comb-through and wash to eliminate head lice.', price: 3500, icon: 'Droplet' },
      { cName: 'Kids & Family', name: 'Baby\'s First Haircut Ceremony', slug: 'babys-first-haircut', description: 'Gentle clipping of first baby hairs with a souvenir certificate.', price: 1500, icon: 'Users' },

      // Tattoo Studio
      { cName: 'Tattoo Studio', name: 'Minimalist/Fine Line Tattoo', slug: 'minimalist-tattoo', description: 'Small symbolic tattoos (less than 7cm) like script or symbols.', price: 15000, icon: 'PenTool' },
      { cName: 'Tattoo Studio', name: 'Custom Designed Tattoo (Hourly)', slug: 'custom-tattoo-hourly', description: 'Large or complex custom artwork calculated per hour of work.', price: 20000, icon: 'PenTool' },
      { cName: 'Tattoo Studio', name: 'Sri Lankan Souvenir Flash', slug: 'srilankan-souvenir-flash', description: 'Pre-drawn cultural tattoos (e.g., Sigiriya, Lion, Lotus, Sun/Moon).', price: 25000, icon: 'PenTool' },
      { cName: 'Tattoo Studio', name: 'Standard Ear/Nose Piercing', slug: 'standard-piercing', description: 'Professional piercing using safe sterile single-use needles.', price: 4000, icon: 'PenTool' },
      { cName: 'Tattoo Studio', name: 'Belly/Navel Piercing', slug: 'navel-piercing', description: 'Body piercing using titanium or surgical steel starter jewelry.', price: 6000, icon: 'PenTool' },
      { cName: 'Tattoo Studio', name: 'Old Tattoo Cover-up Design', slug: 'tattoo-cover-up', description: 'Reworking or completely blanketing an old tattoo with fresh ink.', price: 30000, icon: 'PenTool' }
    ];

    const servicesWithIds = servicesData.map(s => {
      const category = dbCategories?.find(c => c.name === s.cName);
      return { 
        category_id: category?.id, 
        name: s.name, 
        slug: s.slug, 
        description: s.description, 
        suggested_price: s.price, 
        icon: s.icon 
      };
    });

    const { error: sError } = await supabase
      .from("global_services")
      .upsert(servicesWithIds, { onConflict: 'slug' });

    if (sError) throw sError;

    return { success: true };
  } catch (err: any) {
    console.error("Seeding Error Details:", JSON.stringify(err, null, 2));
    return { success: false, error: err.message || JSON.stringify(err) };
  }
};
