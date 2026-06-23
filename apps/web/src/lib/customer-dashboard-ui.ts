/** Black CTA buttons on the customer dashboard — white text, yellow text on hover. */
export const customerBtnClass =
  "trimma-customer-btn inline-flex shrink-0 items-center justify-center max-w-full font-bold rounded-xl transition-all";

export function customerTabClass(active: boolean) {
  return `trimma-customer-tab rounded-xl px-4 py-2 text-xs font-bold transition-all${active ? " is-active" : ""}`;
}
