"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { saveAdminSalonRecord } from "@/lib/admin-salon-save-core";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { getAdminActorEmail, requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { findAuthUserIdByEmail, syncUserRolesForGlobalRole } from "@/lib/sync-user-role";
import { saveBookingCommissionMaster } from "@/app/actions/commission-master";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/lib/subscription-pricing";

const PAYMENT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const BRANDING_SETTINGS_ID = "00000000-0000-0000-0000-000000000002";

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function updateAdminBookingStatus(
  bookingId: string,
  status: "confirmed" | "cancelled" | "pending" | "completed"
) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function rescheduleAdminBooking(bookingId: string, bookingDate: string, bookingTime: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase
      .from("bookings")
      .update({ booking_date: bookingDate, booking_time: bookingTime })
      .eq("id", bookingId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

// ─── Salons ─────────────────────────────────────────────────────────────────

export async function updateAdminSalon(salonId: string, payload: Record<string, unknown>) {
  const result = await withAdminDb(async (supabase) => {
    const saveResult = await saveAdminSalonRecord(supabase, salonId, payload);
    if (saveResult.success === false) throw new Error(saveResult.error);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function approveAdminSalon(salonId: string) {
  return updateAdminSalon(salonId, { status: "active", is_verified: false });
}

export async function verifyAdminSalon(salonId: string) {
  return updateAdminSalon(salonId, { status: "active", is_verified: true, verified_at: new Date().toISOString() });
}

export async function rejectAdminSalon(salonId: string, rejectionReason: string) {
  return updateAdminSalon(salonId, {
    status: "rejected",
    is_verified: false,
    rejection_reason: rejectionReason,
  });
}

// ─── Subscription plans ─────────────────────────────────────────────────────

export async function saveAdminSubscriptionPlan(input: {
  id?: string;
  name: string;
  monthly_price: number;
  annual_price?: number;
  max_staff?: number;
  max_services?: number;
  max_images?: number;
  max_promotion_packages?: number;
  feature_flags?: Record<string, unknown>;
  list_monthly_price?: number;
  intro_monthly_price?: number;
}) {
  const payload = {
    name: input.name,
    monthly_price: input.monthly_price,
    annual_price: input.annual_price ?? input.monthly_price * 10,
    max_staff: input.max_staff ?? 2,
    max_services: input.max_services ?? 6,
    max_images: input.max_images ?? 4,
    max_promotion_packages: input.max_promotion_packages ?? 2,
    feature_flags: input.feature_flags ?? {},
    ...(input.list_monthly_price != null ? { list_monthly_price: input.list_monthly_price } : {}),
    ...(input.intro_monthly_price != null ? { intro_monthly_price: input.intro_monthly_price } : {}),
  };

  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { error } = await supabase.from("subscription_plans").update(payload).eq("id", input.id);
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await supabase.from("subscription_plans").insert([payload]);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function deleteAdminSubscriptionPlan(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function seedAdminSubscriptionPlans() {
  const defaultPlans = DEFAULT_SUBSCRIPTION_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    list_monthly_price: plan.list_monthly_price,
    intro_monthly_price: plan.intro_monthly_price,
    monthly_price: plan.intro_monthly_price ?? plan.monthly_price,
    annual_price: plan.annual_price,
    max_staff: plan.max_staff,
    max_services: plan.max_services,
    max_images: plan.max_images,
    max_promotion_packages: plan.max_promotion_packages,
    feature_flags: plan.feature_flags,
  }));

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("subscription_plans").upsert(defaultPlans, { onConflict: "id" });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

// ─── Payment settings ───────────────────────────────────────────────────────

export async function saveGlobalPaymentSettings(input: Record<string, unknown>) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("global_payment_settings").upsert({
      id: PAYMENT_SETTINGS_ID,
      updated_at: new Date().toISOString(),
      ...input,
    });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function simulateAdminTestPayment() {
  const result = await withAdminDb(async (supabase) => {
    const { data: booking } = await supabase.from("bookings").select("id, salon_id, amount").limit(1).maybeSingle();
    if (!booking) throw new Error("No bookings found to simulate a payment.");

    const isPayPal = Math.random() > 0.5;
    const { error } = await supabase.from("payments").insert({
      booking_id: booking.id,
      salon_id: booking.salon_id,
      provider: isPayPal ? "paypal" : "payhere",
      provider_payment_id: "SIM-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      amount: booking.amount,
      currency: "LKR",
      status: "success",
      raw_response: { note: "Generated via payments configuration simulator console" },
    });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

// ─── Branding & profile ─────────────────────────────────────────────────────

export async function saveGlobalBrandingSettings(input: Record<string, unknown>) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("global_branding_settings").upsert({
      id: BRANDING_SETTINGS_ID,
      updated_at: new Date().toISOString(),
      ...input,
    });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function fetchGlobalBrandingSettings() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase.from("global_branding_settings").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return { settings: data };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, settings: result.data.settings };
}

export async function updateAdminUserProfile(
  email: string,
  input: { full_name?: string; phone?: string | null; global_role?: string }
) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("users").update(input).eq("email", email);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function saveAdminUserWithRole(input: {
  email: string;
  full_name: string;
  phone?: string | null;
  global_role: string;
}) {
  const rolesToReplicate = ["agent", "admin", "superadmin", "regional_admin"];

  const result = await withAdminDb(async (supabase) => {
    const { data: currentUser } = await supabase
      .from("users")
      .select("global_role")
      .eq("email", input.email)
      .maybeSingle();

    const { error: profileError } = await supabase
      .from("users")
      .update({
        full_name: input.full_name,
        global_role: input.global_role,
        phone: input.phone ?? null,
      })
      .eq("email", input.email);
    if (profileError) throw new Error(profileError.message);

    if (rolesToReplicate.includes(input.global_role)) {
      const { data: existingAgent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_email", input.email)
        .maybeSingle();
      if (!existingAgent) {
        const { error: agentError } = await supabase.from("agents").insert([
          { user_email: input.email, status: "active", commission_rate: 0 },
        ]);
        if (agentError) throw new Error(agentError.message);
      }
    } else if (currentUser && rolesToReplicate.includes(String(currentUser.global_role))) {
      // keep agent history row
    }

    await syncUserRolesForGlobalRole(supabase, input.email, input.global_role);

    if (input.global_role === "salon_owner") {
      await ensureSalonOwnerAccess(supabase, input.email);
    }
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export async function saveAdminAgentProfile(input: {
  user_email: string;
  status: string;
  commission_rate: number;
  territory?: string;
  territory_id?: string | null;
  createIfMissing?: boolean;
}) {
  const result = await withAdminDb(async (supabase) => {
    const normalized = normalizeEmail(input.user_email);
    if (!normalized) throw new Error("Agent email is required.");

    const { data: existing } = await supabase
      .from("agents")
      .select("id")
      .eq("user_email", normalized)
      .maybeSingle();

    const authUserId = await findAuthUserIdByEmail(supabase, normalized);

    const payload: Record<string, unknown> = {
      status: input.status,
      commission_rate: input.commission_rate,
      user_email: normalized,
    };

    if (authUserId) payload.user_id = authUserId;

    if (input.territory !== undefined) {
      payload.territory = input.territory;
    }
    if (input.territory_id !== undefined) {
      payload.territory_id = input.territory_id;
    }

    if (existing?.id) {
      const { error } = await supabase.from("agents").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else if (input.createIfMissing) {
      const { error } = await supabase.from("agents").insert([payload]);
      if (error) throw new Error(error.message);
    } else {
      throw new Error("Agent profile not found.");
    }
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function demoteAdminAgent(userEmail: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error: agentErr } = await supabase.from("agents").delete().eq("user_email", userEmail);
    if (agentErr) throw new Error(agentErr.message);
    const { error: userErr } = await supabase
      .from("users")
      .update({ global_role: "customer" })
      .eq("email", userEmail);
    if (userErr) throw new Error(userErr.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function insertAgentActivityLog(input: {
  agent_email: string;
  action: string;
  notes: string;
}) {
  const actorEmail = await getAdminActorEmail();
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("agent_activity_logs").insert({
      actor_email: actorEmail,
      agent_email: input.agent_email,
      action: input.action,
      notes: input.notes,
    });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function updateCommissionLedgerStatus(
  id: string,
  status: string,
  timestamps?: { approved_at?: string | null; paid_at?: string | null }
) {
  const result = await withAdminDb(async (supabase) => {
    const payload: Record<string, unknown> = { status };
    if (timestamps?.approved_at) payload.approved_at = timestamps.approved_at;
    if (timestamps?.paid_at) payload.paid_at = timestamps.paid_at;
    const { error } = await supabase.from("commission_ledger").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function saveAdminFinanceBookingRates(input: {
  platform: number;
  salon: number;
  payhere: number;
  previousId?: string | null;
}) {
  return saveBookingCommissionMaster({
    platform: input.platform,
    salon: input.salon,
    payhere: input.payhere,
    previousId: input.previousId,
  });
}

export async function fetchAdminProfilePage() {
  const actorEmail = await getAdminActorEmail();
  const result = await withAdminDb(async (supabase) => {
    const [userRes, brandingRes] = await Promise.all([
      supabase.from("users").select("*").eq("email", actorEmail).maybeSingle(),
      supabase.from("global_branding_settings").select("*").limit(1).maybeSingle(),
    ]);
    if (userRes.error) throw new Error(userRes.error.message);
    if (brandingRes.error) throw new Error(brandingRes.error.message);
    return { profile: userRes.data, branding: brandingRes.data };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminActorEmail() {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };
  return { success: true as const, email: await getAdminActorEmail() };
}


export async function createAdminSalonDraft(payload: Record<string, unknown>) {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase.from("salons").insert([payload]).select();
    if (error) throw new Error(error.message);
    return { salon: data?.[0] ?? null };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, salon: result.data.salon };
}

export async function insertOnboardingLog(input: { salon_id: string; action: string; notes: string }) {
  const actorEmail = await getAdminActorEmail();
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("onboarding_logs").insert({
      salon_id: input.salon_id,
      actor_email: actorEmail,
      action: input.action,
      notes: input.notes,
    });
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function fetchSalonServicesAndStaff(salonId: string) {
  const result = await withAdminDb(async (supabase) => {
    const [servicesRes, staffRes] = await Promise.all([
      supabase.from("services").select("*").eq("salon_id", salonId).order("created_at", { ascending: false }),
      supabase.from("salon_staff").select("*").eq("salon_id", salonId).order("created_at", { ascending: false }),
    ]);
    if (servicesRes.error) throw new Error(servicesRes.error.message);
    if (staffRes.error) throw new Error(staffRes.error.message);
    return { services: servicesRes.data || [], staff: staffRes.data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function deleteAdminSalonService(serviceId: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function deleteAdminSalonStaff(staffId: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("salon_staff").delete().eq("id", staffId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function updateAdminSalonStaff(
  staffId: string,
  input: { name?: string; role?: string }
) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("salon_staff").update(input).eq("id", staffId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function bulkInsertAdminSalons(rows: Record<string, unknown>[]) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("salons").insert(rows);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function deleteAdminSalon(salonId: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("salons").delete().eq("id", salonId);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function uploadAdminSalonImage(fileName: string, base64Data: string, contentType = "image/jpeg") {
  const result = await withAdminDb(async (supabase) => {
    const buffer = Buffer.from(base64Data, "base64");
    const { error } = await supabase.storage
      .from("salon-images")
      .upload(fileName, buffer, { cacheControl: "3600", upsert: true, contentType });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
    return { publicUrl: data.publicUrl };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, publicUrl: result.data.publicUrl };
}

export async function publishAdminLead(lead: {
  id: string;
  name: string;
  province?: string;
  district?: string;
  city?: string;
  address?: string;
}) {
  const slug = lead.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const result = await withAdminDb(async (supabase) => {
    const { data: freePlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", "Free")
      .maybeSingle();

    let freePlanId = freePlan?.id;
    if (!freePlanId) {
      const { data: anyPlan } = await supabase.from("subscription_plans").select("id").limit(1).maybeSingle();
      freePlanId = anyPlan?.id;
    }

    const { error: salonError } = await supabase.from("salons").insert({
      name: lead.name,
      slug,
      owner_email: `owner-${slug}@trimma.io`,
      province: lead.province || "Western Province",
      district: lead.district || "Colombo",
      city: lead.address || lead.city || "Colombo",
      subscription_plan_id: freePlanId || null,
      status: "DRAFT",
    });
    if (salonError) throw new Error(salonError.message);

    const { error: statusError } = await supabase
      .from("salon_leads")
      .update({
        status: "converted",
        lead_status: "INTERESTED",
        onboarding_stage: "CONVERTED",
      })
      .eq("id", lead.id);
    if (statusError) throw new Error(statusError.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, slug };
}
