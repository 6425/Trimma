"use client";

import Link from "next/link";
import { BookOpen, Download, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentPortal } from "@/lib/agent-portal-provider";
import { AGENT_GUIDE_FALLBACKS } from "@/lib/portal-guide-fallback";

const LANG_OPTIONS = [
  { code: "en", label: "English", native: "English" },
  { code: "si", label: "Sinhala", native: "සිංහල" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
] as const;

const GUIDE_FALLBACK_EXTENSIONS: Record<string, string> = {
  si: "pdf",
};

export function AgentDashboardGuideCard() {
  const { path } = useAgentPortal();
  const docsByLang = Object.fromEntries(AGENT_GUIDE_FALLBACKS.map((d) => [d.language, d]));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#ffc800]/25 bg-zinc-950 text-white shadow-sm">
      <BookOpen className="absolute -right-6 -top-6 w-32 h-32 text-[#ffc800]/8 pointer-events-none" />
      <div className="relative z-10 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ffc800]/15 border border-[#ffc800]/30 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#ffc800]" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-[#ffc800]/15 text-[#ffc800] border border-[#ffc800]/25 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2">
                Agent Field Handbook
              </span>
              <h2 className="text-lg font-black tracking-tight mb-1">Full Agent Portal Guide</h2>
              <p className="text-sm text-white/65 leading-relaxed max-w-xl">
                Complete walkthrough — your role, salon onboarding, Field Editor, owner invitations,
                commissions, and daily workflow. Available in English, Sinhala, and Tamil.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link href={path("/help")}>
              <Button className="w-full sm:w-auto h-10 rounded-xl bg-[#ffc800] hover:bg-[#ffc800]/90 text-black font-bold text-xs">
                Read full guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={path("/help#guides")}>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 rounded-xl border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white font-bold text-xs"
              >
                All downloads
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANG_OPTIONS.map(({ code, native }) => {
            const doc = docsByLang[code];
            const ext = GUIDE_FALLBACK_EXTENSIONS[code] || "docx";
            const href = doc?.download_url || doc?.file_url || `/help/agent-guide/trimma-agent-guide-${code}.${ext}`;
            return (
              <a
                key={code}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-[#ffc800]/40 hover:bg-[#ffc800]/10 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#ffc800]">{native}</div>
                  <div className="text-xs font-semibold text-white/90 truncate mt-0.5">
                    {doc?.title || `Agent Guide (${code})`}
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/50 group-hover:text-[#ffc800] shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
