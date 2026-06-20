"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import { assignSalonOwnerRoleByAdminClient } from "./admin-operations";
import { normalizeEmail } from "@/lib/normalize-email";
import { syncSalonAmenitiesForSalon } from "@/lib/salon-amenities";
import { syncStaffServiceAssignmentsForSalon } from "@/lib/salon-staff-service-sync";

export async function saveAgentLeadData(
  salonId: string,
  updatePayload: any,
  servicesData: {
    svcsToAdd: any[];
    svcsToRemoveIds: string[];
  } | null,
  staffToAdd: any[] | null,
  agentEmail: string,
  newStatus: string | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null = null,
  actionType: "DRAFT" | "REVIEW" = "DRAFT"
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const finalPayload = { ...updatePayload };
    const enablesBooking = newStatus === "PENDING_ADMIN_VERIFICATION";

    if (!enablesBooking) {
      finalPayload.public_visibility = false;
      finalPayload.booking_enabled = false;
      finalPayload.activation_status = "INACTIVE";
    }

    if (actionType === "REVIEW") {
      if (finalPayload.owner_gmail) {
        finalPayload.owner_email = finalPayload.owner_gmail;
      }
    } else if (newStatus) {
      finalPayload.onboarding_status = newStatus;

      if (newStatus === "PENDING_ADMIN_VERIFICATION") {
        finalPayload.booking_enabled = true;
        finalPayload.public_visibility = "preview";
      }
    }

    if (finalPayload.owner_gmail) {
      const normEmail = normalizeEmail(finalPayload.owner_gmail);
      if (normEmail) {
        try {
          await assignSalonOwnerRoleByAdminClient(
            supabaseAdmin,
            normEmail,
            (finalPayload.name || "Salon") + " Owner",
            finalPayload.phone || ""
          );
        } catch (roleErr) {
          console.error("Failed to pre-assign salon owner role during lead update:", roleErr);
        }
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("salons")
      .update(finalPayload)
      .eq("id", salonId);

    if (updateError) throw updateError;

    // 2. Sync Services
    if (servicesData) {
      if (servicesData.svcsToAdd.length > 0) {
        await supabaseAdmin.from("services").insert(servicesData.svcsToAdd);
      }
      if (servicesData.svcsToRemoveIds.length > 0) {
        await supabaseAdmin.from("services").delete().in("id", servicesData.svcsToRemoveIds);
      }
    }

    await syncStaffServiceAssignmentsForSalon(supabaseAdmin, salonId);

    // 3. Add Staff (skip duplicates by name + email)
    if (staffToAdd && staffToAdd.length > 0) {
      const { data: existingStaff } = await supabaseAdmin
        .from("salon_staff")
        .select("id, name, email")
        .eq("salon_id", salonId);

      const existingKeys = new Set(
        (existingStaff || []).map(
          (row) =>
            `${String(row.name || "").trim().toLowerCase()}|${String(row.email || "").trim().toLowerCase()}`
        )
      );

      const uniqueStaff = staffToAdd.filter((row) => {
        const key = `${String(row.name || "").trim().toLowerCase()}|${String(row.email || "").trim().toLowerCase()}`;
        return !existingKeys.has(key);
      });

      if (uniqueStaff.length > 0) {
        await supabaseAdmin.from("salon_staff").insert(uniqueStaff);
      }

      await syncStaffServiceAssignmentsForSalon(supabaseAdmin, salonId);
    }

    // 4. Sync Amenities
    if (amenitiesData) {
      await syncSalonAmenitiesForSalon(supabaseAdmin, salonId, amenitiesData);
    }

    // 5. Log Activity
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: agentEmail,
      action: newStatus === "PENDING_ADMIN_VERIFICATION" ? "PENDING_ADMIN_VERIFICATION" : "LEAD_UPDATED",
      notes:
        newStatus === "PENDING_ADMIN_VERIFICATION"
          ? "Agent enabled bookings and sent salon to admin for verification."
          : actionType === "REVIEW"
            ? "Agent saved salon details before owner invitation."
            : "Agent updated salon details in field editor.",
    });

    return { success: true as const };
  } catch (err: any) {
    console.error("Agent lead save failed:", err);
    return { success: false as const, error: err.message || "Failed to save lead." };
  }
}

