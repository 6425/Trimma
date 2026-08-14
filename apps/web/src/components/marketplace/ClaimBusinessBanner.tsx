"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSalonClaimLoginUrl } from "@/lib/salon-public-listing";

type ClaimBusinessBannerProps = {
  salonId: string;
  salonName: string;
  variant?: "hero" | "inline";
};

export function ClaimBusinessBanner({
  salonId,
  salonName,
  variant = "hero",
}: ClaimBusinessBannerProps) {
  const claimUrl = buildSalonClaimLoginUrl(salonId);

  if (variant === "inline") {
    return (
      <div className="rounded-2xl border border-[#ffde5a]/40 bg-[#fff9df] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">Own this business?</p>
            <p className="text-sm font-semibold text-zinc-900">
              Claim <span className="font-extrabold">{salonName}</span> on Trimma to manage your profile and enable online bookings.
            </p>
          </div>
          <Button asChild variant="default" className="h-11 min-h-11 w-full shrink-0 font-bold sm:w-auto">
            <Link href={claimUrl}>Claim this business</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-[#ffde5a] bg-gradient-to-br from-[#fff9df] via-white to-[#fff4c2] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ffde5a]">
            <Building2 className="h-3.5 w-3.5" />
            Unclaimed listing
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
              Is this your salon?
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-700">
              <span className="font-bold text-zinc-900">{salonName}</span> is listed on Trimma for customers to discover across Sri Lanka.
              Claim your business to update your profile, connect services, and activate online appointment booking through our verified onboarding process.
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs font-medium text-zinc-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-800" />
            <span>Free to claim. Sign in with Google, complete your salon profile, and pass Trimma agent + admin verification to go live with bookings.</span>
          </div>
        </div>
        <Button asChild variant="default" size="lg" className="h-12 min-h-12 w-full shrink-0 px-8 text-base font-extrabold lg:w-auto">
          <Link href={claimUrl}>Claim this business</Link>
        </Button>
      </div>
    </div>
  );
}
