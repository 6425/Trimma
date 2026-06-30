"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendBookingConfirmedEmail, sendBookingReminderEmail, sendBookingRescheduledEmail } from "@/app/actions/email-settings";
import { sendWhatsAppBookingReminder, sendWhatsAppNotification, sendWhatsAppRescheduleNotification } from "@/app/actions/whatsapp";
import { sendTelegramBookingReminder } from "@/app/actions/telegram";
import { markBookingNotificationsRead } from "@/lib/salon-owner-notifications";
import {
  readBookingRescheduleState,
  rescheduleColumnsMissingMessage,
  updateBookingSchedule,
} from "@/lib/booking-reschedule-db";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import {
  applySalonSlugOnNameChange,
  parseSalonScheduleFromWorkingHours,
  pickSalonProfileUpdate,
} from "@/lib/salon-profile-save";
import { syncSalonAmenitiesForSalon } from "@/lib/salon-amenities";
import {
  isServiceCoveredByStaff,
  salonHasActiveStaff,
  SERVICE_NEEDS_STAFF_MSG,
  STAFF_REQUIRED_BEFORE_SERVICES_MSG,
  type SalonStaffForAllocation,
} from "@/lib/staff-allocation";
import { normalizeSalonStaffInsertRow } from "@/lib/salon-staff-insert";
import { syncStaffServiceAssignmentsForSalon } from "@/lib/salon-staff-service-sync";
import { syncSalonOperatingHours, syncStaffSchedules } from "@/lib/salon-operating-hours";
import {
  calculateSalonOnboardingScore,
  canSubmitForBookingApproval,
  getBookingApprovalMissingFields,
  type SalonOnboardingSnapshot,
} from "@/lib/salon-onboarding-progress";
import { notifyOwnerSubmittedForBookingApproval } from "@/lib/agent-lead-notifications";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";
import {
  syncFacebookPromotionChange,
  syncFacebookServiceChange,
  type FacebookSyncAction,
} from "@/lib/facebook-sync-engine";

type PendingServiceSync = {
  salonId: string;
  serviceId: string;
  action: FacebookSyncAction;
};

type PendingPromotionSync = {
  salonId: string;
  packageId: string;
  action: FacebookSyncAction;
};

async function runFacebookServiceSyncs(jobs: PendingServiceSync[]) {
  for (const job of jobs) {
    try {
      await syncFacebookServiceChange(job.salonId, job.serviceId, job.action);
    } catch (err) {
      console.warn("Facebook service sync error:", err);
    }
  }
}

async function runFacebookPromotionSyncs(jobs: PendingPromotionSync[]) {
  for (const job of jobs) {
    try {
      await syncFacebookPromotionChange(job.salonId, job.packageId, job.action);
    } catch (err) {
      console.warn("Facebook promotion sync error:", err);
    }
  }
}

const SALON_ONBOARDING_SELECT =
  "id, name, description, phone, address, city, assign_to, source_type, owner_email, owner_gmail, working_hours, business_info_extended, bank_info, is_verified, onboarding_status, latitude, longitude, logo_url, cover_url, hero_url, hero_image";

async function refreshSalonOnboardingScore(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string
) {
  const { data, error } = await supabase
    .from("salons")
    .select(SALON_ONBOARDING_SELECT)
    .eq("id", salonId)
    .single();

  if (error || !data) return;

  const score = calculateSalonOnboardingScore(data as SalonOnboardingSnapshot);
  await supabase.from("salons").update({ onboarding_completion_score: score }).eq("id", salonId);
}

function revalidateOwnerSalonPage(
  salon: Record<string, unknown>,
  previousSalon?: Record<string, unknown>
) {
  const slugs = new Set<string>();
  for (const record of [salon, previousSalon]) {
    if (!record) continue;
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    if (slug) slugs.add(slug);
    if (record.id != null) revalidatePath(`/salons/${String(record.id)}`);
  }
  for (const slug of slugs) revalidatePath(`/salons/${slug}`);
}

