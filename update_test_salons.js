import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const premiumImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop", // Beauty salon styling
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop", // Modern barbershop
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop", // Luxury salon chair
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop"  // Hair stylist work
];

const premiumNames = [
  "Trimma Elite Studio",
  "Trimma Grooming Lounge",
  "Trimma Style & Co.",
  "Trimma Urban Retreat"
];

const premiumLocations = [
  "Colombo 07",
  "Colombo 03",
  "Kandy",
  "Galle Fort"
];

const premiumRatings = [4.9, 4.8, 4.9, 4.7];

async function updateTestSalons() {
  console.log("Fetching salons starting with 'Trimma Test Salon'...");
  const { data: salons, error: fetchError } = await supabase
    .from("salons")
    .select("id, name, slug")
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Error fetching salons:", fetchError);
    return;
  }

  const testSalons = salons.filter(s => s.name && s.name.startsWith("Trimma Test Salon"));
  console.log(`Found ${testSalons.length} test salons to update.`);

  for (let i = 0; i < testSalons.length; i++) {
    const s = testSalons[i];
    const name = premiumNames[i % premiumNames.length];
    const city = premiumLocations[i % premiumLocations.length];
    const rating = premiumRatings[i % premiumRatings.length];
    const coverUrl = premiumImages[i % premiumImages.length];

    console.log(`Updating salon ${s.id} (${s.name}) to:`);
    console.log(`- Name: ${name}`);
    console.log(`- City/Location: ${city}`);
    console.log(`- Rating: ${rating}`);
    console.log(`- Cover URL: ${coverUrl}`);

    const { error: updateError } = await supabase
      .from("salons")
      .update({
        name: name,
        city: city,
        address: city + ", Sri Lanka",
        rating: rating,
        cover_url: coverUrl,
        hero_url: coverUrl
      })
      .eq("id", s.id);

    if (updateError) {
      console.error(`Failed to update salon ${s.id}:`, updateError);
    } else {
      console.log(`Successfully updated salon ${s.id}`);
    }
  }

  console.log("Update completed.");
}

updateTestSalons();
