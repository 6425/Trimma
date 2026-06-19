"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Eye, FileText, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getSalonVerificationDocumentUrls } from "@/app/actions/salon-verification-documents";
import type { SalonVerificationDocumentView } from "@/lib/salon-verification-documents";
import { Button } from "@/components/ui/button";

type SalonVerificationDocumentsPanelProps = {
  salonId: string;
  compact?: boolean;
  className?: string;
};

export function SalonVerificationDocumentsPanel({
  salonId,
  compact = false,
  className = "",
}: SalonVerificationDocumentsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<SalonVerificationDocumentView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await getSalonVerificationDocumentUrls(salonId);
      if (cancelled) return;

      if (result.success === false) {
        setError(result.error);
        setDocuments([]);
      } else {
        setDocuments(result.documents);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [salonId]);

  const uploadedCount = documents.filter((doc) => doc.storagePath).length;

  const openDocument = (doc: SalonVerificationDocumentView) => {
    if (!doc.signedUrl) {
      toast.error("Could not open this document. Ask the owner to re-upload it.");
      return;
    }
    window.open(doc.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">
              Verification Documents
            </h3>
            <p className="mt-1 text-xs font-medium text-indigo-700/80">
              Review NIC, business registration, and bank proof before approving this salon.
            </p>
          </div>
        </div>
        {!loading && !error && (
          <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
            {uploadedCount}/{documents.length} uploaded
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading documents…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {documents.map((doc) => (
            <div
              key={doc.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    doc.storagePath ? "bg-emerald-100" : "bg-zinc-100"
                  }`}
                >
                  <FileText
                    className={`h-4 w-4 ${doc.storagePath ? "text-emerald-600" : "text-zinc-400"}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900">{doc.label}</p>
                  <p className="text-[11px] font-medium text-zinc-500">
                    {doc.storagePath
                      ? doc.signedUrl
                        ? "Ready to review"
                        : "Uploaded but unavailable"
                      : "Not uploaded yet"}
                  </p>
                </div>
              </div>

              {doc.storagePath ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!doc.signedUrl}
                  onClick={() => openDocument(doc)}
                  className="shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View
                  <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
                </Button>
              ) : (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Missing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
