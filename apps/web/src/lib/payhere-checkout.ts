export type PayhereCheckoutParams = Record<string, string>;

export function getPayhereCheckoutUrl(environment: string | null | undefined): string {
  return environment === "live"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";
}

export function submitPayhereCheckout(
  params: PayhereCheckoutParams,
  environment: string | null | undefined
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = getPayhereCheckoutUrl(environment);

  Object.entries(params).forEach(([key, value]) => {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = key;
    field.value = value;
    form.appendChild(field);
  });

  document.body.appendChild(form);
  form.submit();
}

export function formatLkr(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
}
