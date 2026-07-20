/** Defaults and admin UI metadata for Resend email triggers (mirrors WhatsApp engagement points). */

import {
  EMAIL_BODY_DEFAULTS_SINHALA,
  EMAIL_BODY_DEFAULTS_TAMIL,
} from "@/lib/email-multilingual-defaults";

export const EMAIL_SUBJECT_DEFAULTS = {
  reservationPaid: "Reservation payment received · {booking_no}",
  confirmed: "Your Trimma appointment is confirmed · {booking_no}",
  appointmentReminder: "Reminder: your Trimma appointment · {booking_no}",
  rescheduled: "Your Trimma appointment was rescheduled",
  cancelled: "Your Trimma appointment was cancelled",
  review: "How was your visit to {salon_name}?",
  onboarding: "Activate {salon_name} on Trimma",
  bookingCreatedCustomer: "Booking request received · {salon_name}",
  bookingCreatedOwner: "New booking request for {salon_name}",
  agentApprovalOwner: "{salon_name} is now live on Trimma",
  agentApprovalAdmin: "Agent approved salon: {salon_name}",
  adminApprovalOwner: "Trimma verified badge granted · {salon_name}",
  adminApprovalAdmin: "Verified badge granted to {salon_name}",
  welcomeCustomer: "Welcome to Trimma, {customer_name}!",
  agentLeadAssigned: "New salon lead assigned: {salon_name}",
  partnerLeadReceived: "We received your Trimma partner application",
  ownerSubmissionRejected: "Action required: {salon_name} profile update",
  subscriptionUpgraded: "Subscription updated · {salon_name}",
} as const;

