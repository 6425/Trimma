/** Single source of truth for WhatsApp template defaults and admin UI metadata. */

export const WHATSAPP_TEMPLATE_DEFAULTS = {
  confirmed: `Hi {customer_name}! 🌟

Your appointment at *{salon_name}* has been successfully secured!

📅 *Date:* {booking_date}
⏰ *Time:* {booking_time}
💇 *Service:* {service_name}
💰 *Total Price:* LKR {total_price}
✅ *20% Deposit Paid:* LKR {deposit_paid}
💵 *Balance to pay at salon:* LKR {balance_to_pay}

📍 *Salon Location:* {salon_address}
🗺️ *Navigate on Google Maps:* {maps_link}

Thank you for choosing Trimma! See you soon! ✂️`,

  rescheduled: `Hi {customer_name}! 🌟

Your appointment at *{salon_name}* has been successfully *RESCHEDULED* to a new date and time!

📅 *New Date:* {booking_date}
⏰ *New Time:* {booking_time}
💇 *Service:* {service_name}

📍 *Salon Location:* {salon_address}
🗺️ *Navigate on Google Maps:* {maps_link}

Thank you for choosing Trimma! See you soon! ✂️`,

  cancelled: `Hello {customer_name},

This is to notify you that your appointment at *{salon_name}* has been *CANCELLED* by the salon.

📅 *Original Date:* {booking_date}
⏰ *Original Time:* {booking_time}
💇 *Service:* {service_name}

Your 20% online reservation deposit is non-refundable. For any questions about your booking, please contact *{salon_name}* directly.

Trimma Notification Services ✂️`,

  review: `Hi {customer_name}! 🌟

How was your styling at *{salon_name}* today? We would love to hear your feedback!

Rate your stylist and share your experience here: {review_link}

Thank you for choosing Trimma! ✂️`,

  onboardingInvite: `Hi {salon_name} Owner! 🌟

Your Trimma Salon Partner Profile is ready!

Please login using your registered Gmail: {owner_gmail}

Login securely here: {login_link}

Welcome to Trimma! ✂️`,

  bookingCreatedCustomer: `Hello {customer_name}! 🌟

Your booking request at *{salon_name}* for *{service_name}* on {booking_date} at {booking_time} has been received and is currently *PENDING* confirmation from the salon.

We will notify you once they confirm! ✂️`,

  bookingCreatedOwner: `🔔 *NEW BOOKING REQUEST* 🔔

You have a new booking request from {customer_name}.

📅 Date: {booking_date}
⏰ Time: {booking_time}
💇 Service: {service_name}
💳 Payment Status: {payment_status}

Please open your Trimma Dashboard to Confirm or Decline this request.`,

  agentApprovalOwner: `🎉 *Congratulations from Trimma!* 🎉

Your salon, *{salon_name}*, has been approved by your assigned agent and is now *LIVE* for bookings on the marketplace! 🚀

The platform admin will now review your profile to grant you the official *Approved* badge.`,

  agentApprovalAdmin: `🔔 *AGENT APPROVAL ALERT* 🔔

Salon *{salon_name}* has just been approved by their agent and is now live.

Please review their profile in the Admin Dashboard to grant them the *Approved Badge*.`,

  adminApprovalOwner: `🌟 *TRIMMA VERIFIED STATUS ACHIEVED!* 🌟

Congratulations! The Trimma Admin Team has reviewed your profile and officially granted *{salon_name}* the *Approved Badge*! ✅

This badge builds trust with customers and boosts your visibility.`,

  adminApprovalAdmin: `✅ *BADGE GRANTED* ✅

You have successfully verified and granted the Approved Badge to *{salon_name}*.`,
} as const;

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATE_DEFAULTS;