async function publishSalonCatalogUpdates(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string,
  salon: Record<string, unknown>,
  patch?: Record<string, unknown>
) {
  await syncStaffServiceAssignmentsForSalon(supabase, salonId, {
    assignMissingServices: false,
  });
  revalidateOwnerSalonPage({ ...salon, ...patch }, salon);
}

async function loadSalonStaffForCoverage(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string
): Promise<SalonStaffForAllocation[]> {
  const { data, error } = await supabase
    .from("salon_staff")
    .select("id, name, status, commission_rate, working_hours")
    .eq("salon_id", salonId);
  if (error) throw new Error(error.message);
  return (data || []) as SalonStaffForAllocation[];
}

async function assertSalonService(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  ctx: { salonId: string },
  serviceId: string
) {
  const { data, error } = await supabase
    .from("services")
    .select("id, salon_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.salon_id !== ctx.salonId) {
    throw new Error("Service not found for your salon.");
  }
}

async function assertSalonStaffMember(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  ctx: { salonId: string },
  staffId: string
) {
  const { data, error } = await supabase
    .from("salon_staff")
    .select("id, salon_id")
    .eq("id", staffId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.salon_id !== ctx.salonId) {
    throw new Error("Staff member not found for your salon.");
  }
}

export async function updateOwnerBooking(bookingId: string, payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select("id, salon_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }

    const { error } = await supabase.from("bookings").update(payload).eq("id", bookingId);
    if (error) throw new Error(error.message);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

type ReminderChannelResult = {
  success: boolean;
  error?: string;
  skipped?: boolean;
};

export async function sendOwnerBookingReminder(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select("id, salon_id, booking_no, status, customer_email")
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }

    const status = (booking.status || "").toLowerCase();
    if (["completed", "canceled", "cancelled", "no_show"].includes(status)) {
      throw new Error("Reminders cannot be sent for completed or cancelled bookings.");
    }
    if (!booking.booking_no) {
      throw new Error("Booking reference is missing.");
    }

    return { bookingNo: booking.booking_no as string };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  const bookingNo = result.data.bookingNo;
  const [whatsapp, email, telegram] = await Promise.all([
    sendWhatsAppBookingReminder(bookingNo),
    sendBookingReminderEmail(bookingNo),
    sendTelegramBookingReminder(bookingNo),
  ]);

  const channels = { whatsapp, email, telegram };
  const sent = Object.entries(channels).filter(([, r]) => r.success).map(([name]) => name);
  const skipped = Object.entries(channels).filter(([, r]) => !r.success && (r as ReminderChannelResult).skipped).map(([name]) => name);
  const failed = Object.entries(channels).filter(([, r]) => !r.success && !(r as ReminderChannelResult).skipped);

  if (sent.length === 0) {
    const firstFailed = failed[0];
    const firstSkippedName = skipped[0];
    const firstError =
      (firstFailed && firstFailed[1]?.error) ||
      (firstSkippedName && (channels as Record<string, ReminderChannelResult>)[firstSkippedName]?.error) ||
      "No reminder channels were available.";
    return { success: false as const, error: firstError, channels };
  }

  return {
    success: true as const,
    channels,
    sent,
    skipped: skipped.map((name) => ({
      channel: name,
      error: (channels as Record<string, ReminderChannelResult>)[name]?.error || "Not available",
    })),
    failed: failed.map(([name, r]) => ({ channel: name, error: r.error || "Failed" })),
  };
}

export async function confirmOwnerBooking(bookingId: string) {
  let bookingNo: string | null = null;

  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select("id, salon_id, booking_no, status")
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }
    const status = (booking.status || "").toLowerCase();
    if (status !== "pending") {
      throw new Error("Only pending bookings can be confirmed.");
    }

    const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    if (error) throw new Error(error.message);

    bookingNo = booking.booking_no as string;
    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
    return { bookingNo };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  if (bookingNo) {
    await sendWhatsAppNotification(bookingNo);
    void sendBookingConfirmedEmail(bookingNo);
  }

  return { success: true as const, bookingNo };
}

