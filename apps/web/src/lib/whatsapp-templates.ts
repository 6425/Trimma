/** Single source of truth for WhatsApp template defaults and admin UI metadata. */

export const WHATSAPP_TEMPLATE_DEFAULTS = {
  reservationPaid: `Hi {customer_name}! 🎉

Great news — your *20% reservation payment* for *{salon_name}* went through successfully! Your time slot is now *locked* 🔒

📋 Ref: {booking_no}
📅 {booking_date} · ⏰ {booking_time}
💇 {service_name}
✅ Paid: LKR {deposit_paid}
💵 Balance at salon: LKR {balance_to_pay}

Thank you for booking with Trimma 💛`,

  confirmed: `Hi {customer_name}! 🌟

*{salon_name}* has *confirmed* your appointment — you're all set!

📋 Ref: {booking_no}
📅 *Date:* {booking_date}
⏰ *Time:* {booking_time}
💇 *Service:* {service_name}
💰 *Total:* LKR {total_price}
✅ *Deposit paid:* LKR {deposit_paid}
💵 *Balance at salon:* LKR {balance_to_pay}

📍 *Location:* {salon_address}
🗺️ *Directions:* {maps_link}

See you soon! ✂️`,

  appointmentReminder: `Hi {customer_name}! ⏰

Friendly reminder from *{salon_name}* about your upcoming appointment.

📋 Ref: {booking_no}
📅 *Date:* {booking_date}
⏰ *Time:* {booking_time}
💇 *Service:* {service_name}

📍 *Location:* {salon_address}
🗺️ *Directions:* {maps_link}

We look forward to seeing you! ✂️`,

  rescheduled: `Hi {customer_name}! 🌟

Your appointment at *{salon_name}* has been *rescheduled* to a new date and time.

📅 *New date:* {booking_date}
⏰ *New time:* {booking_time}
💇 *Service:* {service_name}

📍 *Location:* {salon_address}
🗺️ *Directions:* {maps_link}

Thank you for choosing Trimma! ✂️`,

  noShow: `Hello {customer_name},

Your appointment at *{salon_name}* was marked as a *no-show* because you did not attend the scheduled visit.

📅 *Original date:* {booking_date}
⏰ *Original time:* {booking_time}
💇 *Service:* {service_name}

Your 20% online reservation deposit is non-refundable. Please contact *{salon_name}* directly with any questions.

Trimma Notification Services ✂️`,

  cancelled: `Hello {customer_name},

Your appointment at *{salon_name}* has been *cancelled* by the salon.

📅 *Original date:* {booking_date}
⏰ *Original time:* {booking_time}
💇 *Service:* {service_name}

Your 20% online reservation deposit is non-refundable. Please contact *{salon_name}* directly with any questions.

Trimma Notification Services ✂️`,

  review: `Hi {customer_name}! 🌟

How was your visit to *{salon_name}*? We'd love your feedback!

⭐ Leave a review here: {review_link}

Thank you for choosing Trimma! ✂️`,

  onboardingInvite: `Hi {salon_name} team! 🌟

Your Trimma Partner Profile is ready to go live!

Please sign in with your registered Gmail: {owner_gmail}

🔐 Activate here: {login_link}
👀 View Draft: {draft_link}

Welcome to the Trimma partner network! ✂️`,

  bookingCreatedCustomer: `Hello {customer_name}! 🌟

We received your booking request at *{salon_name}* for *{service_name}* on {booking_date} at {booking_time}.

Status: *Pending* salon confirmation — we'll notify you once they respond! ✂️`,

  bookingCreatedOwner: `🔔 *NEW BOOKING REQUEST* 🔔

You have a new booking request from *{customer_name}*.

📅 Date: {booking_date}
⏰ Time: {booking_time}
💇 Service: {service_name}
💳 Payment: {payment_status}

Please open your Trimma Dashboard to Confirm or Decline.`,

  agentApprovalOwner: `🎉 *Congratulations from Trimma!* 🎉

Your salon *{salon_name}* has been approved by your agent and is now *LIVE* for bookings! 🚀

The platform admin will review your profile to grant the official *Verified* badge.`,

  agentApprovalAdmin: `🔔 *AGENT APPROVAL ALERT* 🔔

Salon *{salon_name}* was approved by their agent and is now live.

Please review their profile in Admin → Salons to grant the *Verified Badge*.`,

  adminApprovalOwner: `🌟 *TRIMMA VERIFIED!* 🌟

Congratulations! *{salon_name}* has officially received the Trimma *Verified Badge*! ✅

This builds trust with customers and boosts your visibility.`,

  adminApprovalAdmin: `✅ *BADGE GRANTED* ✅

You have successfully granted the Verified Badge to *{salon_name}*.`,

  welcomeCustomer: `Hi {customer_name}! 👋

Welcome to *Trimma* — Sri Lanka's beauty & wellness booking platform!

Browse salons, book appointments, and manage your visits in one place.

Start exploring: {dashboard_link} ✨`,

  agentLeadAssigned: `Hi {agent_name}! 📍

A new salon lead has been assigned to you:

🏪 *{salon_name}*
📍 {salon_address}
📋 Status: {onboarding_status}

Open the field editor: {dashboard_link}`,
} as const;

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATE_DEFAULTS;

