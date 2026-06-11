"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import {
  getSalonSetupProgressPercent,
  getSalonSetupSteps,
  isSalonSetupComplete,
} from "@/lib/salon-setup-progress";
import type { SalonStaffForAllocation } from "@/lib/staff-allocation";

type SalonServiceRow = { id: string; status?: string | null; name?: string | null };

export function SalonSetupChecklist({
  services,
  staff,
}: {
  services: SalonServiceRow[];
  staff: SalonStaffForAllocation[];
}) {
  const steps = getSalonSetupSteps(services, staff);
  const complete = isSalonSetupComplete(services, staff);
  const progress = getSalonSetupProgressPercent(services, staff);
  const currentStep = steps.find((step) => step.current);

  if (complete) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
        <div>
          <p className="font-bold text-emerald-900">Your salon is ready for bookings</p>
          <p className="text-sm text-emerald-700 mt-1">
            Staff are mapped to services and at least one service is live. Customers can book on your salon page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight">Get your salon ready</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Follow these four steps in order — staff first, then services, then go live.
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</p>
            <p className="text-lg font-black text-brand">{progress}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="divide-y divide-slate-50">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${
              step.current ? "bg-amber-50/40" : ""
            }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Circle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    step.current ? "text-brand" : "text-slate-300"
                  }`}
                />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Step {step.step}
                </p>
                <p className={`font-bold text-sm ${step.done ? "text-slate-500" : "text-slate-900"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
            {step.current && (
              <Link
                href={step.href}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-black text-xs font-bold whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                {step.actionLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ol>

      {currentStep && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Next:</span> {currentStep.description}
        </div>
      )}
    </div>
  );
}