const NON_RESCHEDULABLE_STATUSES = new Set(["completed", "canceled", "cancelled", "no_show"]);

function normalizeOwnerBookingTime(time: string): string {
  const trimmed = time.trim();
  if (!trimmed) return "";
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function bookingScheduleMatches(
  booking: { booking_date?: string | null; booking_time?: string | null },
  bookingDate: string,
  bookingTime: string
): boolean {
  const savedDate = String(booking.booking_date || "").slice(0, 10);
  const savedTime = normalizeOwnerBookingTime(String(booking.booking_time || "").slice(0, 8));
  return savedDate === bookingDate && savedTime === bookingTime;
}

export async function rescheduleOwnerBooking(
  bookingId: string,
  bookingDate: string,
  bookingTime: string
) {
  const normalizedDate = bookingDate.trim().slice(0, 10);
  const normalizedTime = normalizeOwnerBookingTime(bookingTime);
  if (!normalizedDate || !normalizedTime) {
    return { success: false as const, error: "Choose a new appointment date and time." };
  }

  let bookingNo: string | null = null;

  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select("id, salon_id, booking_no, status")
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }

    const status = (booking.status || "").toLowerCase();
    if (NON_RESCHEDULABLE_STATUSES.has(status)) {
      throw new Error("Completed or cancelled bookings cannot be rescheduled.");
    }

    const rescheduleState = await readBookingRescheduleState(supabase, bookingId);
    const hadPendingRescheduleRequest = rescheduleState?.rescheduleRequested === true;

    await updateBookingSchedule(supabase, bookingId, {
      bookingDate: normalizedDate,
      bookingTime: normalizedTime,
      clearRescheduleRequest: true,
      approvePendingRequest: hadPendingRescheduleRequest,
    });

    const { data: updatedBooking, error: verifyErr } = await supabase
      .from("bookings")
      .select("booking_date, booking_time")
      .eq("id", bookingId)
      .maybeSingle();
    if (verifyErr) throw new Error(verifyErr.message);
    if (!updatedBooking || !bookingScheduleMatches(updatedBooking, normalizedDate, normalizedTime)) {
      throw new Error("The appointment time could not be saved. Refresh and try again.");
    }

    const currentStatus = (booking.status || "").toLowerCase();
    if (currentStatus === "rescheduled") {
      const { error: statusErr } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (statusErr) throw new Error(statusErr.message);
    }

    await supabase
      .from("reschedule_requests")
      .update({ status: "approved" })
      .eq("booking_id", bookingId)
      .eq("status", "pending");

    bookingNo = booking.booking_no as string;
    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  if (bookingNo) {
    const [whatsapp, email] = await Promise.all([
      sendWhatsAppRescheduleNotification(bookingNo),
      sendBookingRescheduledEmail(bookingNo),
    ]);

    return {
      success: true as const,
      bookingNo,
      notifications: { whatsapp, email },
    };
  }

  return { success: true as const, bookingNo: null };
}

export async function approveOwnerRescheduleRequest(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select(
        "id, salon_id, requested_booking_date, requested_booking_time, booking_date, booking_time"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }

    const rescheduleState = await readBookingRescheduleState(supabase, bookingId);
    if (!rescheduleState) {
      throw new Error(rescheduleColumnsMissingMessage());
    }
    if (rescheduleState.rescheduleRequested !== true) {
      throw new Error("This booking has no pending reschedule request.");
    }

    const bookingDate = String(
      booking.requested_booking_date || booking.booking_date || ""
    );
    const bookingTime = String(
      booking.requested_booking_time || booking.booking_time || "12:00:00"
    );
    if (!bookingDate) {
      throw new Error("Requested appointment date is missing.");
    }

    return { bookingDate, bookingTime };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return rescheduleOwnerBooking(
    bookingId,
    result.data.bookingDate,
    result.data.bookingTime
  );
}

