"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 📝 Beautiful default templates for database fallback
const DEFAULT_TEMPLATE_CONFIRMED = `Hi {customer_name}! 🌟\n\nYour appointment at *{salon_name}* has been successfully secured!\n\n📅 *Date:* {booking_date}\n⏰ *Time:* {booking_time}\n💇 *Service:* {service_name}\n💰 *Total Price:* LKR {total_price}\n✅ *20% Deposit Paid:* LKR {deposit_paid}\n💵 *Balance to pay at salon:* LKR {balance_to_pay}\n\n📍 *Salon Location:* {salon_address}\n🗺️ *Navigate on Google Maps:* {maps_link}\n\nThank you for choosing Trimma! See you soon! ✂️`;

const DEFAULT_TEMPLATE_RESCHEDULED = `Hi {customer_name}! 🌟\n\nYour appointment at *${"{salon_name}"}* has been successfully *RESCHEDULED* to a new date and time!\n\n📅 *New Date:* {booking_date}\n⏰ *New Time:* {booking_time}\n💇 *Service:* {service_name}\n\n📍 *Salon Location:* {salon_address}\n🗺️ *Navigate on Google Maps:* {maps_link}\n\nThank you for choosing Trimma! See you soon! ✂️`;

const DEFAULT_TEMPLATE_CANCELLED = `Hello {customer_name},\n\nThis is to notify you that your appointment at *{salon_name}* has been successfully *CANCELLED*.\n\n📅 *Original Date:* {booking_date}\n⏰ *Original Time:* {booking_time}\n💇 *Service:* {service_name}\n\nRefund of your 20% online deposit has been initiated to your original payment method. 💳\n\nIf you believe this was an error, please contact the salon immediately.\n\nTrimma Notification Services ✂️`;

const DEFAULT_TEMPLATE_REVIEW = `Hi {customer_name}! 🌟\n\nHow was your styling at *{salon_name}* today? We would love to hear your feedback!\n\nRate your stylist and share your experience here: {review_link}\n\nThank you for choosing Trimma! ✂️`;

const DEFAULT_TEMPLATE_ONBOARDING = `Hi {salon_name} Owner! 🌟\n\nYour Trimma Salon Partner Profile is ready!\n\nPlease login using your registered Gmail: {owner_gmail}\n\nLogin securely here: {login_link}\n\nWelcome to Trimma! ✂️`;

/**
 * Parses dynamic merge tags in templates (handles both {tag} and { tag } formats).
 */
function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Sanitizes phone numbers to Meta's required international standard (e.g. 94771234567).
 */
function cleanPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "94" + digits.substring(1);
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    digits = "94" + digits;
  }
  return digits;
}

/**
 * Dynamic helper to fetch active WhatsApp configuration and custom templates from the database.
 */
export async function getWhatsAppConfig() {
  try {
    const { data: dbSettings, error } = await supabase
      .from("global_payment_settings")
      .select(`
        whatsapp_phone_number_id, 
        whatsapp_access_token, 
        whatsapp_enabled,
        whatsapp_booking_confirmed_enabled,
        whatsapp_booking_rescheduled_enabled,
        whatsapp_booking_cancelled_enabled,
        whatsapp_booking_review_enabled,
        whatsapp_onboarding_invite_enabled,
        whatsapp_template_confirmed,
        whatsapp_template_rescheduled,
        whatsapp_template_cancelled,
        whatsapp_template_review,
        whatsapp_template_onboarding_invite
      `)
      .single();

    if (error || !dbSettings) {
      throw error || new Error("No settings record found.");
    }

    const enabled = dbSettings.whatsapp_enabled !== false;
    const phoneId = dbSettings.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const accessToken = dbSettings.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN || "";
    
    // Trigger toggles
    const bookingConfirmedEnabled = dbSettings.whatsapp_booking_confirmed_enabled !== false;
    const bookingRescheduledEnabled = dbSettings.whatsapp_booking_rescheduled_enabled !== false;
    const bookingCancelledEnabled = dbSettings.whatsapp_booking_cancelled_enabled !== false;
    const bookingReviewEnabled = dbSettings.whatsapp_booking_review_enabled !== false;
    const onboardingInviteEnabled = dbSettings.whatsapp_onboarding_invite_enabled !== false;

    // Custom templates
    const templateConfirmed = dbSettings.whatsapp_template_confirmed || DEFAULT_TEMPLATE_CONFIRMED;
    const templateRescheduled = dbSettings.whatsapp_template_rescheduled || DEFAULT_TEMPLATE_RESCHEDULED;
    const templateCancelled = dbSettings.whatsapp_template_cancelled || DEFAULT_TEMPLATE_CANCELLED;
    const templateReview = dbSettings.whatsapp_template_review || DEFAULT_TEMPLATE_REVIEW;
    const templateOnboardingInvite = dbSettings.whatsapp_template_onboarding_invite || DEFAULT_TEMPLATE_ONBOARDING;

    return { 
      enabled, 
      phoneId, 
      accessToken, 
      bookingConfirmedEnabled,
      bookingRescheduledEnabled,
      bookingCancelledEnabled,
      bookingReviewEnabled,
      onboardingInviteEnabled,
      templateConfirmed,
      templateRescheduled,
      templateCancelled,
      templateReview,
      templateOnboardingInvite,
      source: "database" 
    };
  } catch (err) {
    console.warn("⚠️ Failed to load WhatsApp settings from DB, falling back to static default states:", err);
    return {
      enabled: true,
      phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
      bookingConfirmedEnabled: true,
      bookingRescheduledEnabled: true,
      bookingCancelledEnabled: true,
      bookingReviewEnabled: true,
      onboardingInviteEnabled: true,
      templateConfirmed: DEFAULT_TEMPLATE_CONFIRMED,
      templateRescheduled: DEFAULT_TEMPLATE_RESCHEDULED,
      templateCancelled: DEFAULT_TEMPLATE_CANCELLED,
      templateReview: DEFAULT_TEMPLATE_REVIEW,
      templateOnboardingInvite: DEFAULT_TEMPLATE_ONBOARDING,
      source: "env"
    };
  }
}

