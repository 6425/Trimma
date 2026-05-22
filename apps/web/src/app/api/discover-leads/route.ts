import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { province, district, city, category, limit } = await req.json();
    const apiKey = process.env.GOOGLE_API || "AIzaSyAyiQbm46o6YH8m_vidvcw_FMan_jA56MQ";

    if (!apiKey) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 });
    }

    // Build the query query for Sri Lanka
    const searchQuery = `${category || "hair salon"} in ${city || ""}, ${district || ""}, ${province || ""}, Sri Lanka`;
    console.log(`[Google Places Discovery] Searching: ${searchQuery}`);

    // 1. Text Search request to fetch places list
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    const searchRes = await axios.get(searchUrl);
    
    if (searchRes.data.status !== "OK" && searchRes.data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API returned error status: ${searchRes.data.status}. ${searchRes.data.error_message || ""}`);
    }

    const rawPlaces = searchRes.data.results || [];
    console.log(`[Google Places Discovery] Found ${rawPlaces.length} places.`);

    if (rawPlaces.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No salons found in this destination." });
    }

    // 2. Query Details API in parallel for the requested limit (defaults to top 15)
    const targetLimit = limit ? Math.min(Number(limit), 60) : 15; // Max safety limit of 60 to prevent API key depletion
    const topPlaces = rawPlaces.slice(0, targetLimit);
    const detailPromises = topPlaces.map(async (place: any) => {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,formatted_phone_number,website,url,geometry,opening_hours,price_level,editorial_summary,types&key=${apiKey}`;
        const detailRes = await axios.get(detailUrl);
        if (detailRes.data.status === "OK") {
          return { ...place, details: detailRes.data.result };
        }
        return { ...place, details: null };
      } catch (err) {
        console.error(`Failed to fetch Place Details for ID ${place.place_id}:`, err);
        return { ...place, details: null };
      }
    });

    const enrichedPlaces = await Promise.all(detailPromises);

    // 3. Format and clean Places data into database schema records
    const salonsToUpsert = enrichedPlaces.map((place: any) => {
      const details = place.details || {};

      // Map numeric price level to standard $ symbols
      let priceText = null;
      if (details.price_level !== undefined) {
        priceText = "$".repeat(details.price_level) || "$";
      }

      const name = details.name || place.name || "Unnamed Salon";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      return {
        place_id: place.place_id,
        name: name,
        slug: slug,
        owner_email: `draft-${slug}-${Date.now().toString().slice(-4)}@trimma.io`, // unique placeholder
        province: province || "Western Province",
        district: district || "Colombo",
        city: city || "Colombo",
        address: details.formatted_address || place.formatted_address || null,
        rating: details.rating || place.rating || null,
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        map_url: details.url || null,
        category: category || "Barber Salon",
        working_hours: details.opening_hours ? details.opening_hours.periods || [] : [],
        latitude: details.geometry?.location?.lat || place.geometry?.location?.lat || null,
        longitude: details.geometry?.location?.lng || place.geometry?.location?.lng || null,
        price_level: priceText,
        summary: details.editorial_summary?.overview || null,
        source_type: "GOOGLE_PLACES",
        onboarding_status: "DISCOVERED",
        activation_status: "INACTIVE"
      };
    });

    // 4. Perform Supabase upsert with conflict target 'place_id'
    const { data, error } = await supabase
      .from("salons")
      .upsert(salonsToUpsert, { onConflict: "place_id" });

    if (error) {
      console.error("Supabase upsert execution failed:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: salonsToUpsert.length,
      message: `Discovered and created ${salonsToUpsert.length} draft salons in ${city} (${district})!`
    });
  } catch (error: any) {
    console.error("Discover API route failure:", error);
    return NextResponse.json({ error: error.message || "Failed to process lead discovery" }, { status: 500 });
  }
}
