"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SALON_OWNER_GUIDE_FALLBACKS,
  resolveSalonOwnerGuideDocuments,
  type SalonOwnerGuideDocument,
} from "@/lib/salon-owner-guide-fallback";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SalonOwnerGuideDownloads() {
  const [docs, setDocs] = useState<SalonOwnerGuideDocument[]>(SALON_OWNER_GUIDE_FALLBACKS);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const staticFallbacks = SALON_OWNER_GUIDE_FALLBACKS;
    void Promise.resolve().then(() => {
      fetch("/api/public/help-documents?document_type=salon_owner_guide")
        .then(async (r) => {
          if (!r.ok) return staticFallbacks;
          const data = (await r.json()) as { documents?: SalonOwnerGuideDocument[] };
          return resolveSalonOwnerGuideDocuments(data.documents);
        })
        .then((resolved) => {
          if (!cancelled) setDocs(resolved);
        })
        .catch(() => {
          if (!cancelled) setDocs(staticFallbacks);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = async (doc: SalonOwnerGuideDocument) => {
    const url = doc.download_url || doc.file_url;
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopiedSlug(doc.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="guides" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight mb-1">
              Download Salon Owner Handbook (PDF)
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
              Professional step-by-step PDF guides for Trimma salon owners — profile setup, bookings,
              staff, finance, and growing your business. Available in English, Sinhala, and Tamil.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const href = doc.download_url || doc.file_url;
          const size = formatSize(doc.file_size_bytes);
          return (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col gap-4 hover:border-brand/40 transition-colors"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                  {LANG_LABELS[doc.language] || doc.language}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 mt-2 leading-snug">{doc.title}</h3>
                {doc.description && (
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-3">{doc.description}</p>
                )}
                {size && <p className="text-[10px] text-zinc-400 mt-2 font-semibold">{size} PDF</p>}
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <a href={href} target="_blank" rel="noopener noreferrer" download>
                  <Button className="w-full h-10 rounded-xl bg-[#ffde5a] hover:bg-[#ffde5a]/90 text-black font-bold text-xs">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Handbook
                  </Button>
                </a>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 rounded-xl text-xs font-semibold border-slate-200"
                  onClick={() => void copyLink(doc)}
                >
                  {copiedSlug === doc.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      Link copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 mr-2" />
                      Copy share link
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
