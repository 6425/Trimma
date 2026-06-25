"use server";

import {
  adminDbFailure,
  isAdminDbSuccess,
  isMissingDbSchemaError,
  withAdminDb,
} from "@/lib/with-admin-db";
import { saveAdminSalonRecord } from "@/lib/admin-salon-save-core";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { getAdminActorEmail, requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { findAuthUserIdByEmail, syncUserRolesForGlobalRole } from "@/lib/sync-user-role";
import {
  saveBookingCommissionMaster,
  saveSubscriptionCommissionMaster,
} from "@/app/actions/commission-master";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/lib/subscription-pricing";
import { getStripeConnectionStatus } from "@/lib/stripe-env";
import { loadStripeDbSettingsForAdmin } from "@/lib/stripe-settings";
import {
  ensureSalonSubscriptionPlan,
  getAllowedCategoriesLimit,
  sliceAllowedCategories,
} from "@/lib/salon-subscription-plan";
import { parseFeatureFlags } from "@/lib/parse-feature-flags";
import { syncStaffServiceAssignmentsForSalon } from "@/lib/salon-staff-service-sync";

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

import { revalidatePath } from "next/cache";

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
  discount_percentage?: number;
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
    ...(input.discount_percentage != null ? { discount_percentage: input.discount_percentage } : {}),
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
  
  revalidatePath("/", "layout");
  revalidatePath("/pricing");
  return { success: true as const };
}