export const WHATSAPP_TRIGGER_CATALOG = [
  {
    id: "reservation-paid",
    order: 1,
    title: "Reservation Payment Received (Template 1 — Slot Locked)",
    whenFired:
      "Immediately after the customer pays the 20% reservation fee and the slot is locked. Uses your Meta-approved Template 1 when configured.",
    toggleKey: "reservationPaidEnabled" as const,
    templateKey: "templateReservationPaid" as const,
    metaTemplateKey: "metaTemplateReservationPaid" as const,
    defaultTemplate: "reservationPaid" as const,
    mergeTags: [
      "{customer_name}",
      "{booking_no}",
      "{salon_name}",
      "{booking_date}",
      "{booking_time}",
      "{service_name}",
      "{deposit_paid}",
      "{balance_to_pay}",
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
    whenFired: "When the salon owner cancels a booking from the dashboard.",
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
    mergeTags: ["{salon_name}", "{owner_gmail}", "{login_link}", "{draft_link}"],
  },
  {
    id: "booking-created-owner",
    order: 6,
    title: "New Booking — Salon Owner Alert",
    whenFired:
      "Sent to the salon WhatsApp/phone on profile when a customer pays a reservation. Requires a Meta-approved template (see block above trigger #6).",
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
    metaTemplateKey: "metaTemplateBookingCreatedOwner" as const,
    metaParameterHint:
      "appointment_confirmation_1: {{1}} customer, {{2}} salon, {{3}} service, {{4}} date, {{5}} time.",
  },
  {
    id: "agent-approval-owner",
    order: 7,
    title: "Agent Approval — Salon Owner",
    whenFired: "When an agent approves a salon to go live on the marketplace.",
    toggleKey: "agentApprovalEnabled" as const,
    templateKey: "templateAgentApprovalOwner" as const,
    defaultTemplate: "agentApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "agent-approval-admin",
    order: 8,
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
    order: 9,
    title: "Admin Verified Badge — Salon Owner",
    whenFired: "When platform admin grants the official Verified badge.",
    toggleKey: "adminApprovalEnabled" as const,
    templateKey: "templateAdminApprovalOwner" as const,
    defaultTemplate: "adminApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "admin-approval-admin",
    order: 10,
    title: "Admin Verified Badge — Confirmation",
    whenFired: "Confirmation copy sent to the platform admin phone after granting a badge.",
    toggleKey: "adminApprovalEnabled" as const,
    templateKey: "templateAdminApprovalAdmin" as const,
    defaultTemplate: "adminApprovalAdmin" as const,
    mergeTags: ["{salon_name}"],
    sharesToggleWith: "admin-approval-owner",
  },
  {
    id: "welcome-customer",
    order: 11,
    title: "Welcome — New Customer",
    whenFired: "After a customer completes signup (first successful login).",
    toggleKey: "welcomeCustomerEnabled" as const,
    templateKey: "templateWelcomeCustomer" as const,
    defaultTemplate: "welcomeCustomer" as const,
    mergeTags: ["{customer_name}", "{dashboard_link}"],
  },
  {
    id: "agent-lead-assigned",
    order: 12,
    title: "Lead Assigned — Field Agent",
    whenFired: "When a salon lead is assigned to an agent.",
    toggleKey: "agentLeadAssignedEnabled" as const,
    templateKey: "templateAgentLeadAssigned" as const,
    defaultTemplate: "agentLeadAssigned" as const,
    mergeTags: ["{agent_name}", "{salon_name}", "{salon_address}", "{onboarding_status}", "{dashboard_link}"],
  },
] as const;

/** Checkout Meta template — not listed in the legacy trigger catalog. */
export const WHATSAPP_CHECKOUT_META_CONFIG = {
  title: "Checkout booking confirmation (Meta)",
  description:
    "Sent once when the customer completes online payment. This is your working confirmmessage template — not a separate follow-up message.",
  metaTemplateKey: "metaTemplateConfirmed" as const,
  defaultTemplateName: "confirmmessage",
  metaParameterHint:
    "confirmmessage: {{1}} name, {{2}} salon, {{3}} service, {{4}} date, {{5}} time.",
} as const;

/** Salon owner new-booking alert — Meta template required (free text is blocked outside 24h window). */
export const WHATSAPP_OWNER_BOOKING_META_CONFIG = {
  title: "Salon owner new booking alert (Meta)",
  description:
    "Sent to the salon WhatsApp/phone on profile when a customer pays a reservation. Meta template is required — plain text is rejected outside the 24-hour session window.",
  metaTemplateKey: "metaTemplateBookingCreatedOwner" as const,
  defaultTemplateName: "appointment_confirmation_1",
  metaParameterHint:
    "appointment_confirmation_1: {{1}} customer name, {{2}} salon, {{3}} service, {{4}} date, {{5}} time (same order as confirmmessage).",
} as const;
