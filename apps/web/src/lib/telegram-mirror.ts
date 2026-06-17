/** Fire-and-forget Telegram mirrors without coupling WhatsApp server-action bundles. */

type TelegramModule = typeof import("@/app/actions/telegram");

let telegramModulePromise: Promise<TelegramModule> | null = null;

function loadTelegramModule() {
  if (!telegramModulePromise) {
    telegramModulePromise = import("@/app/actions/telegram");
  }
  return telegramModulePromise;
}

async function runTelegramMirror(label: string, runner: (mod: TelegramModule) => Promise<unknown>) {
  try {
    const mod = await loadTelegramModule();
    await runner(mod);
  } catch (err) {
    console.warn(`[telegram-mirror] ${label} skipped:`, err);
  }
}

export function mirrorTelegramReservationPaid(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  void runTelegramMirror("reservation-paid", (mod) =>
    mod.sendTelegramReservationPaidNotification(bookingNo, overrides)
  );
}

export function mirrorOwnerBookingRequestTelegram(bookingNo: string, paymentStatus?: string) {
  void runTelegramMirror("owner-booking-request", (mod) =>
    mod.sendOwnerBookingRequestTelegram(bookingNo, paymentStatus)
  );
}

export function mirrorTelegramNotification(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  void runTelegramMirror("booking-confirmed", (mod) =>
    mod.sendTelegramNotification(bookingNo, overrides)
  );
}

export function mirrorTelegramCancellation(bookingNo: string) {
  void runTelegramMirror("booking-cancelled", (mod) =>
    mod.sendTelegramCancellationNotification(bookingNo)
  );
}

export function mirrorTelegramNoShow(bookingNo: string) {
  void runTelegramMirror("booking-no-show", (mod) =>
    mod.sendTelegramNoShowNotification(bookingNo)
  );
}

export function mirrorTelegramReschedule(bookingNo: string) {
  void runTelegramMirror("booking-rescheduled", (mod) =>
    mod.sendTelegramRescheduleNotification(bookingNo)
  );
}

export function mirrorBookingCreatedTelegram(bookingNo: string) {
  void runTelegramMirror("booking-created", (mod) => mod.sendBookingCreatedTelegramAlert(bookingNo));
}

export function mirrorReviewRequestTelegram(bookingNo: string) {
  void runTelegramMirror("review-request", (mod) => mod.sendReviewRequestTelegramAlert(bookingNo));
}

export function mirrorOnboardingInviteTelegram(
  salonId: string,
  phone: string,
  ownerGmail: string,
  salonName: string,
  slug?: string | null
) {
  void runTelegramMirror("onboarding-invite", (mod) =>
    mod.sendOnboardingInviteTelegramAlert(salonId, phone, ownerGmail, salonName, slug)
  );
}

export function mirrorAgentApprovalTelegram(salonId: string, ownerPhone: string, salonName: string) {
  void runTelegramMirror("agent-approval", (mod) =>
    mod.sendAgentApprovalTelegramAlerts(salonId, ownerPhone, salonName)
  );
}

export function mirrorAdminApprovalTelegram(salonId: string, ownerPhone: string, salonName: string) {
  void runTelegramMirror("admin-approval", (mod) =>
    mod.sendAdminApprovalTelegramAlerts(salonId, ownerPhone, salonName)
  );
}

export function mirrorWelcomeCustomerTelegram(customerName: string, rawPhone: string) {
  void runTelegramMirror("welcome-customer", (mod) =>
    mod.sendWelcomeCustomerTelegram(customerName, rawPhone)
  );
}

export function mirrorAgentLeadAssignedTelegram(
  agentName: string,
  rawAgentPhone: string,
  salonName: string,
  options?: {
    salonAddress?: string;
    onboardingStatus?: string;
    dashboardLink?: string;
  }
) {
  void runTelegramMirror("agent-lead-assigned", (mod) =>
    mod.sendAgentLeadAssignedTelegram(agentName, rawAgentPhone, salonName, options)
  );
}
