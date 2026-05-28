import type { SupabaseClient } from "@supabase/supabase-js";
import { mapAdminDbError } from "@/lib/with-admin-db";
import { sanitizeAdminSalonPayload } from "@/lib/admin-salon-update";

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
      .select("owner_email, owner_gmail, name, phone")
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
    }

    const { error } = await supabase.from("salons").update(sanitized).eq("id", salonId);
    if (error) {
      return { success: false, error: mapAdminDbError(error.message) };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save salon.";
    return { success: false, error: mapAdminDbError(message) };
  }
}