/**
 * Securely saves WhatsApp configurations and custom templates directly to the database.
 */
export async function saveWhatsAppSettings(
  phoneId: string, 
  accessToken: string, 
  enabled: boolean,
  bookingConfirmedEnabled?: boolean,
  bookingRescheduledEnabled?: boolean,
  bookingCancelledEnabled?: boolean,
  bookingReviewEnabled?: boolean,
  onboardingInviteEnabled?: boolean,
  templateConfirmed?: string,
  templateRescheduled?: string,
  templateCancelled?: string,
  templateReview?: string,
  templateOnboardingInvite?: string
) {
  try {
    const { error } = await supabase
      .from("global_payment_settings")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        whatsapp_phone_number_id: phoneId,
        whatsapp_access_token: accessToken,
        whatsapp_enabled: enabled,
        whatsapp_booking_confirmed_enabled: bookingConfirmedEnabled !== false,
        whatsapp_booking_rescheduled_enabled: bookingRescheduledEnabled !== false,
        whatsapp_booking_cancelled_enabled: bookingCancelledEnabled !== false,
        whatsapp_booking_review_enabled: bookingReviewEnabled !== false,
        whatsapp_onboarding_invite_enabled: onboardingInviteEnabled !== false,
        whatsapp_template_confirmed: templateConfirmed || null,
        whatsapp_template_rescheduled: templateRescheduled || null,
        whatsapp_template_cancelled: templateCancelled || null,
        whatsapp_template_review: templateReview || null,
        whatsapp_template_onboarding_invite: templateOnboardingInvite || null
      });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("❌ Failed to save WhatsApp configuration:", err);
    return { success: false, error: err.message || "Failed to save settings." };
  }
}

/**
 * Triggers a live sandbox test message to the specified phone number.
 */
export async function testWhatsAppConnection(testPhone: string) {
  const { phoneId, accessToken } = await getWhatsAppConfig();

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials are not configured on the server." };
  }

  const cleanPhone = cleanPhoneNumber(testPhone);

  try {
    const testMessage = `Hello! 🌟 This is a secure test message from your *Trimma Admin Settings Panel*!\n\nYour WhatsApp Business Cloud API configuration is working perfectly! ✅\n\n⚙️ *Mode:* Developer Sandbox\n🆔 *Phone ID:* ${phoneId}`;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: testMessage,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Meta Graph API test returned error response:", result);
      return { success: false, error: result.error?.message || "Failed to send test message." };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled test WhatsApp error:", err);
    return { success: false, error: err.message || "Internal server error." };
  }
}

/**
 * Core appointment checkout receipt notification sender.
 */
