import {
  isRealGooglePlaceId,
  normalizeAddressKey,
  normalizePhoneKey,
  normalizeSalonNameKey,
  readStoredGooglePlaceId,
  type SalonDuplicateRow,
} from "@/lib/salon-discovery-dedup";

export type OnboardingBusinessSearchInput = {
  businessName?: string;
  phone?: string;
  town?: string;
  placeId?: string;
  listingId?: string;
};

export type OnboardingBusinessMatch = {
  row: SalonDuplicateRow;
  score: number;
  reasons: string[];
  likelyDuplicate: boolean;
};

function includesWords(value: string, query: string): boolean {
  if (!value || !query) return false;
  const words = query.split(" ").filter((word) => word.length >= 2);
  return words.length > 0 && words.every((word) => value.includes(word));
}

export function scoreOnboardingBusinessMatch(
  row: SalonDuplicateRow,
  input: OnboardingBusinessSearchInput
): OnboardingBusinessMatch {
  const rowName = normalizeSalonNameKey(row.name);
  const queryName = normalizeSalonNameKey(input.businessName);
  const rowPhone = normalizePhoneKey(row.phone);
  const queryPhone = normalizePhoneKey(input.phone);
  const rowPlaceId = readStoredGooglePlaceId(row);
  const queryPlaceId = String(input.placeId || "").trim();
  const town = normalizeSalonNameKey(input.town);
  const city = normalizeSalonNameKey(row.city);
  const district = normalizeSalonNameKey(row.district);
  const address = normalizeAddressKey(row.address);

  let score = 0;
  const reasons: string[] = [];

  const placeMatch =
    Boolean(queryPlaceId) &&
    isRealGooglePlaceId(queryPlaceId) &&
    rowPlaceId === queryPlaceId;
  if (placeMatch) {
    score += 1_000;
    reasons.push("Google Place ID");
  }

  const phoneMatch = queryPhone.length >= 9 && rowPhone === queryPhone;
  if (phoneMatch) {
    score += 700;
    reasons.push("phone number");
  }

  const exactName = Boolean(queryName) && rowName === queryName;
  const partialName =
    Boolean(queryName) &&
    !exactName &&
    (rowName.includes(queryName) || queryName.includes(rowName) || includesWords(rowName, queryName));
  if (exactName) {
    score += 500;
    reasons.push("business name");
  } else if (partialName) {
    score += 240;
    reasons.push("similar business name");
  }

  const townMatch =
    Boolean(town) &&
    (city === town || district === town || address === town || address.includes(town));
  if (townMatch) {
    score += city === town || district === town ? 220 : 120;
    reasons.push("location");
  }

  const likelyDuplicate = placeMatch || phoneMatch || (exactName && townMatch);

  return { row, score, reasons, likelyDuplicate };
}

export function rankOnboardingBusinessMatches(
  rows: SalonDuplicateRow[],
  input: OnboardingBusinessSearchInput
): OnboardingBusinessMatch[] {
  const listingId = String(input.listingId || "").trim();

  return rows
    .map((row) => {
      if (listingId && String(row.id || "") === listingId) {
        return {
          row,
          score: 10_000,
          reasons: ["selected Trimma listing"],
          likelyDuplicate: true,
        } satisfies OnboardingBusinessMatch;
      }
      return scoreOnboardingBusinessMatch(row, input);
    })
    .filter((match) => match.score >= 120)
    .sort((a, b) => b.score - a.score);
}
