"use server";

import { revalidatePath } from "next/cache";
import { sendBookingConfirmedEmail, sendBookingRescheduledEmail } from "@/app/actions/email-settings";
import { sendWhatsAppNotification, sendWhatsAppRescheduleNotification } from "@/app/actions/whatsapp";
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
  isOperationsComplete,
  type SalonOnboardingSnapshot,
} from "@/lib/salon-onboarding-progress";

async function refreshSalonOnboardingScore(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string
) {
  const { data, error } = await supabase
    .from("salons")
    .select(
      "name, description, phone, address, logo_url, cover_url, working_hours, business_info_extended, bank_info, is_verified, onboarding_status"
    )
    .eq("id", salonId)
    .single();

  if (error || !data) return;

  const score = calculateSalonOnboardingScore(data as SalonOnboardingSnapshot);
  await supabase.from("salons").update({ onboarding_completion_score: score }).eq("id", salonId);
}

function revalidateOwnerSalonPage(salon: Record<string, unknown>) {
  const slug = typeof salon.slug === "string" ? salon.slug.trim() : "";
  if (slug) revalidatePath(`/salons/${slug}`);
  if (salon.id != null) revalidatePath(`/salons/${String(salon.id)}`);
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
    if (booking.status !== "pending") {
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

export async function rescheduleOwnerBooking(
  bookingId: string,
  bookingDate: string,
  bookingTime: string
) {
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
      bookingDate,
      bookingTime,
      approvePendingRequest: hadPendingRescheduleRequest,
      clearRescheduleRequest: hadPendingRescheduleRequest,
    });

    bookingNo = booking.booking_no as string;
    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  if (bookingNo) {
    void sendWhatsAppRescheduleNotification(bookingNo);
    void sendBookingRescheduledEmail(bookingNo);
  }

  return { success: true as const, bookingNo };
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
  const result = await withSalonDb(async (supabase, ctx) => {
    const rows = payloads.map((row) => ({ ...row, salon_id: ctx.salonId }));
    const { error } = await supabase.from("salon_promotion_packages").insert(rows);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function deleteSalonPromotionPackage(packageId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("salon_promotion_packages")
      .delete()
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function updateSalonPromotionPackage(packageId: string, payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("salon_promotion_packages")
      .update(payload)
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function insertSalonServices(payloads: Record<string, unknown>[]) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const staff = await loadSalonStaffForCoverage(supabase, ctx.salonId);
    if (!salonHasActiveStaff(staff)) {
      throw new Error(STAFF_REQUIRED_BEFORE_SERVICES_MSG);
    }

    const rows = payloads.map((row) => ({
      ...row,
      salon_id: ctx.salonId,
      status: "inactive",
    }));
    const { error } = await supabase.from("services").insert(rows);
    if (error) throw new Error(error.message);
    await syncStaffServiceAssignmentsForSalon(supabase, ctx.salonId);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function updateSalonService(serviceId: string, payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonService(supabase, ctx, serviceId);

    if (payload.status === "active") {
      const staff = await loadSalonStaffForCoverage(supabase, ctx.salonId);
      if (!salonHasActiveStaff(staff)) {
        throw new Error(STAFF_REQUIRED_BEFORE_SERVICES_MSG);
      }
      if (!isServiceCoveredByStaff(serviceId, staff)) {
        throw new Error(SERVICE_NEEDS_STAFF_MSG);
      }
    }

    const { error } = await supabase.from("services").update(payload).eq("id", serviceId);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function deleteSalonService(serviceId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonService(supabase, ctx, serviceId);
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
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
    revalidateOwnerSalonPage(ctx.salon);
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
    revalidateOwnerSalonPage(ctx.salon);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function deleteSalonStaff(staffId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonStaffMember(supabase, ctx, staffId);
    const { error } = await supabase.from("salon_staff").delete().eq("id", staffId);
    if (error) throw new Error(error.message);
    revalidateOwnerSalonPage(ctx.salon);
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
      .select(
        "name, description, phone, address, logo_url, cover_url, working_hours, business_info_extended, bank_info, is_verified, onboarding_status"
      )
      .eq("id", ctx.salonId)
      .single();

    if (readError) throw new Error(readError.message);
    if (!isOperationsComplete(salon as SalonOnboardingSnapshot)) {
      throw new Error(
        "Complete operational details (description, contact, address, logo, cover, and working hours) before submitting for booking approval."
      );
    }

    const { error } = await supabase
      .from("salons")
      .update({
        onboarding_status: "OWNER_ACTIVATED",
        owner_activated_at: new Date().toISOString(),
        owner_email: ownerEmail || ctx.email,
        booking_enabled: false,
      })
      .eq("id", ctx.salonId);
    if (error) throw new Error(error.message);

    await refreshSalonOnboardingScore(supabase, ctx.salonId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
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
        await syncStaffServiceAssignmentsForSalon(supabase, ctx.salonId);
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
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, "Run packages/db/AMENITIES_PATCH.sql if amenities fail to save.");
  }
  return { success: true as const };
}