export async function deleteAdminSubscriptionPlan(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  
  revalidatePath("/", "layout");
  revalidatePath("/pricing");
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
    discount_percentage: plan.discount_percentage,
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
  
  revalidatePath("/", "layout");
  revalidatePath("/pricing");
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


export async function fetchStripeConnectionStatus() {
  const db = await loadStripeDbSettingsForAdmin();
  return { success: true as const, connection: getStripeConnectionStatus(db), settings: db };
}

export async function saveStripePaymentSettings(input: {
  stripe_enabled: boolean;
  stripe_environment: "sandbox" | "live";
  stripe_publishable_key_sandbox?: string;
  stripe_publishable_key_live?: string;
  stripe_secret_key_sandbox?: string;
  stripe_secret_key_live?: string;
}) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("global_payment_settings").upsert({
      id: PAYMENT_SETTINGS_ID,
      updated_at: new Date().toISOString(),
      stripe_enabled: input.stripe_enabled,
      stripe_environment: input.stripe_environment,
      stripe_publishable_key_sandbox: input.stripe_publishable_key_sandbox ?? "",
      stripe_publishable_key_live: input.stripe_publishable_key_live ?? "",
      stripe_secret_key_sandbox: input.stripe_secret_key_sandbox ?? "",
      stripe_secret_key_live: input.stripe_secret_key_live ?? "",
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("does not exist") || msg.includes("stripe_")) {
        throw new Error(
          "Stripe columns are missing in the database. Run packages/db/STRIPE_PAYMENT_PATCH.sql in Supabase, then try again."
        );
      }
      throw new Error(error.message);
    }
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function simulateAdminTestPayment() {
  const result = await withAdminDb(async (supabase) => {
    const { data: booking } = await supabase.from("bookings").select("id, salon_id, amount").limit(1).maybeSingle();
    if (!booking) throw new Error("No bookings found to simulate a payment.");

    const { error } = await supabase.from("payments").insert({
      booking_id: booking.id,
      salon_id: booking.salon_id,
      provider: "stripe",
      provider_payment_id: "SIM-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      amount: booking.amount,
      currency: "LKR",
      status: "success",
      raw_response: { note: "Generated via Stripe payments simulator console" },
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
  reports_to_agent_id?: string | null;
  sub_agent_split_percent?: number | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    return { success: false as const, error: "User email is required." };
  }

  if (String(input.global_role || "").toLowerCase() === "regional_admin") {
    input = { ...input, global_role: "regional_head" };
  }

  const result = await withAdminDb(async (supabase) => {
    const { data: currentUser } = await supabase
      .from("users")
      .select("global_role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const currentRole = String(currentUser?.global_role || "").toLowerCase();
    if (currentRole === "admin" || currentRole === "superadmin") {
      throw new Error("Platform admin accounts cannot be reassigned from this screen.");
    }

    const targetRole = String(input.global_role || "").toLowerCase();
    if (targetRole === "admin" || targetRole === "superadmin") {
      throw new Error("Platform admin roles cannot be assigned from user edit.");
    }

    const { error: profileError } = await supabase
      .from("users")
      .update({
        full_name: input.full_name,
        global_role: input.global_role,
        phone: input.phone ?? null,
      })
      .eq("email", normalizedEmail);
    if (profileError) throw new Error(profileError.message);

    const authUserId = await findAuthUserIdByEmail(supabase, normalizedEmail);
    const { data: existingAgent, error: existingAgentError } = await supabase
      .from("agents")
      .select("id")
      .eq("user_email", normalizedEmail)
      .maybeSingle();
    if (existingAgentError) throw new Error(existingAgentError.message);

    let existingReportsTo: string | null = null;
    let existingSplitPercent: number | null = null;

    if (existingAgent?.id && (targetRole === "regional_head" || targetRole === "agent")) {
      const { data: hierarchy, error: hierarchyError } = await supabase
        .from("agents")
        .select("reports_to_agent_id, sub_agent_split_percent")
        .eq("id", existingAgent.id)
        .maybeSingle();
      if (hierarchyError) {
        if (isMissingDbSchemaError(hierarchyError.message)) {
          throw new Error(
            "Agent hierarchy columns are missing. Run packages/db/ADMIN_USER_ROLE_PATCH.sql in Supabase SQL Editor."
          );
        }
        throw new Error(hierarchyError.message);
      }
      existingReportsTo = (hierarchy?.reports_to_agent_id as string | null) ?? null;
      existingSplitPercent =
        hierarchy?.sub_agent_split_percent == null
          ? null
          : Number(hierarchy.sub_agent_split_percent);
    }

    if (targetRole === "regional_head" || targetRole === "agent") {
      const agentTier = targetRole === "regional_head" ? "regional_head" : "field_agent";
      const payload: Record<string, unknown> = {
        user_email: normalizedEmail,
        status: "active",
        commission_rate: 0,
        agent_tier: agentTier,
      };
      if (authUserId) payload.user_id = authUserId;

      if (agentTier === "regional_head") {
        payload.reports_to_agent_id = null;
        payload.sub_agent_split_percent = null;
      } else {
        const reportsTo = input.reports_to_agent_id || existingReportsTo || null;
        if (!reportsTo) {
          throw new Error("Sub-agents must be assigned to a regional head.");
        }
        const { data: headAgent, error: headError } = await supabase
          .from("agents")
          .select("id, agent_tier")
          .eq("id", reportsTo)
          .maybeSingle();
        if (headError) {
          if (isMissingDbSchemaError(headError.message)) {
            throw new Error(
              "Agent hierarchy columns are missing. Run packages/db/ADMIN_USER_ROLE_PATCH.sql in Supabase SQL Editor."
            );
          }
          throw new Error(headError.message);
        }
        if (!headAgent?.id || headAgent.agent_tier !== "regional_head") {
          throw new Error("Selected regional head is invalid.");
        }
        payload.reports_to_agent_id = reportsTo;
        payload.sub_agent_split_percent =
          input.sub_agent_split_percent == null
            ? existingSplitPercent ?? 50
            : Math.min(100, Math.max(0, Number(input.sub_agent_split_percent) || 0));
      }

      if (existingAgent?.id) {
        const { error: agentError } = await supabase
          .from("agents")
          .update(payload)
          .eq("id", existingAgent.id);
        if (agentError) throw new Error(agentError.message);
      } else {
        const { error: agentError } = await supabase.from("agents").insert([payload]);
        if (agentError) throw new Error(agentError.message);
      }
    } else if (existingAgent?.id) {
      await supabase
        .from("agents")
        .update({ status: "inactive" })
        .eq("id", existingAgent.id);
    }

    await syncUserRolesForGlobalRole(supabase, normalizedEmail, input.global_role);

    if (input.global_role === "salon_owner") {
      await ensureSalonOwnerAccess(supabase, normalizedEmail);
    }
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export async function getAdminAgentMetaForUser(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { success: false as const, error: "Email is required." };

  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("agents")
      .select("id, reports_to_agent_id, sub_agent_split_percent, agent_tier, status")
      .eq("user_email", normalizedEmail)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { agent: data };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, agent: result.data.agent };
}

export async function listRegionalHeadAgentsForAdmin() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("agents")
      .select("id, user_email, user_id, status")
      .eq("agent_tier", "regional_head")
      .order("user_email", { ascending: true });
    if (error) {
      if (isMissingDbSchemaError(error.message)) {
        const { data: fallback, error: fallbackError } = await supabase
          .from("agents")
          .select("id, user_email, user_id, status")
          .eq("status", "active")
          .order("user_email", { ascending: true });
        if (fallbackError) throw new Error(fallbackError.message);
        return { heads: fallback || [] };
      }
      throw new Error(error.message);
    }
    return { heads: data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, heads: result.data.heads };
}

export async function saveAdminAgentProfile(input: {
  user_email: string;
  status: string;
  commission_rate: number;
  territory?: string;
  territory_id?: string | null;
  agent_tier?: "regional_head" | "field_agent";
  reports_to_agent_id?: string | null;
  sub_agent_split_percent?: number | null;
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

    const tier = input.agent_tier === "field_agent" ? "field_agent" : "regional_head";
    payload.agent_tier = tier;

    if (tier === "field_agent") {
      if (!input.reports_to_agent_id) {
        throw new Error("Field agents must report to a regional head.");
      }
      const { data: headAgent, error: headError } = await supabase
        .from("agents")
        .select("id, agent_tier")
        .eq("id", input.reports_to_agent_id)
        .maybeSingle();
      if (headError || !headAgent?.id || headAgent.agent_tier !== "regional_head") {
        throw new Error("Selected regional head is invalid.");
      }
      payload.reports_to_agent_id = input.reports_to_agent_id;
      payload.sub_agent_split_percent =
        input.sub_agent_split_percent == null
          ? 50
          : Math.min(100, Math.max(0, Number(input.sub_agent_split_percent) || 0));
    } else {
      payload.reports_to_agent_id = null;
      payload.sub_agent_split_percent = null;
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
  agent?: number;
  previousId?: string | null;
}) {
  return saveBookingCommissionMaster({
    platform: input.platform,
    salon: input.salon,
    agent: input.agent,
    previousId: input.previousId,
  });
}

export async function saveAdminFinanceSubscriptionRates(input: {
  platform: number;
  agent: number;
  previousId?: string | null;
}) {
  return saveSubscriptionCommissionMaster({
    platform: input.platform,
    agent: input.agent,
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

export async function fetchAdminSalonServicePickerData(salonId: string) {
  const result = await withAdminDb(async (supabase) => {
    const [salonRes, categoriesRes, globalServicesRes, existingServicesRes] = await Promise.all([
      supabase.from("salons").select("id, category, subscription_plan_id").eq("id", salonId).maybeSingle(),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("global_services").select("*, categories(name)").eq("is_active", true),
      supabase.from("services").select("id, global_service_id").eq("salon_id", salonId),
    ]);

    if (salonRes.error) throw new Error(salonRes.error.message);
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);
    if (globalServicesRes.error) throw new Error(globalServicesRes.error.message);
    if (existingServicesRes.error) throw new Error(existingServicesRes.error.message);

    const { plan } = await ensureSalonSubscriptionPlan(
      supabase,
      salonId,
      salonRes.data?.subscription_plan_id
    );
    const flags = parseFeatureFlags(plan?.feature_flags);
    const allowedCategories = sliceAllowedCategories(
      categoriesRes.data || [],
      flags,
      plan?.name as string | undefined
    );

    const services = (globalServicesRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.categories?.name || null,
      default_price: row.suggested_price || 0,
      default_duration: row.suggested_duration_minutes || 30,
      icon_image_url: row.icon || null,
    }));

    return {
      salonCategory: salonRes.data?.category || "",
      maxServices: Number(plan?.max_services) || 6,
      allowedCategories,
      allowedCategoryLimit: getAllowedCategoriesLimit(flags, plan?.name as string | undefined),
      planName: plan?.name || "Free",
      services,
      existingGlobalServiceIds: (existingServicesRes.data || [])
        .map((row) => row.global_service_id)
        .filter(Boolean),
    };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function importAdminSalonServices(
  salonId: string,
  selectedServices: Array<{
    global_service_id: string;
    name: string;
    category: string;
    price: number;
    duration_min: number;
    image_url?: string | null;
  }>
) {
  const result = await withAdminDb(async (supabase) => {
    const { data: salon } = await supabase
      .from("salons")
      .select("subscription_plan_id")
      .eq("id", salonId)
      .maybeSingle();
    const { plan } = await ensureSalonSubscriptionPlan(
      supabase,
      salonId,
      salon?.subscription_plan_id
    );
    const maxServices = Number(plan?.max_services) || 6;

    const { data: existing } = await supabase
      .from("services")
      .select("id, global_service_id")
      .eq("salon_id", salonId);
    const existingGlobalIds = new Set(
      (existing || []).map((row) => row.global_service_id).filter(Boolean)
    );

    const toInsert = selectedServices.filter(
      (svc) => svc.global_service_id && !existingGlobalIds.has(svc.global_service_id)
    );

    const totalAfterInsert = (existing || []).length + toInsert.length;
    if (totalAfterInsert > maxServices) {
      throw new Error(
        `This salon's ${plan?.name || "plan"} allows up to ${maxServices} services. Remove some before adding more.`
      );
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from("services").insert(
        toInsert.map((svc) => ({
          salon_id: salonId,
          global_service_id: svc.global_service_id,
          name: svc.name,
          category: svc.category,
          price: svc.price,
          duration_min: svc.duration_min,
          image_url: svc.image_url || null,
          status: "active",
        }))
      );
      if (error) throw new Error(error.message);
    }

    await syncStaffServiceAssignmentsForSalon(supabase, salonId, {
      assignMissingServices: true,
    });
    return { inserted: toInsert.length };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, inserted: result.data.inserted };
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

    const { data: salonData, error: salonError } = await supabase.from("salons").insert({
      name: lead.name,
      slug,
      owner_email: `owner-${slug}@trimma.io`,
      province: lead.province || "Western Province",
      district: lead.district || "Colombo",
      city: lead.address || lead.city || "Colombo",
      subscription_plan_id: freePlanId || null,
      status: "pending",
    }).select("id").single();
    if (salonError) throw new Error(salonError.message);

    if (freePlanId && salonData?.id) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 10);
      await supabase.from("subscriptions").insert({
        salon_id: salonData.id,
        plan_id: freePlanId,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
    }

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

export async function adminResetUserPassword(email: string, newPassword: string) {
  const result = await withAdminDb(async (supabase) => {
    const authId = await findAuthUserIdByEmail(supabase, email);
    if (!authId) throw new Error("Could not find auth user for this email.");

    const { error } = await supabase.auth.admin.updateUserById(authId, {
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function assignSalonOwnerRoleByAdminClient(
  supabaseAdmin: any,
  email: string,
  fullName: string,
  phone: string
) {
  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email: email.trim().toLowerCase(),
        full_name: fullName,
        phone: phone,
        global_role: 'salon_owner',
      },
      { onConflict: 'email' }
    );
  if (upsertError) throw new Error(upsertError.message);

  await syncUserRolesForGlobalRole(supabaseAdmin, email, 'salon_owner');
  await ensureSalonOwnerAccess(supabaseAdmin, email);
}

export async function preAssignSalonOwnerRole(email: string, fullName: string, phone: string) {
  const result = await withAdminDb(async (supabase) => {
    await assignSalonOwnerRoleByAdminClient(supabase, email, fullName, phone);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
