export type SalonVerificationDocumentKey =
  | "owner_nic_front"
  | "owner_nic_back"
  | "business_registration"
  | "bank_statement";

export type SalonVerificationDocumentMeta = {
  key: SalonVerificationDocumentKey;
  label: string;
  bankInfoField:
    | "owner_nic_front_url"
    | "owner_nic_back_url"
    | "business_registration_url"
    | "verification_document_url";
};

export const SALON_VERIFICATION_DOCUMENTS: SalonVerificationDocumentMeta[] = [
  {
    key: "owner_nic_front",
    label: "Owner NIC (Front)",
    bankInfoField: "owner_nic_front_url",
  },
  {
    key: "owner_nic_back",
    label: "Owner NIC (Back)",
    bankInfoField: "owner_nic_back_url",
  },
  {
    key: "business_registration",
    label: "Business Registration (BR)",
    bankInfoField: "business_registration_url",
  },
  {
    key: "bank_statement",
    label: "Bank Statement or Passbook",
    bankInfoField: "verification_document_url",
  },
];

export type SalonVerificationDocumentView = {
  key: SalonVerificationDocumentKey;
  label: string;
  storagePath: string | null;
  signedUrl: string | null;
};

export function isSalonDocumentStoragePath(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return false;
  }
  return trimmed.includes("/");
}

export function extractSalonVerificationDocumentPaths(
  bankInfo: Record<string, unknown> | null | undefined
): Record<SalonVerificationDocumentKey, string | null> {
  const info = bankInfo || {};
  const read = (field: SalonVerificationDocumentMeta["bankInfoField"]) => {
    const raw = info[field];
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return isSalonDocumentStoragePath(trimmed) ? trimmed : null;
  };

  return {
    owner_nic_front: read("owner_nic_front_url"),
    owner_nic_back: read("owner_nic_back_url"),
    business_registration: read("business_registration_url"),
    bank_statement: read("verification_document_url"),
  };
}