export async function createAgentLeadData(
  payload: any,
  servicesData: { svcsToAdd: any[] } | null,
  staffToAdd: any[] | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null,
  agentEmail: string,
  actionType: "DRAFT" | "REVIEW" = "DRAFT"
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // 1. Create Salon
    const { data: salon, error: createError } = await supabaseAdmin
      .from("salons")
      .insert({
        ...payload,
        assign_to: agentEmail,
        onboarding_status: "ASSIGNED_TO_AGENT",
        activation_status: "INACTIVE",
        public_visibility: false,
        booking_enabled: false,
        owner_email:
          actionType === "REVIEW" && payload.owner_gmail
            ? payload.owner_gmail
            : `draft-${payload.slug}@trimma.io`,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    const salonId = salon.id;

    // 2. Sync Services
    if (servicesData && servicesData.svcsToAdd.length > 0) {
      const svcsToAdd = servicesData.svcsToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("services").insert(svcsToAdd);
    }

    if (staffToAdd && staffToAdd.length > 0) {
      const staff = staffToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("salon_staff").insert(staff);
    }

    await syncStaffServiceAssignmentsForSalon(supabaseAdmin, salonId);

    // 4. Sync Amenities
    if (amenitiesData) {
      await syncSalonAmenitiesForSalon(supabaseAdmin, salonId, amenitiesData);
    }

    // 5. Log Activity
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: agentEmail,
      action: "LEAD_CREATED",
      notes: "Agent created a new manual lead from the field."
    });

    return { success: true as const, salonId };
  } catch (err: any) {
    console.error("Agent lead create failed:", err);
    return { success: false as const, error: err.message || "Failed to create lead." };
  }
}

export async function fetchAgentGlobals() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const [svcRes, staffRes, amenitiesRes] = await Promise.all([
    supabaseAdmin.from("global_services").select("*, categories(name)").eq("is_active", true),
    supabaseAdmin.from("global_staff_roles").select("*").order("category"),
    supabaseAdmin.from("global_amenities").select("*").order("name")
  ]);
  
  const services = (svcRes.data || []).map((s: any) => ({
    ...s,
    category: s.categories?.name || null,
    default_price: s.suggested_price || 0,
    default_duration: s.suggested_duration_minutes || 30,
    icon_image_url: s.icon || null
  }));

  return {
    success: true as const,
    services: services,
    staffRoles: staffRes.data || [],
    amenities: amenitiesRes.data || []
  };
}

export async function convertManualLeadToSalon(
  leadId: string,
  payload: any,
  servicesData: { svcsToAdd: any[] } | null,
  staffToAdd: any[] | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null,
  agentEmail: string,
  actionType: "DRAFT" | "REVIEW" = "DRAFT"
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // 1. Generate a slug
    const slug = (payload.name || "salon")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 6);
      
    payload.slug = slug;

    // 2. Create the Salon record using existing logic (inline to keep it transactional-ish)
    const { data: salon, error: createError } = await supabaseAdmin
      .from("salons")
      .insert({
        ...payload,
        assign_to: agentEmail,
        onboarding_status: "ASSIGNED_TO_AGENT",
        activation_status: "INACTIVE",
        public_visibility: false,
        booking_enabled: false,
        owner_email:
          actionType === "REVIEW" && payload.owner_gmail
            ? payload.owner_gmail
            : `draft-${slug}@trimma.io`,
      })
      .select("id")
      .single();

    if (createError) throw createError;
    const salonId = salon.id;

    if (payload.owner_gmail) {
      const normEmail = normalizeEmail(payload.owner_gmail);
      if (normEmail) {
        try {
          await assignSalonOwnerRoleByAdminClient(
            supabaseAdmin,
            normEmail,
            (payload.name || "Salon") + " Owner",
            payload.phone || ""
          );
        } catch (roleErr) {
          console.error("Failed to pre-assign salon owner role during manual lead create:", roleErr);
        }
      }
    }

    // 3. Sync Services
    if (servicesData && servicesData.svcsToAdd.length > 0) {
      const svcsToAdd = servicesData.svcsToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("services").insert(svcsToAdd);
    }

    // 4. Add Staff
    if (staffToAdd && staffToAdd.length > 0) {
      const staff = staffToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("salon_staff").insert(staff);
    }

    await syncStaffServiceAssignmentsForSalon(supabaseAdmin, salonId);

    // 5. Sync Amenities
    if (amenitiesData) {
      await syncSalonAmenitiesForSalon(supabaseAdmin, salonId, amenitiesData);
    }

    // 6. Log Activity
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: agentEmail,
      action: "LEAD_CREATED",
      notes: "Agent converted a manual lead from onboarding form to a Salon."
    });

    // 7. Update original salon_leads record to CONVERTED
    await supabaseAdmin
      .from("salon_leads")
      .update({
        lead_status: "CONVERTED",
        status: "processed"
      })
      .eq("id", leadId);

    return { success: true as const, salonId };
  } catch (err: any) {
    console.error("Agent lead conversion failed:", err);
    return { success: false as const, error: err.message || "Failed to convert lead." };
  }
}