export const WHATSAPP_TRIGGER_CATALOG = [
  {
    id: "confirmed",
    order: 1,
    title: "Booking Confirmed Receipt",
    whenFired: "After successful checkout payment, or when the salon confirms a pending booking.",
    toggleKey: "bookingConfirmedEnabled" as const,
    templateKey: "templateConfirmed" as const,
    defaultTemplate: "confirmed" as const,
    mergeTags: [
      "{customer_name}",
      "{salon_name}",
      "{booking_date}",
      "{booking_time}",
      "{service_name}",
      "{total_price}",
      "{deposit_paid}",
      "{balance_to_pay}",
      "{salon_address}",
      "{maps_link}",
    ],
  },
  {
    id: "rescheduled",
    order: 2,
    title: "Booking Rescheduled Alert",
    whenFired: "When a salon or admin approves a reschedule request with a new date/time.",
    toggleKey: "bookingRescheduledEnabled" as const,
    templateKey: "templateRescheduled" as const,
    defaultTemplate: "rescheduled" as const,
    mergeTags: [
      "{customer_name}",
      "{salon_name}",
      "{booking_date}",
      "{booking_time}",
      "{service_name}",
      "{salon_address}",
      "{maps_link}",
    ],
  },
  {
    id: "cancelled",
    order: 3,
    title: "Booking Cancelled Alert",
    whenFired: "When the salon owner cancels a booking from the dashboard. No refund is processed in Trimma.",
    toggleKey: "bookingCancelledEnabled" as const,
    templateKey: "templateCancelled" as const,
    defaultTemplate: "cancelled" as const,
    mergeTags: ["{customer_name}", "{salon_name}", "{booking_date}", "{booking_time}", "{service_name}"],
  },
  {
    id: "review",
    order: 4,
    title: "Feedback Review Prompt",
    whenFired: "When the salon marks a booking as completed.",
    toggleKey: "bookingReviewEnabled" as const,
    templateKey: "templateReview" as const,
    defaultTemplate: "review" as const,
    mergeTags: ["{customer_name}", "{salon_name}", "{review_link}"],
  },
  {
    id: "onboarding",
    order: 5,
    title: "Salon Onboarding Invitation",
    whenFired: "When admin or agent sends a partner login invite after salon verification.",
    toggleKey: "onboardingInviteEnabled" as const,
    templateKey: "templateOnboardingInvite" as const,
    defaultTemplate: "onboardingInvite" as const,
    mergeTags: ["{salon_name}", "{owner_gmail}", "{login_link}"],
  },
  {
    id: "booking-created-customer",
    order: 6,
    title: "New Booking — Customer (Pending)",
    whenFired: "When a booking is created in pending state (legacy booking sheet flow).",
    toggleKey: "bookingCreatedEnabled" as const,
    templateKey: "templateBookingCreatedCustomer" as const,
    defaultTemplate: "bookingCreatedCustomer" as const,
    mergeTags: [
      "{customer_name}",
      "{salon_name}",
      "{service_name}",
      "{booking_date}",
      "{booking_time}",
    ],
  },
  {
    id: "booking-created-owner",
    order: 7,
    title: "New Booking — Salon Owner Alert",
    whenFired: "Sent to the salon phone when a pending booking request is created.",
    toggleKey: "bookingCreatedEnabled" as const,
    templateKey: "templateBookingCreatedOwner" as const,
    defaultTemplate: "bookingCreatedOwner" as const,
    mergeTags: [
      "{customer_name}",
      "{salon_name}",
      "{service_name}",
      "{booking_date}",
      "{booking_time}",
      "{payment_status}",
    ],
    sharesToggleWith: "booking-created-customer",
  },
  {
    id: "agent-approval-owner",
    order: 8,
    title: "Agent Approval — Salon Owner",
    whenFired: "When an agent approves a salon to go live on the marketplace.",
    toggleKey: "agentApprovalEnabled" as const,
    templateKey: "templateAgentApprovalOwner" as const,
    defaultTemplate: "agentApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "agent-approval-admin",
    order: 9,
    title: "Agent Approval — Platform Admin",
    whenFired: "Internal alert to the admin phone when an agent approves a salon.",
    toggleKey: "agentApprovalEnabled" as const,
    templateKey: "templateAgentApprovalAdmin" as const,
    defaultTemplate: "agentApprovalAdmin" as const,
    mergeTags: ["{salon_name}"],
    sharesToggleWith: "agent-approval-owner",
  },
  {
    id: "admin-approval-owner",
    order: 10,
    title: "Admin Verified Badge — Salon Owner",
    whenFired: "When platform admin grants the official Approved badge.",
    toggleKey: "adminApprovalEnabled" as const,
    templateKey: "templateAdminApprovalOwner" as const,
    defaultTemplate: "adminApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "admin-approval-admin",
    order: 11,
    title: "Admin Verified Badge — Confirmation",
    whenFired: "Confirmation copy sent to the platform admin phone after granting a badge.",
    toggleKey: "adminApprovalEnabled" as const,
    templateKey: "templateAdminApprovalAdmin" as const,
    defaultTemplate: "adminApprovalAdmin" as const,
    mergeTags: ["{salon_name}"],
    sharesToggleWith: "admin-approval-owner",
  },
] as const;
