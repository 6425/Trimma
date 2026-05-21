import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSalons() {
  const { data, error } = await supabase.from('salons').select('*').limit(12).order('created_at', { ascending: false });
  if (error) {
    console.error("Error listing salons:", error);
    return;
  }
  
  const premiumImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ffdb5965eb?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop"
  ];
  
  const premiumNames = [
    "Trimma Elite Studio",
    "Trimma Grooming Lounge",
    "Trimma Style & Co.",
    "Trimma Urban Retreat",
    "Trimma Luxe Barbers",
    "Trimma Wellness Spa"
  ];

  const premiumLocations = [
    "Colombo 07",
    "Colombo 03",
    "Kandy",
    "Galle Fort",
    "Colombo 05",
    "Negombo"
  ];

  const mapped = data.map((s, idx) => {
    let name = s.name;
    let location = s.city || s.district || "Colombo";
    let rating = s.rating || (4.7 + (idx % 3) * 0.1);

    if (name.startsWith("Trimma Test Salon")) {
      name = premiumNames[idx % premiumNames.length];
      location = premiumLocations[idx % premiumLocations.length];
    }

    const image = s.cover_url || s.hero_url || premiumImages[idx % premiumImages.length];

    return {
      name,
      location,
      rating: parseFloat(rating.toFixed(1)),
      reviews: 18 + ((idx * 7) % 30),
      image,
      slug: s.slug
    };
  });

  console.log("Mapped salons (exact same logic as page.tsx):");
  console.log(JSON.stringify(mapped, null, 2));
}

listSalons();
