"use server";

import { sendBookingConfirmedEmail } from "@/app/actions/email-settings";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
import {
  markBookingNotificationsRead,
  type SalonOwnerNotificationMetadata,
  type SalonOwnerNotificationRow,
} from "@/lib/salon-owner-notifications";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";

export type SalonOwnerNotificationItem = {
  id: string;
  bookingId: string | null;
  notificationType: string;
  title: string;
  body: string;
  metadata: SalonOwnerNotificationMetadata;
  readAt: string | null;
  createdAt: string;
  bookingStatus: string | null;
};

function mapNotificationRow(row: SalonOwnerNotificationRow, bookingStatus?: string | null): SalonOwnerNotificationItem {
  return {
    id: row.id,
    bookingId: row.booking_id,
    notificationType: row.notification_type,
    title: row.title,
    body: row.body,
    metadata: (row.metadata || {}) as SalonOwnerNotificationMetadata,
    readAt: row.read_at,
    createdAt: row.created_at,
    bookingStatus: bookingStatus ?? (row.metadata?.booking_status as string | undefined) ?? null,
  };
}

export async function fetchSalonOwnerNotifications(limit = 20) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("salon_owner_notifications")
      .select("*")
      .eq("salon_id", ctx.salonId)
      .eq("user_email", ctx.email)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const rows = (data || []) as SalonOwnerNotificationRow[];
    const bookingIds = rows.map((row) => row.booking_id).filter(Boolean) as string[];

    let bookingStatusMap: Record<string, string> = {};
    if (bookingIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, status")
        .in("id", bookingIds);
      if (bookingsError) throw new Error(bookingsError.message);
      bookingStatusMap = Object.fromEntries((bookings || []).map((b) => [b.id, b.status]));
    }

    const notifications = rows.map((row) =>
      mapNotificationRow(row, row.booking_id ? bookingStatusMap[row.booking_id] : null)
    );

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return { notifications, unreadCount };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function markSalonNotificationRead(notificationId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("salon_owner_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("salon_id", ctx.salonId)
      .eq("user_email", ctx.email);
    if (error) throw new Error(error.message);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function markAllSalonNotificationsRead() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("salon_owner_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("salon_id", ctx.salonId)
      .eq("user_email", ctx.email)
      .is("read_at", null);
    if (error) throw new Error(error.message);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function confirmBookingFromNotification(bookingId: string, notificationId?: string) {
  const { confirmOwnerBooking } = await import("@/app/actions/salon-operations");
  const confirmResult = await confirmOwnerBooking(bookingId);
  if (confirmResult.success === false) return confirmResult;

  if (notificationId) {
    await markSalonNotificationRead(notificationId);
  }

  return { success: true as const, bookingNo: confirmResult.bookingNo };
}

export async function markBookingNotificationsReadForOwner(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}
