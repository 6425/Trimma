"use client";

import Link from "next/link";
import {
  calculateOwnerProfileCompletionScore,
  getOwnerOnboardingBannerMessage,
  getSalonOnboardingSteps,
  type SalonOnboardingSnapshot,
} from "@/lib/salon-onboarding-progress";

export function SalonOnboardingProgressBanner({
  salon,
}: {
  salon: SalonOnboardingSnapshot;
}) {
  if (salon.is_verified && calculateOwnerProfileCompletionScore(salon) >= 100) {
    return null;
  }

  const score = calculateOwnerProfileCompletionScore(salon);
  const steps = getSalonOnboardingSteps(salon).filter((step) => step.id !== "verification");
  const message = getOwnerOnboardingBannerMessage(salon);

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-4 sm:px-6 z-30 relative">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-950">Complete your salon profile</p>
            <p className="text-sm text-amber-900/80 mt-1">{message}</p>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold px-4 py-2.5 whitespace-nowrap"
          >
            Open Salon Profile
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
            <span>Profile completion</span>
            <span>{score}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-amber-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.max(score, 4)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                step.complete
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-white text-amber-900 border border-amber-200"
              }`}
            >
              {step.complete ? "✓" : "○"} {step.label}
            </span>
          ))}
          {!salon.is_verified && (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold bg-white text-amber-900 border border-amber-200">
              ○ Trimma verification badge (admin)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
