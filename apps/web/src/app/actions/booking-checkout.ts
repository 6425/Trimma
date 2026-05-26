"use server";

import {
  detectCardType,
  isValidLuhn,
  normalizeCardNumber,
  type CardType,
} from "@/lib/card-payment";

type ProcessCardPaymentInput = {
  cardType: CardType;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
  amount: number;
  bookingNo: string;
  environment: string;
};

export async function processBookingCardPayment(input: ProcessCardPaymentInput) {
  const digits = normalizeCardNumber(input.cardNumber);
  const detected = detectCardType(digits);

  if (!input.cardholderName.trim()) {
    throw new Error("Enter the name on the card.");
  }
  if (!isValidLuhn(digits)) {
    throw new Error("Card number is invalid.");
  }
  if (detected !== input.cardType) {
    throw new Error("Selected card type does not match the card number.");
  }

  const expiryMatch = input.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) {
    throw new Error("Enter expiry as MM/YY.");
  }

  const cvvLength = input.cardType === "amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvvLength}}$`).test(input.cvv.trim())) {
    throw new Error(`Enter a valid ${cvvLength}-digit security code.`);
  }

  if (input.environment === "sandbox" && digits.endsWith("0000")) {
    throw new Error("Card declined. Use a different test card in sandbox mode.");
  }

  const last4 = digits.slice(-4);
  const paymentId =
    input.environment === "live"
      ? `PH-LIVE-${input.bookingNo}-${Date.now()}`
      : `PH-SBX-${input.bookingNo}-${Date.now()}`;

  return {
    success: true,
    paymentId,
    last4,
    provider: "payhere",
    amount: Number(input.amount.toFixed(2)),
  };
}
