"use server";

import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";

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