export const EMAIL_BODY_DEFAULTS = {
  reservationPaid: `Hi {customer_name},

Thank you — your 30% reservation payment was successful and your slot at {salon_name} is now locked.

Reference: {booking_no}
Date: {booking_date}
Time: {booking_time}
Service: {service_name}
Reservation fee paid: LKR {deposit_paid}
Balance at salon: LKR {balance_to_pay}

The salon owner will review and confirm your booking shortly. We will notify you once confirmed.

View your bookings: {dashboard_link}

Thank you for choosing Trimma.`,

  confirmed: `Hi {customer_name},

Great news — {salon_name} has confirmed your appointment!

Reference: {booking_no}
Date: {booking_date}
Time: {booking_time}
Service: {service_name}
Total: LKR {total_price}
Deposit paid: LKR {deposit_paid}
Balance at salon: LKR {balance_to_pay}

Salon address: {salon_address}
Directions: {maps_link}

View your bookings: {dashboard_link}

Thank you for choosing Trimma.`,

  appointmentReminder: `Hi {customer_name},

This is a friendly reminder about your upcoming appointment at {salon_name}.

Reference: {booking_no}
Date: {booking_date}
Time: {booking_time}
Service: {service_name}

Salon address: {salon_address}
Directions: {maps_link}

View your bookings: {dashboard_link}

We look forward to seeing you!`,

  rescheduled: `Hi {customer_name},

Your appointment at {salon_name} has been rescheduled.

New date: {booking_date}
New time: {booking_time}
Service: {service_name}

Salon address: {salon_address}
Directions: {maps_link}`,

  cancelled: `Hello {customer_name},

Your appointment at {salon_name} has been cancelled by the salon.

Original date: {booking_date}
Original time: {booking_time}
Service: {service_name}

The online reservation deposit is non-refundable. Contact {salon_name} directly with any questions.`,

  review: `Hi {customer_name},

How was your styling at {salon_name}? We would love your feedback.

Leave a review: {review_link}

Thank you for choosing Trimma.`,

  onboarding: `Hi there,

Your salon {salon_name} has been verified on Trimma.

Sign in with {owner_gmail} to complete activation and start accepting bookings.

Activate your salon: {login_link}

Welcome to the Trimma partner network.`,

  bookingCreatedCustomer: `Hello {customer_name},

We received your booking request at {salon_name}.

Service: {service_name}
Date: {booking_date}
Time: {booking_time}

Status: Pending salon confirmation. We will notify you once the salon responds.`,

  bookingCreatedOwner: `Hello,

You have a new booking request for {salon_name}.

Customer: {customer_name}
Service: {service_name}
Date: {booking_date}
Time: {booking_time}
Payment status: {payment_status}

Open your dashboard to confirm or decline: {dashboard_link}`,

  agentApprovalOwner: `Congratulations,

Your salon {salon_name} has been approved by your assigned Trimma agent and is now live for bookings.

The platform admin will review your profile to grant the official Verified badge.`,

  agentApprovalAdmin: `Internal alert,

Salon {salon_name} was approved by an agent and is now live.

Review the profile in Admin → Salons to grant the Verified badge.`,

  adminApprovalOwner: `Congratulations,

Trimma has officially granted {salon_name} the Verified badge.

This builds customer trust and improves your visibility on the marketplace.`,

  adminApprovalAdmin: `Confirmation,

You granted the Verified badge to {salon_name}.`,

  welcomeCustomer: `Hi {customer_name},

Welcome to Trimma — Sri Lanka's beauty & wellness booking platform.

Browse salons, book appointments, and manage your visits in one place.

Start exploring: {dashboard_link}`,

  agentLeadAssigned: `Hi {agent_name},

A new salon lead has been assigned to you.

Salon: {salon_name}
Location: {salon_address}
Status: {onboarding_status}

Open the field editor: {dashboard_link}`,
  partnerLeadReceived: `Hi {owner_name},

Thank you for applying to join Trimma as a partner salon.

Business: {salon_name}
Location: {salon_address}

Our team will review your application and contact you shortly. If an agent is available in your area, they will reach out to help you onboard.

Thank you,
The Trimma Team`,

  ownerSubmissionRejected: `Hi there,

Your Trimma agent reviewed the profile for {salon_name} and requested updates before booking approval can continue.

Reason: {rejection_reason}

Please sign in to your salon owner dashboard, make the requested changes, and submit again for approval.

Update profile: {dashboard_link}

Thank you,
The Trimma Team`,

  subscriptionUpgraded: `Hi there,

Your Trimma subscription for {salon_name} has been updated successfully.

Plan: {plan_name}
Billing: {billing_cycle}
Amount paid: LKR {amount_paid}
Reference: {order_id}

Manage billing and invoices: {dashboard_link}

Thank you for growing with Trimma.`,
} as const;

export type EmailSubjectKey = keyof typeof EMAIL_SUBJECT_DEFAULTS;
export type EmailBodyKey = keyof typeof EMAIL_BODY_DEFAULTS;

export const EMAIL_BODY_SINHALA_DEFAULTS = EMAIL_BODY_DEFAULTS_SINHALA;
export const EMAIL_BODY_TAMIL_DEFAULTS = EMAIL_BODY_DEFAULTS_TAMIL;

