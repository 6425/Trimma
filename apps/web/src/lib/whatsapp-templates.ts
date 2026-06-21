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
    id: "confirmed",
    order: 2,
    title: "Booking Confirmed (Template 2 — Confirmation)",
    whenFired:
      "When the booking is confirmed (sent at checkout after payment, or when the salon owner confirms a legacy pending booking). Uses your Meta-approved Template 2 when configured.",
    toggleKey: "bookingConfirmedEnabled" as const,
    templateKey: "templateConfirmed" as const,
    metaTemplateKey: "metaTemplateConfirmed" as const,
    defaultTemplate: "confirmed" as const,
    mergeTags: [
      "{customer_name}",
      "{booking_no}",
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
    order: 3,
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
    order: 4,
    title: "Booking Cancelled Alert",
    whenFired: "When the salon owner cancels a booking from the dashboard.",
    toggleKey: "bookingCancelledEnabled" as const,
    templateKey: "templateCancelled" as const,
    defaultTemplate: "cancelled" as const,
    mergeTags: ["{customer_name}", "{salon_name}", "{booking_date}", "{booking_time}", "{service_name}"],
  },
  {
    id: "review",
    order: 5,
    title: "Feedback Review Prompt",
    whenFired: "When the salon marks a booking as completed.",
    toggleKey: "bookingReviewEnabled" as const,
    templateKey: "templateReview" as const,
    defaultTemplate: "review" as const,
    mergeTags: ["{customer_name}", "{salon_name}", "{review_link}"],
  },
  {
    id: "onboarding",
    order: 6,
    title: "Salon Onboarding Invitation",
    whenFired: "When admin or agent sends a partner login invite after salon verification.",
    toggleKey: "onboardingInviteEnabled" as const,
    templateKey: "templateOnboardingInvite" as const,
    defaultTemplate: "onboardingInvite" as const,
    mergeTags: ["{salon_name}", "{owner_gmail}", "{login_link}", "{draft_link}"],
  },
  {
    id: "booking-created-customer",
    order: 7,
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
    order: 8,
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
    order: 9,
    title: "Agent Approval — Salon Owner",
    whenFired: "When an agent approves a salon to go live on the marketplace.",
    toggleKey: "agentApprovalEnabled" as const,
    templateKey: "templateAgentApprovalOwner" as const,
    defaultTemplate: "agentApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "agent-approval-admin",
    order: 10,
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
    order: 11,
    title: "Admin Verified Badge — Salon Owner",
    whenFired: "When platform admin grants the official Verified badge.",
    toggleKey: "adminApprovalEnabled" as const,
    templateKey: "templateAdminApprovalOwner" as const,
    defaultTemplate: "adminApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "admin-approval-admin",
    order: 12,
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
    order: 13,
    title: "Welcome — New Customer",
    whenFired: "After a customer completes signup (first successful login).",
    toggleKey: "welcomeCustomerEnabled" as const,
    templateKey: "templateWelcomeCustomer" as const,
    defaultTemplate: "welcomeCustomer" as const,
    mergeTags: ["{customer_name}", "{dashboard_link}"],
  },
  {
    id: "agent-lead-assigned",
    order: 14,
    title: "Lead Assigned — Field Agent",
    whenFired: "When a salon lead is assigned to an agent.",
    toggleKey: "agentLeadAssignedEnabled" as const,
    templateKey: "templateAgentLeadAssigned" as const,
    defaultTemplate: "agentLeadAssigned" as const,
    mergeTags: ["{agent_name}", "{salon_name}", "{salon_address}", "{onboarding_status}", "{dashboard_link}"],
  },
] as const;
