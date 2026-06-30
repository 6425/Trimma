import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

export type SalonOwnerNotificationMetadata = {
  booking_no?: string;
  customer_email?: string;
  customer_name?: string;
  booking_date?: string;
  booking_time?: string;
  amount?: number;
  service_name?: string;
  staff_name?: string;
  payment_status?: string;
  booking_status?: string;
};

export type SalonOwnerNotificationRow = {
  id: string;
  user_email: string;
  salon_id: string;
  booking_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  metadata: SalonOwnerNotificationMetadata;
  read_at: string | null;
  created_at: string;
};

export async function resolveSalonOwnerEmail(
  supabase: SupabaseClient,
  salonId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("salons")
    .select("owner_email, owner_gmail")
    .eq("id", salonId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const ownerEmail = normalizeEmail(data?.owner_email) || normalizeEmail(data?.owner_gmail);
  return ownerEmail || null;
}

export async function createBookingPendingConfirmNotification(
  supabase: SupabaseClient,
  input: {
    salonId: string;
    bookingId: string;
    bookingNo: string;
    customerEmail: string;
    customerName: string;
    bookingDate: string;
    bookingTime: string;
    amount: number;
    serviceName: string;
    staffName?: string | null;
    paymentStatus?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail = await resolveSalonOwnerEmail(supabase, input.salonId);
    if (!ownerEmail) {
      return { success: false, error: "Salon owner email not configured." };
    }

    const metadata: SalonOwnerNotificationMetadata = {
      booking_no: input.bookingNo,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      booking_date: input.bookingDate,
      booking_time: input.bookingTime,
      amount: input.amount,
      service_name: input.serviceName,
      staff_name: input.staffName || undefined,
      payment_status: input.paymentStatus || "reservation_paid",
      booking_status: "confirmed",
    };

    const title = `New booking — ${input.bookingNo}`;
    const body = `${input.customerName || input.customerEmail} booked ${input.serviceName} on ${input.bookingDate} at ${input.bookingTime}. The reservation is confirmed — use Bookings to reschedule if needed.`;

    const { error } = await supabase.from("salon_owner_notifications").insert({
      user_email: ownerEmail,
      salon_id: input.salonId,
      booking_id: input.bookingId,
      notification_type: "booking_pending_confirm",
      title,
      body,
      metadata,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        console.warn("salon_owner_notifications table missing — run SALON_OWNER_NOTIFICATIONS_PATCH.sql");
        return { success: false, error: error.message };
      }
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create notification.";
    console.error("createBookingPendingConfirmNotification:", message);
    return { success: false, error: message };
  }
}

export async function createRescheduleRequestNotification(
  supabase: SupabaseClient,
  input: {
    salonId: string;
    bookingId: string;
    bookingNo: string;
    customerEmail: string;
    currentDate: string;
    currentTime: string;
    requestedDate: string;
    requestedTime: string;
    serviceName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail = await resolveSalonOwnerEmail(supabase, input.salonId);
    if (!ownerEmail) {
      return { success: false, error: "Salon owner email not configured." };
    }

    const metadata: SalonOwnerNotificationMetadata = {
      booking_no: input.bookingNo,
      customer_email: input.customerEmail,
      booking_date: input.requestedDate,
      booking_time: input.requestedTime,
      service_name: input.serviceName,
      booking_status: "pending_salon",
    };

    const title = `Reschedule request — ${input.bookingNo}`;
    const body = `${input.customerEmail} requested to move ${input.serviceName} from ${input.currentDate} at ${input.currentTime} to ${input.requestedDate} at ${input.requestedTime.slice(0, 5)}.`;

    const { error } = await supabase.from("salon_owner_notifications").insert({
      user_email: ownerEmail,
      salon_id: input.salonId,
      booking_id: input.bookingId,
      notification_type: "booking_reschedule_request",
      title,
      body,
      metadata,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        console.warn("salon_owner_notifications table missing — run SALON_OWNER_NOTIFICATIONS_PATCH.sql");
        return { success: false, error: error.message };
      }
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create notification.";
    console.error("createRescheduleRequestNotification:", message);
    return { success: false, error: message };
  }
}

export async function createSubscriptionUpgradedNotification(
  supabase: SupabaseClient,
  input: {
    salonId: string;
    planName: string;
    billingCycle: "monthly" | "annual";
    amount: number;
    orderId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail = await resolveSalonOwnerEmail(supabase, input.salonId);
    if (!ownerEmail) {
      return { success: false, error: "Salon owner email not configured." };
    }

    const cycleLabel = input.billingCycle === "annual" ? "Annual" : "Monthly";
    const metadata: SalonOwnerNotificationMetadata = {
      amount: input.amount,
      payment_status: "paid",
    };

    const title = `Subscription updated — ${input.planName}`;
    const body = `Your salon is now on the ${input.planName} plan (${cycleLabel}). Payment reference: ${input.orderId}.`;

    const { error } = await supabase.from("salon_owner_notifications").insert({
      user_email: ownerEmail,
      salon_id: input.salonId,
      booking_id: null,
      notification_type: "subscription_upgraded",
      title,
      body,
      metadata,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        console.warn("salon_owner_notifications table missing — run SALON_OWNER_NOTIFICATIONS_PATCH.sql");
        return { success: false, error: error.message };
      }
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create notification.";
    console.error("createSubscriptionUpgradedNotification:", message);
    return { success: false, error: message };
  }
}

export async function markBookingNotificationsRead(
  supabase: SupabaseClient,
  salonId: string,
  bookingId: string
) {
  const now = new Date().toISOString();
  await supabase
    .from("salon_owner_notifications")
    .update({ read_at: now })
    .eq("salon_id", salonId)
    .eq("booking_id", bookingId)
    .is("read_at", null);
}
