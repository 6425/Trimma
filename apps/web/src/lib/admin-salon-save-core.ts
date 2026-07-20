import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingRejectionReasonColumnError, mapAdminDbError } from "@/lib/with-admin-db";
import { sanitizeAdminSalonPayload } from "@/lib/admin-salon-update";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import { normalizeEmail } from "@/lib/normalize-email";

/** When rejection_reason column is absent, keep reject working via admin_notes. */
function payloadWithoutRejectionReasonColumn(
  sanitized: Record<string, unknown>
): Record<string, unknown> {
  const { rejection_reason, ...rest } = sanitized;
  if (typeof rejection_reason !== "string" || !rejection_reason.trim()) {
    return rest;
  }
  const note = `Rejection reason: ${rejection_reason.trim()}`;
  const existingNotes = typeof rest.admin_notes === "string" ? rest.admin_notes.trim() : "";
  return {
    ...rest,
    admin_notes: existingNotes ? `${existingNotes}\n${note}` : note,
  };
}

export type AdminSalonSaveResult =
  | { success: true }
  | { success: false; error: string };

export async function saveAdminSalonRecord(
  supabase: SupabaseClient,
  salonId: string,
  payload: Record<string, unknown>
): Promise<AdminSalonSaveResult> {
  try {
    const sanitized = sanitizeAdminSalonPayload(payload);
    if (Object.keys(sanitized).length === 0) {
      return { success: false, error: "No valid salon fields to update." };
    }

    const { data: existing, error: readError } = await supabase
      .from("salons")
      .select("owner_email, owner_gmail, name, phone, assign_to, address, city, district, onboarding_status")
      .eq("id", salonId)
      .maybeSingle();
    if (readError) {
      return { success: false, error: mapAdminDbError(readError.message) };
    }

    const ownerEmail =
      (typeof sanitized.owner_email === "string" && sanitized.owner_email) ||
      (typeof sanitized.owner_gmail === "string" && sanitized.owner_gmail) ||
      existing?.owner_email ||
      existing?.owner_gmail ||
      null;

    const ownerPhone =
      (typeof sanitized.phone === "string" && sanitized.phone) || existing?.phone || null;

    const ownerName =
      (typeof sanitized.name === "string" && sanitized.name) || existing?.name || "Salon Owner";

    if (ownerEmail) {
      const { error: userError } = await supabase.from("users").upsert(
        {
          email: ownerEmail,
          global_role: "salon_owner",
          full_name: ownerName,
          ...(ownerPhone ? { phone: ownerPhone } : {}),
        },
        { onConflict: "email" }
      );
      if (userError) {
        return { success: false, error: mapAdminDbError(userError.message) };
      }

      await syncUserRolesForGlobalRole(supabase, ownerEmail, "salon_owner");
      await ensureSalonOwnerAccess(supabase, ownerEmail);
    }

    const { error } = await supabase.from("salons").update(sanitized).eq("id", salonId);
    if (error) {
      if (
        "rejection_reason" in sanitized &&
        isMissingRejectionReasonColumnError(error.message)
      ) {
        const fallback = payloadWithoutRejectionReasonColumn(sanitized);
        const { error: retryError } = await supabase
          .from("salons")
          .update(fallback)
          .eq("id", salonId);
        if (retryError) {
          return { success: false, error: mapAdminDbError(retryError.message) };
        }
        console.warn(
          "[saveAdminSalonRecord] salons.rejection_reason missing; stored reason in admin_notes. Run packages/db/ADD_SALON_REJECTION_REASON.sql."
        );
      } else {
        return { success: false, error: mapAdminDbError(error.message) };
      }
    }

    const nextAssignTo = normalizeEmail(
      typeof sanitized.assign_to === "string" ? sanitized.assign_to : ""
    );
    const previousAssignTo = normalizeEmail(existing?.assign_to || "");
    if (nextAssignTo && nextAssignTo !== previousAssignTo) {
      const salonAddress = [
        typeof sanitized.address === "string" ? sanitized.address : existing?.address,
        typeof sanitized.city === "string" ? sanitized.city : existing?.city,
        typeof sanitized.district === "string" ? sanitized.district : existing?.district,
      ]
        .filter(Boolean)
        .join(", ");

      void notifyAgentLeadAssigned(supabase, {
        salonId,
        salonName:
          (typeof sanitized.name === "string" && sanitized.name) || existing?.name || "Salon lead",
        salonAddress: salonAddress || null,
        assignToEmail: nextAssignTo,
        onboardingStatus:
          (typeof sanitized.onboarding_status === "string" && sanitized.onboarding_status) ||
          existing?.onboarding_status ||
          "ASSIGNED_TO_AGENT",
      }).catch((err) => console.error("Agent lead assignment notification failed:", err));
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save salon.";
    return { success: false, error: mapAdminDbError(message) };
  }
}
