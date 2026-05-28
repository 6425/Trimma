"use server";

import { sendBookingConfirmedEmail } from "@/app/actions/email-settings";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
import { markBookingNotificationsRead } from "@/lib/salon-owner-notifications";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import {
  parseSalonScheduleFromWorkingHours,
  pickSalonProfileUpdate,
  slugifySalonName,
} from "@/lib/salon-profile-save";

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
    const rows = payloads.map((row) => ({ ...row, salon_id: ctx.salonId }));
    const { error } = await supabase.from("services").insert(rows);
    if (error) throw new Error(error.message);
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function updateSalonService(serviceId: string, payload: Record<string, unknown>) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonService(supabase, ctx, serviceId);
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
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function deleteSalonStaff(staffId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonStaffMember(supabase, ctx, staffId);
    const { error } = await supabase.from("salon_staff").delete().eq("id", staffId);
    if (error) throw new Error(error.message);
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
      const profile = pickSalonProfileUpdate(input.profile);
      const salonSchedule = parseSalonScheduleFromWorkingHours(profile.working_hours);

      if (typeof profile.name === "string" && profile.name.trim()) {
        const nextSlug = slugifySalonName(profile.name);
        if (nextSlug) {
          const { data: slugOwner, error: slugError } = await supabase
            .from("salons")
            .select("id")
            .eq("slug", nextSlug)
            .maybeSingle();
          if (slugError) throw new Error(slugError.message);
          profile.slug =
            !slugOwner || slugOwner.id === ctx.salonId
              ? nextSlug
              : `${nextSlug}-${String(ctx.salonId).slice(0, 8)}`;
        }
      }

      const { error: profileError } = await supabase
        .from("salons")
        .update(profile)
        .eq("id", ctx.salonId);
      if (profileError) throw new Error(profileError.message);

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

          const { error: staffUpdateError } = await supabase
            .from("salon_staff")
            .update({
              working_hours: {
                ...workingHours,
                schedule: currentStaffSchedule,
              },
            })
            .eq("id", staff.id);
          if (staffUpdateError) throw new Error(staffUpdateError.message);
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
    const { error } = await supabase
      .from("salons")
      .update({
        onboarding_status: "OWNER_ACTIVATED",
        status: "pending_verification",
        owner_activated_at: new Date().toISOString(),
        owner_email: ownerEmail || ctx.email,
      })
      .eq("id", ctx.salonId);
    if (error) throw new Error(error.message);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}
