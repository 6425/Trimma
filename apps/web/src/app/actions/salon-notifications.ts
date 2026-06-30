"use server";

import { sendBookingConfirmedEmail } from "@/app/actions/email-settings";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
import {
  markBookingNotificationsRead,
  type SalonOwnerNotificationMetadata,
  type SalonOwnerNotificationRow,
} from "@/lib/salon-owner-notifications";
import { normalizeEmail } from "@/lib/normalize-email";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";

function ownerNotificationEmails(ctx: {
  email: string;
  salon: Record<string, unknown>;
}): string[] {
  const emails = new Set<string>();
  const authEmail = normalizeEmail(ctx.email);
  if (authEmail) emails.add(authEmail);

  const ownerEmail = normalizeEmail(
    typeof ctx.salon.owner_email === "string" ? ctx.salon.owner_email : null
  );
  const ownerGmail = normalizeEmail(
    typeof ctx.salon.owner_gmail === "string" ? ctx.salon.owner_gmail : null
  );
  if (ownerEmail) emails.add(ownerEmail);
  if (ownerGmail) emails.add(ownerGmail);

  return [...emails];
}

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
    const recipientEmails = ownerNotificationEmails(ctx);
    let query = supabase
      .from("salon_owner_notifications")
      .select("*")
      .eq("salon_id", ctx.salonId)
      .order("created_at", { ascending: false })
      .limit(limit);

    query =
      recipientEmails.length === 1
        ? query.eq("user_email", recipientEmails[0]!)
        : query.in("user_email", recipientEmails);

    const { data, error } = await query;

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
    const recipientEmails = ownerNotificationEmails(ctx);
    let query = supabase
      .from("salon_owner_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("salon_id", ctx.salonId);

    query =
      recipientEmails.length === 1
        ? query.eq("user_email", recipientEmails[0]!)
        : query.in("user_email", recipientEmails);

    const { error } = await query;
    if (error) throw new Error(error.message);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}

export async function markAllSalonNotificationsRead() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const recipientEmails = ownerNotificationEmails(ctx);
    let query = supabase
      .from("salon_owner_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("salon_id", ctx.salonId)
      .is("read_at", null);

    query =
      recipientEmails.length === 1
        ? query.eq("user_email", recipientEmails[0]!)
        : query.in("user_email", recipientEmails);

    const { error } = await query;
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

export async function approveRescheduleFromNotification(
  bookingId: string,
  notificationId?: string
) {
  const { approveOwnerRescheduleRequest } = await import("@/app/actions/salon-operations");
  const result = await approveOwnerRescheduleRequest(bookingId);
  if (result.success === false) return result;

  if (notificationId) {
    await markSalonNotificationRead(notificationId);
  }

  return { success: true as const, bookingNo: result.bookingNo, notifications: result.notifications };
}

export async function rejectRescheduleFromNotification(
  bookingId: string,
  notificationId?: string
) {
  const { rejectOwnerRescheduleRequest } = await import("@/app/actions/salon-operations");
  const result = await rejectOwnerRescheduleRequest(bookingId);
  if (result.success === false) return result;

  if (notificationId) {
    await markSalonNotificationRead(notificationId);
  }

  return { success: true as const };
}

export async function markBookingNotificationsReadForOwner(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await markBookingNotificationsRead(supabase, ctx.salonId, bookingId);
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const };
}