export const EMAIL_TRIGGER_CATALOG = [
  {
    id: "reservation-paid",
    order: 1,
    title: "Reservation Payment Received",
    recipient: "Customer",
    whenFired:
      "Immediately after the customer pays the 30% reservation fee and the slot is locked. Salon confirmation follows separately.",
    toggleKey: "reservationPaidEnabled" as const,
    subjectKey: "subjectReservationPaid" as const,
    bodyKey: "templateReservationPaid" as const,
    bodyKeySi: "templateReservationPaidSi" as const,
    bodyKeyTa: "templateReservationPaidTa" as const,
    defaultSubject: "reservationPaid" as const,
    defaultBody: "reservationPaid" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "View my bookings",
    mergeTags: [
      "{customer_name}",
      "{booking_no}",
      "{salon_name}",
      "{booking_date}",
      "{booking_time}",
      "{service_name}",
      "{deposit_paid}",
      "{balance_to_pay}",
      "{dashboard_link}",
    ],
  },
  {
    id: "confirmed",
    order: 2,
    title: "Booking Confirmed by Salon",
    recipient: "Customer",
    whenFired: "When the salon owner confirms a reserved booking from their dashboard.",
    toggleKey: "bookingConfirmedEnabled" as const,
    subjectKey: "subjectConfirmed" as const,
    bodyKey: "templateConfirmed" as const,
    bodyKeySi: "templateConfirmedSi" as const,
    bodyKeyTa: "templateConfirmedTa" as const,
    defaultSubject: "confirmed" as const,
    defaultBody: "confirmed" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "View my bookings",
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
      "{dashboard_link}",
    ],
  },
  {
    id: "rescheduled",
    order: 3,
    title: "Booking Rescheduled",
    recipient: "Customer",
    whenFired: "When a salon or admin approves a reschedule with a new date/time.",
    toggleKey: "bookingRescheduledEnabled" as const,
    subjectKey: "subjectRescheduled" as const,
    bodyKey: "templateRescheduled" as const,
    bodyKeySi: "templateRescheduledSi" as const,
    bodyKeyTa: "templateRescheduledTa" as const,
    defaultSubject: "rescheduled" as const,
    defaultBody: "rescheduled" as const,
    ctaVariable: "maps_link" as const,
    ctaLabel: "Get directions",
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
    title: "Booking Cancelled",
    recipient: "Customer",
    whenFired: "When the salon cancels a booking from the dashboard.",
    toggleKey: "bookingCancelledEnabled" as const,
    subjectKey: "subjectCancelled" as const,
    bodyKey: "templateCancelled" as const,
    bodyKeySi: "templateCancelledSi" as const,
    bodyKeyTa: "templateCancelledTa" as const,
    defaultSubject: "cancelled" as const,
    defaultBody: "cancelled" as const,
    mergeTags: ["{customer_name}", "{salon_name}", "{booking_date}", "{booking_time}", "{service_name}"],
  },
  {
    id: "review",
    order: 5,
    title: "Review Request",
    recipient: "Customer",
    whenFired: "When the salon marks a booking as completed.",
    toggleKey: "bookingReviewEnabled" as const,
    subjectKey: "subjectReview" as const,
    bodyKey: "templateReview" as const,
    bodyKeySi: "templateReviewSi" as const,
    bodyKeyTa: "templateReviewTa" as const,
    defaultSubject: "review" as const,
    defaultBody: "review" as const,
    ctaVariable: "review_link" as const,
    ctaLabel: "Leave a review",
    mergeTags: ["{customer_name}", "{salon_name}", "{review_link}"],
  },
  {
    id: "onboarding",
    order: 6,
    title: "Salon Owner Onboarding Invite",
    recipient: "Salon owner",
    whenFired: "When an admin or agent sends a partner login invite after verification.",
    toggleKey: "onboardingInviteEnabled" as const,
    subjectKey: "subjectOnboardingInvite" as const,
    bodyKey: "templateOnboardingInvite" as const,
    bodyKeySi: "templateOnboardingInviteSi" as const,
    bodyKeyTa: "templateOnboardingInviteTa" as const,
    defaultSubject: "onboarding" as const,
    defaultBody: "onboarding" as const,
    ctaVariable: "login_link" as const,
    ctaLabel: "Activate my salon",
    mergeTags: ["{salon_name}", "{owner_gmail}", "{login_link}"],
  },
  {
    id: "booking-created-customer",
    order: 7,
    title: "New Booking — Customer (Pending)",
    recipient: "Customer",
    whenFired: "When a booking is created in pending state (legacy booking sheet flow).",
    toggleKey: "bookingCreatedEnabled" as const,
    subjectKey: "subjectBookingCreatedCustomer" as const,
    bodyKey: "templateBookingCreatedCustomer" as const,
    bodyKeySi: "templateBookingCreatedCustomerSi" as const,
    bodyKeyTa: "templateBookingCreatedCustomerTa" as const,
    defaultSubject: "bookingCreatedCustomer" as const,
    defaultBody: "bookingCreatedCustomer" as const,
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
    title: "New Booking — Salon Owner",
    recipient: "Salon owner",
    whenFired: "When a pending booking request is created for the salon.",
    toggleKey: "bookingCreatedEnabled" as const,
    subjectKey: "subjectBookingCreatedOwner" as const,
    bodyKey: "templateBookingCreatedOwner" as const,
    bodyKeySi: "templateBookingCreatedOwnerSi" as const,
    bodyKeyTa: "templateBookingCreatedOwnerTa" as const,
    defaultSubject: "bookingCreatedOwner" as const,
    defaultBody: "bookingCreatedOwner" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "Open dashboard",
    mergeTags: [
      "{customer_name}",
      "{salon_name}",
      "{service_name}",
      "{booking_date}",
      "{booking_time}",
      "{payment_status}",
      "{dashboard_link}",
    ],
    sharesToggleWith: "booking-created-customer",
  },
  {
    id: "agent-approval-owner",
    order: 9,
    title: "Agent Approval — Salon Owner",
    recipient: "Salon owner",
    whenFired: "When an agent approves a salon to go live.",
    toggleKey: "agentApprovalEnabled" as const,
    subjectKey: "subjectAgentApprovalOwner" as const,
    bodyKey: "templateAgentApprovalOwner" as const,
    bodyKeySi: "templateAgentApprovalOwnerSi" as const,
    bodyKeyTa: "templateAgentApprovalOwnerTa" as const,
    defaultSubject: "agentApprovalOwner" as const,
    defaultBody: "agentApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "agent-approval-admin",
    order: 10,
    title: "Agent Approval — Platform Admin",
    recipient: "Admin",
    whenFired: "Internal email when an agent approves a salon.",
    toggleKey: "agentApprovalEnabled" as const,
    subjectKey: "subjectAgentApprovalAdmin" as const,
    bodyKey: "templateAgentApprovalAdmin" as const,
    bodyKeySi: "templateAgentApprovalAdminSi" as const,
    bodyKeyTa: "templateAgentApprovalAdminTa" as const,
    defaultSubject: "agentApprovalAdmin" as const,
    defaultBody: "agentApprovalAdmin" as const,
    mergeTags: ["{salon_name}"],
    sharesToggleWith: "agent-approval-owner",
  },
  {
    id: "admin-approval-owner",
    order: 11,
    title: "Verified Badge — Salon Owner",
    recipient: "Salon owner",
    whenFired: "When platform admin grants the official Verified badge.",
    toggleKey: "adminApprovalEnabled" as const,
    subjectKey: "subjectAdminApprovalOwner" as const,
    bodyKey: "templateAdminApprovalOwner" as const,
    bodyKeySi: "templateAdminApprovalOwnerSi" as const,
    bodyKeyTa: "templateAdminApprovalOwnerTa" as const,
    defaultSubject: "adminApprovalOwner" as const,
    defaultBody: "adminApprovalOwner" as const,
    mergeTags: ["{salon_name}"],
  },
  {
    id: "admin-approval-admin",
    order: 12,
    title: "Verified Badge — Admin Confirmation",
    recipient: "Admin",
    whenFired: "Confirmation email after admin grants a verified badge.",
    toggleKey: "adminApprovalEnabled" as const,
    subjectKey: "subjectAdminApprovalAdmin" as const,
    bodyKey: "templateAdminApprovalAdmin" as const,
    bodyKeySi: "templateAdminApprovalAdminSi" as const,
    bodyKeyTa: "templateAdminApprovalAdminTa" as const,
    defaultSubject: "adminApprovalAdmin" as const,
    defaultBody: "adminApprovalAdmin" as const,
    mergeTags: ["{salon_name}"],
    sharesToggleWith: "admin-approval-owner",
  },
  {
    id: "welcome-customer",
    order: 13,
    title: "Welcome — New Customer",
    recipient: "Customer",
    whenFired: "After a customer completes signup (first successful login).",
    toggleKey: "welcomeCustomerEnabled" as const,
    subjectKey: "subjectWelcomeCustomer" as const,
    bodyKey: "templateWelcomeCustomer" as const,
    bodyKeySi: "templateWelcomeCustomerSi" as const,
    bodyKeyTa: "templateWelcomeCustomerTa" as const,
    defaultSubject: "welcomeCustomer" as const,
    defaultBody: "welcomeCustomer" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "Browse salons",
    mergeTags: ["{customer_name}", "{dashboard_link}"],
  },
  {
    id: "agent-lead-assigned",
    order: 14,
    title: "Lead Assigned — Field Agent",
    recipient: "Agent",
    whenFired: "When a salon lead is assigned to an agent (discovery or manual).",
    toggleKey: "agentLeadAssignedEnabled" as const,
    subjectKey: "subjectAgentLeadAssigned" as const,
    bodyKey: "templateAgentLeadAssigned" as const,
    bodyKeySi: "templateAgentLeadAssignedSi" as const,
    bodyKeyTa: "templateAgentLeadAssignedTa" as const,
    defaultSubject: "agentLeadAssigned" as const,
    defaultBody: "agentLeadAssigned" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "Open field editor",
    mergeTags: [
      "{agent_name}",
      "{salon_name}",
      "{salon_address}",
      "{onboarding_status}",
      "{dashboard_link}",
    ],
  },
  {
    id: "partner-lead-received",
    order: 15,
    title: "Partner Application Received",
    recipient: "Salon applicant",
    whenFired: "When a business submits the public partner onboarding form.",
    toggleKey: "partnerLeadReceivedEnabled" as const,
    subjectKey: "subjectPartnerLeadReceived" as const,
    bodyKey: "templatePartnerLeadReceived" as const,
    bodyKeySi: "templatePartnerLeadReceivedSi" as const,
    bodyKeyTa: "templatePartnerLeadReceivedTa" as const,
    defaultSubject: "partnerLeadReceived" as const,
    defaultBody: "partnerLeadReceived" as const,
    mergeTags: ["{owner_name}", "{salon_name}", "{salon_address}"],
  },
  {
    id: "owner-submission-rejected",
    order: 16,
    title: "Profile Correction — Salon Owner",
    recipient: "Salon owner",
    whenFired: "When an agent returns a submitted owner profile for corrections.",
    toggleKey: "agentApprovalEnabled" as const,
    subjectKey: "subjectOwnerSubmissionRejected" as const,
    bodyKey: "templateOwnerSubmissionRejected" as const,
    bodyKeySi: "templateOwnerSubmissionRejectedSi" as const,
    bodyKeyTa: "templateOwnerSubmissionRejectedTa" as const,
    defaultSubject: "ownerSubmissionRejected" as const,
    defaultBody: "ownerSubmissionRejected" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "Update profile",
    mergeTags: ["{salon_name}", "{rejection_reason}", "{dashboard_link}"],
    sharesToggleWith: "agent-approval-owner",
  },
  {
    id: "subscription-upgraded",
    order: 17,
    title: "Subscription Upgraded — Salon Owner",
    recipient: "Salon owner",
    whenFired: "After a salon owner completes a paid subscription plan upgrade.",
    toggleKey: "subscriptionUpgradedEnabled" as const,
    subjectKey: "subjectSubscriptionUpgraded" as const,
    bodyKey: "templateSubscriptionUpgraded" as const,
    bodyKeySi: "templateSubscriptionUpgradedSi" as const,
    bodyKeyTa: "templateSubscriptionUpgradedTa" as const,
    defaultSubject: "subscriptionUpgraded" as const,
    defaultBody: "subscriptionUpgraded" as const,
    ctaVariable: "dashboard_link" as const,
    ctaLabel: "Open billing",
    mergeTags: [
      "{salon_name}",
      "{plan_name}",
      "{billing_cycle}",
      "{amount_paid}",
      "{order_id}",
      "{dashboard_link}",
    ],
  },
] as const;

export type EmailTriggerId = (typeof EMAIL_TRIGGER_CATALOG)[number]["id"];

export function getEmailTriggerById(id: EmailTriggerId) {
  return EMAIL_TRIGGER_CATALOG.find((trigger) => trigger.id === id);
}
