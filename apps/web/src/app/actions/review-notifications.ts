"use server";

import { sendReviewRequestEmail } from "@/app/actions/email-settings";
import { sendReviewRequestAlert } from "@/app/actions/whatsapp";

/** Send review request channels after a booking is successfully marked completed. */
export async function sendBookingReviewRequests(bookingNo: string) {
  if (!bookingNo) return { success: false as const, error: "Missing booking number." };

  const [whatsappResult, emailResult] = await Promise.all([
    sendReviewRequestAlert(bookingNo),
    sendReviewRequestEmail(bookingNo),
  ]);

  return {
    success: true as const,
    whatsapp: whatsappResult,
    email: emailResult,
  };
}
