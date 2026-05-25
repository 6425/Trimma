export type PayherePaymentChannel = {
  id: string;
  label: string;
  src: string;
  category: "card" | "wallet";
};

export const PAYHERE_PAYMENT_CHANNELS: PayherePaymentChannel[] = [
  { id: "visa", label: "Visa", src: "/payments/visa.svg", category: "card" },
  { id: "mastercard", label: "Mastercard", src: "/payments/mastercard.svg", category: "card" },
  { id: "amex", label: "American Express", src: "/payments/amex.svg", category: "card" },
  { id: "ezcash", label: "eZ Cash", src: "/payments/ezcash.svg", category: "wallet" },
  { id: "mcash", label: "mCash", src: "/payments/mcash.svg", category: "wallet" },
  { id: "genie", label: "Genie", src: "/payments/genie.svg", category: "wallet" },
  { id: "frimi", label: "Frimi", src: "/payments/frimi.svg", category: "wallet" },
];

export function getPayhereChannelLabel(channelId: string): string {
  return PAYHERE_PAYMENT_CHANNELS.find((c) => c.id === channelId)?.label ?? channelId;
}
