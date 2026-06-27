"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  fetchGooglePlaceProfile,
  mapGooglePlaceToSalonRecord,
  mergeGoogleProfileIntoSalonRow,
  slugifySalonName,
} from "@/lib/google-place-profile";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

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
  website?: string | null;
  map_url?: string | null;
  review_count?: number | null;
  summary?: string | null;
  working_hours?: string | null;
}) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();
  const user = { email: auth.email };

  try {
    const { data: existingSalon } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("place_id", businessData.place_id)
      .maybeSingle();

    if (existingSalon?.id) {
      return { success: false as const, error: "A lead for this business already exists." };
    }

    const profile = await fetchGooglePlaceProfile(businessData.place_id);
    const slug = `${slugifySalonName(businessData.name)}-${Date.now()}`;

    const incoming = profile
      ? mapGooglePlaceToSalonRecord(businessData.place_id, profile, {
          category: businessData.category,
        })
      : {
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
          review_count: businessData.review_count || 0,
          website: businessData.website || null,
          map_url: businessData.map_url || null,
          summary: businessData.summary || null,
          description: businessData.summary || null,
          working_hours: businessData.working_hours || [],
          logo_url: businessData.logo_url,
        };

    const payload = mergeGoogleProfileIntoSalonRow(null, {
      ...incoming,
      slug,
      owner_email: `draft-${slug}@trimma.io`,
      assign_to: user.email,
      onboarding_status: "ASSIGNED_TO_AGENT",
      logo_url: businessData.logo_url,
    });

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

    const { data: globalServices } = await supabaseAdmin
      .from("global_services")
      .select("*")
      .eq("is_active", true)
      .limit(20);

    if (globalServices && globalServices.length > 0) {
      const shuffled = globalServices.sort(() => 0.5 - Math.random());
      const selectedServices = shuffled.slice(0, 6);

      const servicesPayload = selectedServices.map((gs: any) => ({
        salon_id: salonId,
        global_service_id: gs.id,
        category_id: gs.category_id,
        name: gs.name,
        category: "General",
        price: gs.suggested_price || 1500,
        duration_min: gs.suggested_duration_minutes || 30,
        description: gs.description,
        image_url: gs.icon_image_url || null,
        status: "active",
      }));

      await supabaseAdmin.from("services").insert(servicesPayload);
    }

    const { data: globalRoles } = await supabaseAdmin.from("global_staff_roles").select("*").limit(10);

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
        status: "active",
      },
      {
        salon_id: salonId,
        name: "Staff 2",
        email: `staff2-${slug}@trimma.io`,
        role: rolesToUse[1],
        status: "active",
      },
    ];

    await supabaseAdmin.from("salon_staff").insert(staffPayload);

    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: user.email,
      action: "GOOGLE_LEAD_CREATED",
      notes: `Agent created lead from Google Business profile (${businessData.place_id}).`,
    });

    return { success: true as const, salonId };
  } catch (err: any) {
    console.error("Failed to create Google Places lead:", err);
    return { success: false as const, error: err.message || "Failed to create lead." };
  }
}
