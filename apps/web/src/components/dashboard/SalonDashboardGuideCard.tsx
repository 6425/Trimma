"use client";

import Link from "next/link";
import { BookOpen, Download, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SALON_OWNER_GUIDE_FALLBACKS } from "@/lib/salon-owner-guide-fallback";

const LANG_OPTIONS = [
  { code: "en", native: "English" },
  { code: "si", native: "සිංහල" },
  { code: "ta", native: "தமிழ்" },
] as const;

export function SalonDashboardGuideCard() {
  const docsByLang = Object.fromEntries(SALON_OWNER_GUIDE_FALLBACKS.map((d) => [d.language, d]));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-zinc-900 shadow-sm">
      <BookOpen className="absolute -right-6 -top-6 w-32 h-32 text-[#ffde5a]/10 pointer-events-none" />
      <div className="relative z-10 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ffde5a]/15 border border-[#ffde5a]/30 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#ffde5a]" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-[#ffde5a]/15 text-[#ffde5a] border border-[#ffde5a]/25 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2">
                Salon Owner Handbook
              </span>
              <h2 className="text-lg font-black tracking-tight mb-1 text-zinc-900">Trimma Workspace Guide</h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
                Complete professional handbook — profile setup, bookings, staff, services, finance,
                and growing your salon. English, Sinhala, and Tamil.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link href="/dashboard/help">
              <Button variant="default" className="w-full sm:w-auto h-10 rounded-xl font-bold text-xs">
                Read Salon Help
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/help#guides">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 rounded-xl border-slate-200 text-zinc-900 hover:bg-slate-50 font-bold text-xs"
              >
                All downloads
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANG_OPTIONS.map(({ code, native }) => {
            const doc = docsByLang[code];
            const href = doc?.download_url || doc?.file_url || `/help/salon-owner-guide/trimma-salon-owner-guide-${code}.pdf`;
            return (
              <a
                key={code}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-[#ffde5a]/50 hover:bg-[#ffde5a]/10 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-600">{native}</div>
                  <div className="text-xs font-semibold text-zinc-900 truncate mt-0.5">
                    {doc?.title || `Salon Owner Handbook (${code})`}
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400 group-hover:text-[#ffde5a] shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