export async function sendWhatsAppNotification(bookingNo: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingConfirmedEnabled,
    templateConfirmed
  } = await getWhatsAppConfig();

  if (!enabled) {
    console.log("ℹ️ WhatsApp alerts are disabled globally in settings.");
    return { success: true, message: "Disabled" };
  }

  if (!bookingConfirmedEnabled) {
    console.log("ℹ️ WhatsApp Booking Confirmation receipts are disabled in settings.");
    return { success: true, message: "Confirmed Alerts Disabled" };
  }

  if (!phoneId || !accessToken) {
    console.error("❌ WhatsApp configuration is missing. Cannot dispatch receipt.");
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    // 1. Fetch full booking details (including service details and salon location details)
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, salons(name, phone, address, location), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) {
      console.error("❌ Failed to fetch booking details for WhatsApp dispatch:", bookingErr);
      return { success: false, error: "Booking record not found." };
    }

    // 2. Fetch customer details from users table to get name and phone
    const { data: customer, error: custErr } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (custErr || !customer) {
      console.error("❌ Failed to fetch customer contact card:", custErr);
      return { success: false, error: "Customer contact profile not found." };
    }

    const customerName = customer.full_name || "Valued Client";
    const rawCustomerPhone = customer.phone;

    if (!rawCustomerPhone) {
      console.error("❌ Customer phone number is empty. Cannot dispatch WhatsApp.");
      return { success: false, error: "Customer phone number is missing." };
    }

    const customerPhone = cleanPhoneNumber(rawCustomerPhone);
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName = booking.services?.name || "Premium Styling Service";
    
    const totalAmount = parseFloat(booking.amount);
    const depositAmount = Math.round(totalAmount * 0.2);
    const balanceAmount = Math.round(totalAmount * 0.8);

    // 📍 GPS coordinate-based Google Maps Directions Link
    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    // 3. Format the dynamic message via merge-tag parser
    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      total_price: totalAmount.toLocaleString(),
      deposit_paid: depositAmount.toLocaleString(),
      balance_to_pay: balanceAmount.toLocaleString(),
      salon_address: salonAddress,
      maps_link: mapsLink
    };

    const customerMessage = parseTemplate(templateConfirmed || DEFAULT_TEMPLATE_CONFIRMED, variables);

    console.log(`🚀 Dispatching WhatsApp Booking Confirmation to ${customerPhone}:`);

    // 4. Send WhatsApp request directly to Meta API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: customerMessage,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Meta Graph API returned error response:", result);
      return { success: false, error: result.error?.message || "Failed to send WhatsApp." };
    }

    return { success: true, messageId: result.messages?.[0]?.id };

  } catch (err: any) {
    console.error("❌ Unhandled error in WhatsApp confirmation dispatch:", err);
    return { success: false, error: err.message || "Internal server error." };
  }
}

/**
 * Triggers an instant WhatsApp alert when an appointment is cancelled.
 */
export async function sendWhatsAppCancellationNotification(bookingNo: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingCancelledEnabled,
    templateCancelled
  } = await getWhatsAppConfig();

  if (!enabled) return { success: true, message: "Disabled" };
  if (!bookingCancelledEnabled) return { success: true, message: "Cancellation Alerts Disabled" };

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    // 1. Fetch booking details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, salons(name), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) return { success: false, error: "Booking not found." };

    // 2. Fetch customer details
    const { data: customer } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) return { success: false, error: "Customer phone is missing." };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const customerName = customer.full_name || "Valued Client";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName = booking.services?.name || "Premium Styling Service";

    // 3. Format Dynamic Cancellation Template
    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName
    };

    const cancelMessage = parseTemplate(templateCancelled || DEFAULT_TEMPLATE_CANCELLED, variables);

    console.log(`❌ Dispatching WhatsApp Booking Cancellation to ${customerPhone}:`);

    // 4. Dispatch WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: cancelMessage,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error?.message };

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled cancellation WhatsApp error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an instant WhatsApp alert when an appointment is rescheduled.
 */
