import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Global Trimma dark CTA — uses shared Button `dark` variant contract. */
export const trimmaDarkBtnClass = cn(
  buttonVariants({ variant: "dark" }),
  "rounded-xl font-bold gap-2 min-h-11 sm:min-h-9"
);

/** Filter/tab pills — inactive light, active dark, yellow label on hover. */
export function trimmaFilterTabClass(active: boolean) {
  return cn(
    "trimma-filter-tab rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold transition-all min-h-11 sm:min-h-9",
    active && "is-active"
  );
}

/** @deprecated Use trimmaDarkBtnClass — kept for existing imports */
export const customerBtnClass = trimmaDarkBtnClass;

/** @deprecated Use trimmaFilterTabClass */
export const customerTabClass = trimmaFilterTabClass;
