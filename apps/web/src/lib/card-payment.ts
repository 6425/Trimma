export type CardType = "visa" | "mastercard" | "amex";

export type CardPaymentDetails = {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export function normalizeCardNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumberInput(value: string): string {
  const digits = normalizeCardNumber(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardType(cardNumber: string): CardType {
  const digits = normalizeCardNumber(cardNumber);
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
  return "mastercard";
}

export function isValidLuhn(cardNumber: string): boolean {
  const digits = normalizeCardNumber(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function validateCardPayment(
  cardType: CardType,
  details: CardPaymentDetails
): string | null {
  const digits = normalizeCardNumber(details.cardNumber);
  const detected = detectCardType(digits);

  if (!details.cardholderName.trim()) return "Enter the name on the card.";
  if (digits.length < 13) return "Enter a valid card number.";
  if (!isValidLuhn(digits)) return "Card number is invalid.";
  if (cardType === "amex" && detected !== "amex") return "This card number does not match Amex.";
  if (cardType === "visa" && detected !== "visa") return "This card number does not match Visa.";
  if (cardType === "mastercard" && detected !== "mastercard") {
    return "This card number does not match Mastercard.";
  }

  const expiryMatch = details.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) return "Enter expiry as MM/YY.";
  const month = Number(expiryMatch[1]);
  const year = Number(`20${expiryMatch[2]}`);
  if (month < 1 || month > 12) return "Expiry month is invalid.";

  const now = new Date();
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  if (expiryDate < now) return "This card has expired.";

  const cvvLength = cardType === "amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvvLength}}$`).test(details.cvv.trim())) {
    return `Enter a valid ${cvvLength}-digit security code.`;
  }

  return null;
}