export async function sendWhatsAppRescheduleNotification(bookingNo: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingRescheduledEnabled,
    templateRescheduled
  } = await getWhatsAppConfig();

  if (!enabled) return { success: true, message: "Disabled" };
  if (!bookingRescheduledEnabled) return { success: true, message: "Reschedule Alerts Disabled" };

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    // 1. Fetch booking details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, salons(name, phone, address, location), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    // 2. Fetch customer details
    const { data: customer } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) {
      return { success: false, error: "Customer phone is missing." };
    }

    const customerPhone = cleanPhoneNumber(customer.phone);
    const customerName = customer.full_name || "Valued Client";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName = booking.services?.name || "Premium Styling Service";

    // 📍 GPS coordinate-based Google Maps Directions Link
    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    // 3. Format Dynamic Reschedule Template
    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      salon_address: salonAddress,
      maps_link: mapsLink
    };

    const rescheduleMessage = parseTemplate(templateRescheduled || DEFAULT_TEMPLATE_RESCHEDULED, variables);

    console.log(`🚀 Dispatching WhatsApp Booking Reschedule to ${customerPhone}:`);

    // 4. Dispatch WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: rescheduleMessage,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) return { success: false, error: result.error?.message };

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error: any) {
    console.error("WhatsApp Reschedule Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers an instant WhatsApp alert when a new booking is created (Pending state).
 * Sends to BOTH customer and Salon Owner.
 */
export async function sendBookingCreatedAlert(bookingNo: string) {
  const { enabled, phoneId, accessToken } = await getWhatsAppConfig();
  if (!enabled || !phoneId || !accessToken) return { success: false };

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, salons(name, contact_phone), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (!booking) return { success: false };

    const { data: customer } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer) return { success: false };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const ownerPhone = booking.salons?.contact_phone ? cleanPhoneNumber(booking.salons.contact_phone) : null;

    const customerMsg = `Hello ${customer.full_name || 'Customer'}! 🌟\n\nYour booking request at *${booking.salons?.name}* for *${booking.services?.name}* on ${booking.booking_date} at ${booking.booking_time} has been received and is currently *PENDING* confirmation from the salon.\n\nWe will notify you once they confirm! ✂️`;
    const ownerMsg = `🔔 *NEW BOOKING REQUEST* 🔔\n\nYou have a new booking request from ${customer.full_name || 'a customer'}.\n\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💇 Service: ${booking.services?.name}\n💳 Payment Status: ${booking.payment_status}\n\nPlease open your Trimma Dashboard to Confirm or Decline this request.`;

    // Send to Customer
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: customerPhone, type: "text", text: { body: customerMsg } })
    });

    // Send to Owner
    if (ownerPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: ownerPhone, type: "text", text: { body: ownerMsg } })
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp booking created error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers a WhatsApp review request when an appointment is completed.
 */
export async function sendReviewRequestAlert(bookingNo: string) {
  const { enabled, phoneId, accessToken, templateReview, bookingReviewEnabled } = await getWhatsAppConfig();
  if (!enabled || !bookingReviewEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, salons(name, slug)")
      .eq("booking_no", bookingNo)
      .single();

    if (!booking) return { success: false };

    const { data: customer } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) return { success: false };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const reviewLink = `https://trimma-web.vercel.app/salons/${booking.salons?.slug}#reviews`;

    const variables = {
      customer_name: customer.full_name || "Valued Client",
      salon_name: booking.salons?.name || "our salon",
      review_link: reviewLink
    };

    const msg = parseTemplate(templateReview || DEFAULT_TEMPLATE_REVIEW, variables);

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: customerPhone, type: "text", text: { body: msg } })
    });

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp review request error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an instant WhatsApp alert to invite a Salon Owner when onboarding is completed.
 */
export async function sendOnboardingInviteAlert(salonId: string, phone: string, ownerGmail: string, salonName: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    onboardingInviteEnabled,
    templateOnboardingInvite 
  } = await getWhatsAppConfig();

  if (!enabled || !onboardingInviteEnabled || !phoneId || !accessToken) {
    console.log("ℹ️ WhatsApp onboarding invite is disabled or missing credentials.");
    return { success: false, error: "Disabled or missing credentials" };
  }

  if (!phone) {
    console.error("❌ Phone number is required to send onboarding invite.");
    return { success: false, error: "Phone number is missing." };
  }

  try {
    const cleanPhone = cleanPhoneNumber(phone);
    const loginLink = "https://trimma-web.vercel.app/login";

    const variables = {
      salon_name: salonName || "Partner",
      owner_gmail: ownerGmail || "your verified email",
      login_link: loginLink
    };

    const msg = parseTemplate(templateOnboardingInvite || DEFAULT_TEMPLATE_ONBOARDING, variables);

    console.log(`🚀 Dispatching WhatsApp Onboarding Invite to ${cleanPhone}:`);

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        messaging_product: "whatsapp", 
        recipient_type: "individual", 
        to: cleanPhone, 
        type: "text", 
        text: { body: msg } 
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("❌ Meta Graph API returned error response:", result);
      return { success: false, error: result.error?.message || "Failed to send WhatsApp invite." };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled WhatsApp onboarding invite error:", err);
    return { success: false, error: err.message || "Internal server error" };
  }
}