export async function rejectOwnerRescheduleRequest(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select("id, salon_id, booking_date, booking_time")
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking || booking.salon_id !== ctx.salonId) {
      throw new Error("Booking not found for your salon.");
    }

    const rescheduleState = await readBookingRescheduleState(supabase, bookingId);
    if (!rescheduleState) {
      throw new Error(rescheduleColumnsMissingMessage());
    }
    if (rescheduleState.rescheduleRequested !== true) {
      throw new Error("This booking has no pending reschedule request.");
    }

    const updateResult = await updateBookingSchedule(supabase, bookingId, {
      bookingDate: String(booking.booking_date || ""),
      bookingTime: String(booking.booking_time || "12:00:00"),
      rejectPendingRequest: true,
    });
    if (!updateResult.rescheduleColumnsAvailable) {
      throw new Error(rescheduleColumnsMissingMessage());
    }

    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function insertSalonPromotionPackages(payloads: Record<string, unknown>[]) {
  const promotionSyncs: PendingPromotionSync[] = [];
  const result = await withSalonDb(async (supabase, ctx) => {
    const globalIds = payloads
      .map((row) => row.global_promotion_package_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let existingGlobalIds = new Set<string>();
    if (globalIds.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("salon_promotion_packages")
        .select("global_promotion_package_id")
        .eq("salon_id", ctx.salonId)
        .in("global_promotion_package_id", globalIds);
      if (existingError) throw new Error(existingError.message);
      existingGlobalIds = new Set(
        (existingRows || [])
          .map((row) => row.global_promotion_package_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      );
    }

    const rows = payloads
      .filter((row) => {
        const globalId = row.global_promotion_package_id;
        if (typeof globalId !== "string" || !globalId) return true;
        return !existingGlobalIds.has(globalId);
      })
      .map((row) => ({ ...row, salon_id: ctx.salonId }));

    if (rows.length === 0) {
      throw new Error("These promotion packages are already published in your salon.");
    }

    const { data, error } = await supabase
      .from("salon_promotion_packages")
      .insert(rows)
      .select("id, status");
    if (error) throw new Error(error.message);
    for (const row of data || []) {
      if (row.status === "active") {
        promotionSyncs.push({ salonId: ctx.salonId, packageId: String(row.id), action: "created" });
      }
    }
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  await runFacebookPromotionSyncs(promotionSyncs);
  return { success: true as const };
}

export async function deleteSalonPromotionPackage(packageId: string) {
  let promotionSync: PendingPromotionSync | null = null;
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: pkg } = await supabase
      .from("salon_promotion_packages")
      .select("status")
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("salon_promotion_packages")
      .delete()
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);

    if (pkg?.status === "active") {
      promotionSync = { salonId: ctx.salonId, packageId, action: "deleted" };
    }
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  if (promotionSync) await runFacebookPromotionSyncs([promotionSync]);
  return { success: true as const };
}

export async function updateSalonPromotionPackage(packageId: string, payload: Record<string, unknown>) {
  let promotionSync: PendingPromotionSync | null = null;
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: before } = await supabase
      .from("salon_promotion_packages")
      .select("status")
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId)
      .maybeSingle();

    const { error } = await supabase
      .from("salon_promotion_packages")
      .update(payload)
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);

    const nextStatus = (payload.status as string | undefined) ?? before?.status;
    if (nextStatus === "active") {
      const action: FacebookSyncAction =
        before?.status !== "active" ? "created" : "updated";
      promotionSync = { salonId: ctx.salonId, packageId, action };
    }
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  if (promotionSync) await runFacebookPromotionSyncs([promotionSync]);
  return { success: true as const };
}

