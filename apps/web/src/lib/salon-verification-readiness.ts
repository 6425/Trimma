import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBookingApprovalMissingFields,
  type SalonOnboardingSnapshot,
} from "@/lib/salon-onboarding-progress";
import { getSalonSetupSteps } from "@/lib/salon-setup-progress";
import type { SalonStaffForAllocation } from "@/lib/staff-allocation";

export type SalonVerificationReadiness = {
  ready: boolean;
  missing: string[];
};

/** Server-side source of truth for opening a salon to customer bookings. */
export async function getSalonVerificationReadiness(
  supabase: SupabaseClient,
  salonId: string
): Promise<SalonVerificationReadiness> {
  const [salonResult, servicesResult, staffResult] = await Promise.all([
    supabase
      .from("salons")
      .select("name, phone, address, city, latitude, longitude, hero_url, cover_url, hero_image, owner_email, owner_gmail")
      .eq("id", salonId)
      .maybeSingle(),
    supabase.from("services").select("id, status").eq("salon_id", salonId),
    supabase
      .from("salon_staff")
      .select("id, name, status, working_hours")
      .eq("salon_id", salonId),
  ]);

  if (salonResult.error) throw new Error(salonResult.error.message);
  if (!salonResult.data) throw new Error("Salon not found.");
  if (servicesResult.error) throw new Error(servicesResult.error.message);
  if (staffResult.error) throw new Error(staffResult.error.message);

  const missing = getBookingApprovalMissingFields(
    salonResult.data as SalonOnboardingSnapshot,
    salonResult.data.owner_email || salonResult.data.owner_gmail
  );

  const activeServices = (servicesResult.data || []).filter(
    (service) => String(service.status || "active").toLowerCase() === "active"
  );
  const setupSteps = getSalonSetupSteps(
    activeServices,
    (staffResult.data || []) as SalonStaffForAllocation[]
  );
  for (const step of setupSteps) {
    if (!step.done) missing.push(step.title.toLowerCase());
  }

  return { ready: missing.length === 0, missing: Array.from(new Set(missing)) };
}

export function getSalonNotReadyMessage(missing: string[]): string {
  return `Complete ${missing.join(", ")} before sending this salon for final verification.`;
}
