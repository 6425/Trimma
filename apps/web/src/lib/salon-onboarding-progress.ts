export type SalonOnboardingSnapshot = {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  working_hours?: unknown;
  business_info_extended?: Record<string, unknown> | null;
  bank_info?: Record<string, unknown> | null;
  is_verified?: boolean | null;
  onboarding_status?: string | null;
};

export type SalonOnboardingStep = {
  id: "operations" | "business" | "bank" | "verification";
  label: string;
  complete: boolean;
  weight: number;
};

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasWorkingHours(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 2;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function isBusinessInfoComplete(
  salon: Pick<SalonOnboardingSnapshot, "business_info_extended" | "name" | "phone" | "address">
): boolean {
  const ext = salon.business_info_extended || {};
  return (
    hasText(salon.name) &&
    hasText(salon.phone) &&
    hasText(salon.address) &&
    hasText(ext.legal_business_name) &&
    hasText(ext.business_type) &&
    hasText(ext.owner_full_name) &&
    hasText(ext.nic)
  );
}

export function isBankInfoComplete(
  salon: Pick<SalonOnboardingSnapshot, "bank_info" | "business_info_extended">
): boolean {
  const bank = salon.bank_info || {};
  const businessType = String(salon.business_info_extended?.business_type || "").toLowerCase();

  const hasCoreBankFields =
    hasText(bank.account_holder_name) &&
    hasText(bank.bank_name) &&
    hasText(bank.branch_name) &&
    hasText(bank.account_number) &&
    hasText(bank.account_type);

  if (!hasCoreBankFields) return false;

  const nicFront = hasText(bank.owner_nic_front_url);
  const nicBack = hasText(bank.owner_nic_back_url);
  const businessReg = hasText(bank.business_registration_url);
  const bankStatement = hasText(bank.verification_document_url);

  const isCompany =
    businessType.includes("company") ||
    businessType.includes("private limited") ||
    businessType.includes("plc");

  if (isCompany) {
    return businessReg && bankStatement && (nicFront || businessReg);
  }

  return nicFront && nicBack && businessReg && bankStatement;
}

export function isOperationsComplete(
  salon: Pick<
    SalonOnboardingSnapshot,
    "name" | "description" | "phone" | "address" | "logo_url" | "cover_url" | "working_hours"
  >
): boolean {
  return (
    hasText(salon.name) &&
    hasText(salon.description) &&
    hasText(salon.phone) &&
    hasText(salon.address) &&
    hasText(salon.logo_url) &&
    hasText(salon.cover_url) &&
    hasWorkingHours(salon.working_hours)
  );
}

export function getSalonOnboardingSteps(salon: SalonOnboardingSnapshot): SalonOnboardingStep[] {
  return [
    {
      id: "operations",
      label: "Operational details",
      complete: isOperationsComplete(salon),
      weight: 35,
    },
    {
      id: "business",
      label: "Business information",
      complete: isBusinessInfoComplete(salon),
      weight: 25,
    },
    {
      id: "bank",
      label: "Bank & verification documents",
      complete: isBankInfoComplete(salon),
      weight: 25,
    },
    {
      id: "verification",
      label: "Trimma verification badge",
      complete: Boolean(salon.is_verified),
      weight: 15,
    },
  ];
}

export function calculateSalonOnboardingScore(salon: SalonOnboardingSnapshot): number {
  const steps = getSalonOnboardingSteps(salon);
  const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
  const earned = steps.filter((step) => step.complete).reduce((sum, step) => sum + step.weight, 0);
  return Math.round((earned / totalWeight) * 100);
}

export function canCollectVerifiedReservationDeposit(salon: SalonOnboardingSnapshot): boolean {
  return (
    isBusinessInfoComplete(salon) &&
    isBankInfoComplete(salon) &&
    Boolean(salon.is_verified)
  );
}

export function getOwnerOnboardingBannerMessage(salon: SalonOnboardingSnapshot): string {
  if (salon.is_verified && canCollectVerifiedReservationDeposit(salon)) {
    return "Your salon is verified. Online reservation deposits (50%) are enabled for customer bookings.";
  }

  if (salon.onboarding_status === "OWNER_ACTIVATED") {
    return "Your booking profile is awaiting agent approval. Complete business and bank details to unlock the verified badge and 50% online reservation deposits.";
  }

  if (!isOperationsComplete(salon)) {
    return "Complete your operational details, then submit for booking approval.";
  }

  if (!isBusinessInfoComplete(salon) || !isBankInfoComplete(salon)) {
    return "Add your business and bank details (with required documents) to earn your verification badge and enable 50% reservation deposits.";
  }

  if (!salon.is_verified) {
    return "Documents submitted — awaiting Trimma verification. Service bookings start after your agent approves operational details.";
  }

  return "Complete your salon profile to go live on Trimma.";
}
