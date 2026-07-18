import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const VERIFIED_SALON_BADGE_CLASS =
  "trimma-verified-badge bg-[#ffde5a] text-black border-[#ffde5a] font-bold uppercase tracking-wider shrink-0 [&_svg]:text-black";

export function isSalonVerified(isVerified?: boolean | null) {
  return isVerified === true;
}

type VerifiedSalonBadgeProps = {
  className?: string;
  size?: "xs" | "sm";
  showIcon?: boolean;
};

export function VerifiedSalonBadge({
  className,
  size = "sm",
  showIcon = true,
}: VerifiedSalonBadgeProps) {
  return (
    <Badge
      className={cn(
        VERIFIED_SALON_BADGE_CLASS,
        "rounded-full inline-flex items-center gap-1",
        size === "xs" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1",
        className
      )}
    >
      {showIcon && <ShieldCheck className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      Verified
    </Badge>
  );
}
