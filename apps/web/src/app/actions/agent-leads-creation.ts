"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `map-${Date.now()}`;
}

export async function createLeadFromGooglePlaces(businessData: {
  place_id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  phone: string | null;
}) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();
  const user = { email: auth.email };

  try {
    // 1. Check if place_id already exists to prevent duplicates
    const { data: existingSalon } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("place_id", businessData.place_id)
      .maybeSingle();

    if (existingSalon?.id) {
      return { success: false as const, error: "A lead for this business already exists." };
    }

    const slug = `${slugify(businessData.name)}-${Date.now()}`;
    const payload = {
      place_id: businessData.place_id,
      name: businessData.name,
      slug,
      owner_email: `draft-${slug}@trimma.io`,
      assign_to: user.email,
      onboarding_status: "ASSIGNED_TO_AGENT",
      activation_status: "INACTIVE",
      source_type: "GOOGLE_PLACES",
      phone: businessData.phone,
      address: businessData.address,
      category: businessData.category,
      latitude: businessData.latitude,
      longitude: businessData.longitude,
      rating: businessData.rating,
      logo_url: businessData.logo_url,
    };

    // 2. Insert into salons
    const { data: newSalon, error: insertError } = await supabaseAdmin
      .from("salons")
      .insert(payload)
      .select("id, name")
      .single();

    if (insertError) throw insertError;
    const salonId = newSalon.id;

    try {
      const images = await syncSalonImagesFromGooglePlace(supabaseAdmin, {
        id: salonId,
        name: businessData.name,
        address: businessData.address,
        city: null,
        district: null,
        place_id: businessData.place_id,
      });

      await supabaseAdmin
        .from("salons")
        .update({
          cover_url: images.cover_url,
          hero_url: images.hero_url,
          place_id: images.place_id,
        })
        .eq("id", salonId);
    } catch (imageErr) {
      console.warn("Google Places image sync skipped for new lead:", imageErr);
    }

    // 3. Fetch 6 random services and insert
    const { data: globalServices } = await supabaseAdmin
      .from("global_services")
      .select("*")
      .eq("is_active", true)
      .limit(20);

    if (globalServices && globalServices.length > 0) {
      // Shuffle array and pick up to 6
      const shuffled = globalServices.sort(() => 0.5 - Math.random());
      const selectedServices = shuffled.slice(0, 6);
      
      const servicesPayload = selectedServices.map((gs: any) => ({
        salon_id: salonId,
        global_service_id: gs.id,
        category_id: gs.category_id,
        name: gs.name,
        category: "General", // fallback if no category relation available easily
        price: gs.suggested_price || 1500,
        duration_min: gs.suggested_duration_minutes || 30,
        description: gs.description,
        image_url: gs.icon_image_url || null,
        status: "active"
      }));

      await supabaseAdmin.from("services").insert(servicesPayload);
    }

    // 4. Fetch 2 random staff roles and insert
    const { data: globalRoles } = await supabaseAdmin
      .from("global_staff_roles")
      .select("*")
      .limit(10);

    let rolesToUse = ["Senior Stylist", "Assistant"];
    if (globalRoles && globalRoles.length >= 2) {
      const shuffledRoles = globalRoles.sort(() => 0.5 - Math.random());
      rolesToUse = [shuffledRoles[0].role_name, shuffledRoles[1].role_name];
    }

    const staffPayload = [
      {
        salon_id: salonId,
        name: "Staff 1",
        email: `staff1-${slug}@trimma.io`,
        role: rolesToUse[0],
        status: "active"
      },
      {
        salon_id: salonId,
        name: "Staff 2",
        email: `staff2-${slug}@trimma.io`,
        role: rolesToUse[1],
        status: "active"
      }
    ];

    await supabaseAdmin.from("salon_staff").insert(staffPayload);

    // 5. Log activity
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: user.email,
      action: "GOOGLE_LEAD_CREATED",
      notes: `Agent automatically created lead from Google Places map search.`,
    });

    return { success: true as const, salonId };
  } catch (err: any) {
    console.error("Failed to create Google Places lead:", err);
    return { success: false as const, error: err.message || "Failed to create lead." };
  }
}