export async function insertSalonServices(payloads: Record<string, unknown>[]) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const staff = await loadSalonStaffForCoverage(supabase, ctx.salonId);
    if (!salonHasActiveStaff(staff)) {
      throw new Error(STAFF_REQUIRED_BEFORE_SERVICES_MSG);
    }

    const globalIds = payloads
      .map((row) => row.global_service_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let existingGlobalIds = new Set<string>();
    if (globalIds.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("services")
        .select("global_service_id")
        .eq("salon_id", ctx.salonId)
        .in("global_service_id", globalIds);
      if (existingError) throw new Error(existingError.message);
      existingGlobalIds = new Set(
        (existingRows || [])
          .map((row) => row.global_service_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      );
    }

    const rows = payloads
      .filter((row) => {
        const globalId = row.global_service_id;
        if (typeof globalId !== "string" || !globalId) return true;
        return !existingGlobalIds.has(globalId);
      })
      .map((row) => {
        const { category_id: _categoryId, ...rest } = row;
        return {
          ...rest,
          salon_id: ctx.salonId,
          status: "inactive",
        };
      });

    if (rows.length === 0) {
      throw new Error("These master services are already in your catalog.");
    }

    const { error } = await supabase.from("services").insert(rows);
    if (error) throw new Error(error.message);
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function updateSalonService(serviceId: string, payload: Record<string, unknown>) {
  let serviceSync: PendingServiceSync | null = null;
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonService(supabase, ctx, serviceId);

    const { data: beforeService, error: beforeReadError } = await supabase
      .from("services")
      .select("id, status, global_service_id")
      .eq("id", serviceId)
      .eq("salon_id", ctx.salonId)
      .maybeSingle();
    if (beforeReadError) throw new Error(beforeReadError.message);

    const nextStatus =
      typeof payload.status === "string" ? payload.status : beforeService?.status;
    const wasActive = (beforeService?.status || "").toLowerCase() === "active";
    const isActivating = nextStatus === "active" && !wasActive;

    if (isActivating) {
      const staff = await loadSalonStaffForCoverage(supabase, ctx.salonId);
      if (!salonHasActiveStaff(staff)) {
        throw new Error(STAFF_REQUIRED_BEFORE_SERVICES_MSG);
      }

      if (
        !isServiceCoveredByStaff(serviceId, staff, beforeService?.global_service_id)
      ) {
        throw new Error(SERVICE_NEEDS_STAFF_MSG);
      }
    }

    const { error } = await supabase.from("services").update(payload).eq("id", serviceId);
    if (error) throw new Error(error.message);
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);

    if (nextStatus === "active") {
      const action: FacebookSyncAction =
        beforeService?.status !== "active" ? "created" : "updated";
      serviceSync = { salonId: ctx.salonId, serviceId, action };
    }
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  if (serviceSync) await runFacebookServiceSyncs([serviceSync]);
  return { success: true as const };
}

export async function deleteSalonService(serviceId: string) {
  let serviceSync: PendingServiceSync | null = null;
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonService(supabase, ctx, serviceId);
    const { data: beforeService } = await supabase
      .from("services")
      .select("status")
      .eq("id", serviceId)
      .maybeSingle();

    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) throw new Error(error.message);
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);

    if (beforeService?.status === "active") {
      serviceSync = { salonId: ctx.salonId, serviceId, action: "deleted" };
    }
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  if (serviceSync) await runFacebookServiceSyncs([serviceSync]);
  return { success: true as const };
}

export async function insertSalonStaff(payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("salon_staff")
      .insert({ ...payload, salon_id: ctx.salonId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (payload.working_hours != null) {
      await syncStaffSchedules(supabase, data.id as string, payload.working_hours);
    }
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);
    return { staffId: data.id as string };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, staffId: result.data.staffId };
}

