/**
 * Download the real Google Business photo for a salon and save it to Supabase Storage.
 *
 * Usage (from repo root):
 *   node scripts/refresh-salon-google-image.mjs --name "Salon LuxeLab"
 *   node scripts/refresh-salon-google-image.mjs --id 1b8bec8f-88cb-4a9a-a5e8-9c2bdab838fe
 *
 * Requires apps/web/.env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_API
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../apps/web/.env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envPath);

const args = process.argv.slice(2);
const salonId = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const salonName = args.includes("--name") ? args[args.indexOf("--name") + 1] : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleApiKey = process.env.GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local");
  process.exit(1);
}

if (!googleApiKey) {
  console.error("Missing GOOGLE_API in apps/web/.env.local");
  process.exit(1);
}

if (!salonId && !salonName) {
  console.error('Provide --id "<uuid>" or --name "Salon Name"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function findGooglePlaceId(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]?.place_id) {
    return data.results[0].place_id;
  }
  throw new Error(`Google text search failed: ${data.status} ${data.error_message || ""}`.trim());
}

async function fetchPhotoReference(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${googleApiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const photos = data.result?.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    throw new Error("No Google photos found for this place.");
  }
  return photos[0].photo_reference;
}

async function downloadPhoto(photoReference) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${encodeURIComponent(photoReference)}&key=${googleApiKey}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Photo download failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadImage(salonIdValue, field, buffer) {
  const fileName = `${salonIdValue}/${field}_${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("salon-images").upload(fileName, buffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
  return data.publicUrl;
}

async function main() {
  let query = supabase.from("salons").select("id, name, address, city, district, place_id, cover_url, hero_url");
  query = salonId ? query.eq("id", salonId) : query.ilike("name", `%${salonName}%`);

  const { data: salons, error } = await query.limit(5);
  if (error) throw error;
  if (!salons?.length) {
    throw new Error("No matching salon found.");
  }

  const salon = salons[0];
  console.log(`Refreshing images for: ${salon.name} (${salon.id})`);

  let placeId = salon.place_id?.trim() || null;
  if (!placeId) {
    const searchQuery = [salon.name, salon.address, salon.city, salon.district, "Sri Lanka"]
      .filter(Boolean)
      .join(", ");
    console.log(`Looking up Google Place: ${searchQuery}`);
    placeId = await findGooglePlaceId(searchQuery);
  }

  console.log(`Using place_id: ${placeId}`);
  const photoReference = await fetchPhotoReference(placeId);
  const buffer = await downloadPhoto(photoReference);

  const coverUrl = await uploadImage(salon.id, "cover", buffer);
  const heroUrl = await uploadImage(salon.id, "hero", buffer);

  const { error: updateError } = await supabase
    .from("salons")
    .update({
      cover_url: coverUrl,
      hero_url: heroUrl,
      place_id: placeId,
    })
    .eq("id", salon.id);

  if (updateError) throw updateError;

  console.log("Updated successfully:");
  console.log(`  cover_url: ${coverUrl}`);
  console.log(`  hero_url:  ${heroUrl}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