export async function updateSalonStaff(staffId: string, payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonStaffMember(supabase, ctx, staffId);
    const { error } = await supabase.from("salon_staff").update(payload).eq("id", staffId);
    if (error) throw new Error(error.message);
    if (payload.working_hours != null) {
      await syncStaffSchedules(supabase, staffId, payload.working_hours);
    }
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function deleteSalonStaff(staffId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonStaffMember(supabase, ctx, staffId);
    const { error } = await supabase.from("salon_staff").delete().eq("id", staffId);
    if (error) throw new Error(error.message);
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function toggleSalonStaffStatus(staffId: string, status: string) {
  return updateSalonStaff(staffId, { status });
}

export async function uploadSalonStaffAvatar(
  staffId: string,
  base64Data: string,
  contentType = "image/jpeg"
) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonStaffMember(supabase, ctx, staffId);

    const fileName = `${staffId}-${Date.now()}.jpg`;
    const buffer = Buffer.from(base64Data, "base64");
    const { error: uploadError } = await supabase.storage
      .from("staff-avatars")
      .upload(fileName, buffer, { contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("staff-avatars").getPublicUrl(fileName);
    const { error: updateError } = await supabase
      .from("salon_staff")
      .update({ avatar_url: data.publicUrl })
      .eq("id", staffId);
    if (updateError) throw new Error(updateError.message);

    revalidateOwnerSalonPage(ctx.salon);
    return { publicUrl: data.publicUrl };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, publicUrl: result.data.publicUrl };
}

export async function uploadSalonProfileImage(
  imageType: string,
  base64Data: string,
  contentType = "image/jpeg"
) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const ext = contentType.includes("png") ? "png" : "jpg";
    const fileName = `${ctx.salonId}/${imageType}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(base64Data, "base64");
    const { error } = await supabase.storage
      .from("salon-images")
      .upload(fileName, buffer, { cacheControl: "3600", upsert: true, contentType });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
    return { publicUrl: data.publicUrl };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, publicUrl: result.data.publicUrl };
}

  export async function uploadSalonDocument(
    documentType: string,
    base64Data: string,
    contentType = "application/pdf"
  ) {
    const result = await withSalonDb(async (supabase, ctx) => {
      const ext = contentType.includes("pdf") ? "pdf" : contentType.includes("png") ? "png" : "jpg";
      // Removed Date.now() so that new uploads overwrite the existing document in storage
      const fileName = `${ctx.salonId}/${documentType}.${ext}`;
      const buffer = Buffer.from(base64Data, "base64");
      const { error } = await supabase.storage
        .from("salon-documents")
        .upload(fileName, buffer, { cacheControl: "3600", upsert: true, contentType });
      if (error) throw new Error(error.message);
  
      return { documentUrl: fileName };
    });
  
    if (!isSalonDbSuccess(result)) return salonDbFailure(result);
    return { success: true as const, documentUrl: result.data.documentUrl };
  }

export async function saveSalonAmenities(
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }>
) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await syncSalonAmenitiesForSalon(supabase, ctx.salonId, amenitiesData);
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, "Run packages/db/AMENITIES_PATCH.sql if amenities fail to save.");
  }
  return { success: true as const };
}

export async function updateSalonMediaFields(payload: {
  logo_url?: string | null;
  cover_url?: string | null;
  hero_url?: string | null;
  featured_images?: string[];
}) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { error } = await supabase.from("salons").update(payload).eq("id", ctx.salonId);
    if (error) throw new Error(error.message);
    revalidateOwnerSalonPage(ctx.salon);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function saveSalonProfile(input: {
  profile: Record<string, unknown>;
  amenityRows: Record<string, unknown>[];
}) {
  try {
    const result = await withSalonDb(async (supabase, ctx) => {
      const profile = await applySalonSlugOnNameChange(
        supabase,
        ctx.salonId,
        pickSalonProfileUpdate(input.profile)
      );
      const salonSchedule = parseSalonScheduleFromWorkingHours(profile.working_hours);

      const { error: profileError } = await supabase
        .from("salons")
        .update(profile)
        .eq("id", ctx.salonId);
      if (profileError) throw new Error(profileError.message);

      if (profile.working_hours != null) {
        await syncSalonOperatingHours(supabase, ctx.salonId, profile.working_hours);
      }

      if (Object.keys(salonSchedule).length > 0) {
        const { data: staffList, error: staffReadError } = await supabase
          .from("salon_staff")
          .select("id, working_hours")
          .eq("salon_id", ctx.salonId);
        if (staffReadError) throw new Error(staffReadError.message);

        for (const staff of staffList || []) {
          let staffModified = false;
          const workingHours =
            staff.working_hours && typeof staff.working_hours === "object" && !Array.isArray(staff.working_hours)
              ? (staff.working_hours as Record<string, unknown>)
              : {};
          const currentStaffSchedule =
            workingHours.schedule && typeof workingHours.schedule === "object" && !Array.isArray(workingHours.schedule)
              ? (workingHours.schedule as Record<string, { isWorking?: boolean; start?: string; end?: string }>)
              : {};

          for (const day of Object.keys(salonSchedule)) {
            const salonDay = salonSchedule[day];
            const staffDay = currentStaffSchedule[day];
            if (!staffDay) continue;

            if (!salonDay.isWorking && staffDay.isWorking) {
              staffDay.isWorking = false;
              staffModified = true;
            }

            if (salonDay.isWorking && staffDay.isWorking && staffDay.start && staffDay.end) {
              if (staffDay.start < salonDay.start) {
                staffDay.start = salonDay.start;
                staffModified = true;
              }
              if (staffDay.end > salonDay.end) {
                staffDay.end = salonDay.end;
                staffModified = true;
              }
            }
          }

          if (!staffModified) continue;

          const nextWorkingHours = {
            ...workingHours,
            schedule: currentStaffSchedule,
          };

          const { error: staffUpdateError } = await supabase
            .from("salon_staff")
            .update({
              working_hours: nextWorkingHours,
            })
            .eq("id", staff.id);
          if (staffUpdateError) throw new Error(staffUpdateError.message);
          await syncStaffSchedules(supabase, staff.id, nextWorkingHours);
        }
      }

      const { error: deleteAmenitiesError } = await supabase
        .from("salon_amenities")
        .delete()
        .eq("salon_id", ctx.salonId);

      if (deleteAmenitiesError) {
        const lower = deleteAmenitiesError.message.toLowerCase();
        if (!lower.includes("does not exist") && !lower.includes("schema cache")) {
          throw new Error(deleteAmenitiesError.message);
        }
      } else if (input.amenityRows.length > 0) {
        const rows = input.amenityRows.map((row) => ({
          amenity_id: row.amenity_id,
          value: row.value,
          salon_id: ctx.salonId,
        }));
        const { error: insertAmenitiesError } = await supabase.from("salon_amenities").insert(rows);
        if (insertAmenitiesError) throw new Error(insertAmenitiesError.message);
      }

      await refreshSalonOnboardingScore(supabase, ctx.salonId);
      await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon, profile);
    });

    if (!isSalonDbSuccess(result)) {
      return salonDbFailure(result, "Run packages/db/AMENITIES_PATCH.sql if amenities fail to save.");
    }
    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save salon profile.";
    return { success: false as const, error: message };
  }
}

export async function completeSalonOwnerOnboarding(ownerEmail: string | null | undefined) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: salon, error: readError } = await supabase
      .from("salons")
      .select(SALON_ONBOARDING_SELECT)
      .eq("id", ctx.salonId)
      .single();

    if (readError) throw new Error(readError.message);

    const approvalEmail = ownerEmail || ctx.email;
    if (!canSubmitForBookingApproval(salon as SalonOnboardingSnapshot, approvalEmail)) {
      const missing = getBookingApprovalMissingFields(salon as SalonOnboardingSnapshot, approvalEmail);
      throw new Error(`Add ${missing.join(", ")} before submitting for booking approval.`);
    }

    let assignTo = (salon.assign_to as string | null) || null;
    if (!assignTo) {
      assignTo = await resolveOnboardingAgentForSalon(supabase, {
        city: salon.city as string | null,
        address: salon.address as string | null,
      });
    }

    const updatePayload: Record<string, unknown> = {
      onboarding_status: "OWNER_ACTIVATED",
      owner_activated_at: new Date().toISOString(),
      owner_email: approvalEmail,
      booking_enabled: false,
    };
    if (assignTo && assignTo !== salon.assign_to) {
      updatePayload.assign_to = assignTo;
    }

    const { error } = await supabase.from("salons").update(updatePayload).eq("id", ctx.salonId);
    if (error) throw new Error(error.message);

    await refreshSalonOnboardingScore(supabase, ctx.salonId);

    await supabase.from("onboarding_logs").insert({
      salon_id: ctx.salonId,
      actor_email: approvalEmail,
      action: "OWNER_ACTIVATED",
      notes: assignTo
        ? `Owner submitted for booking approval. Assigned agent: ${assignTo}.`
        : "Owner submitted for booking approval. No field agent assigned — admin review required.",
    });

    return {
      salonId: ctx.salonId,
      salonName: String(salon.name || "Salon"),
      salonAddress: (salon.address as string | null) || null,
      assignTo,
      ownerEmail: approvalEmail,
      sourceType: (salon.source_type as string | null) || null,
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  void notifyOwnerSubmittedForBookingApproval(createSupabaseAdminClient(), {
    salonId: result.data.salonId,
    salonName: result.data.salonName,
    salonAddress: result.data.salonAddress,
    assignToEmail: result.data.assignTo,
    ownerEmail: result.data.ownerEmail,
    sourceType: result.data.sourceType,
  }).catch((err) => console.error("Owner submission notification failed:", err));

  return { success: true as const };
}

export async function saveOwnerVerificationData(
  updatePayload: any,
  servicesData: {
    svcsToAdd: any[];
    svcsToRemoveIds: string[];
  } | null,
  staffToAdd: any[] | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null = null
) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const finalPayload = await applySalonSlugOnNameChange(supabase, ctx.salonId, {
      ...updatePayload,
    });

    // 2. Update Salon Data
    const { error: updateError } = await supabase
      .from("salons")
      .update(finalPayload)
      .eq("id", ctx.salonId);

    if (updateError) throw new Error(updateError.message);

    if (finalPayload.working_hours != null) {
      await syncSalonOperatingHours(supabase, ctx.salonId, finalPayload.working_hours);
    }

    // 2. Sync Services
    if (servicesData) {
      if (servicesData.svcsToRemoveIds.length > 0) {
        const { error: s2 } = await supabase
          .from("services")
          .delete()
          .in("id", servicesData.svcsToRemoveIds)
          .eq("salon_id", ctx.salonId);
        if (s2) throw new Error(s2.message);
      }

      if (servicesData.svcsToAdd.length > 0) {
        const { error: s1 } = await supabase
          .from("services")
          .insert(servicesData.svcsToAdd.map((s) => ({ ...s, salon_id: ctx.salonId })));
        if (s1) throw new Error(s1.message);
      }
    }

    // 3. Add Staff (new rows only — existing staff already live in DB)
    if (staffToAdd && staffToAdd.length > 0) {
      const newStaffRows = staffToAdd
        .map((staff) => normalizeSalonStaffInsertRow(staff, ctx.salonId))
        .filter((row): row is Record<string, unknown> => row !== null);
      if (newStaffRows.length > 0) {
        const { data: insertedStaff, error: staffErr } = await supabase
          .from("salon_staff")
          .insert(newStaffRows)
          .select("id, working_hours");
        if (staffErr) throw new Error(staffErr.message);
        for (const staff of insertedStaff || []) {
          if (staff.working_hours != null) {
            await syncStaffSchedules(supabase, staff.id as string, staff.working_hours);
          }
        }
      }
    }

    // 4. Sync Amenities
    if (amenitiesData) {
      await syncSalonAmenitiesForSalon(supabase, ctx.salonId, amenitiesData);
    }

    await refreshSalonOnboardingScore(supabase, ctx.salonId);
    await publishSalonCatalogUpdates(supabase, ctx.salonId, ctx.salon, finalPayload);
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, "Run packages/db/AMENITIES_PATCH.sql if amenities fail to save.");
  }
  return { success: true as const };
}
