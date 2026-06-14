"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, ExternalLink, RefreshCw, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAdminHelpDocuments } from "@/app/actions/help-documents";

type HelpDoc = {
  id: string;
  slug: string;
  language: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  version: number;
  is_published: boolean;
  updated_at: string;
};

const LANG: Record<string, string> = { en: "English", si: "සිංහල", ta: "தமிழ்" };

function fmtSize(b: number | null) {
  if (!b) return "—";
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminHelpDocumentsPage() {
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAdminHelpDocuments();
    if (result.success === true) {
      setDocs(result.documents);
    } else {
      setError(result.error);
      setDocs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publicShareUrl = (doc: HelpDoc) => {
    const path = doc.file_url?.startsWith("http")
      ? doc.file_url
      : `${typeof window !== "undefined" ? window.location.origin : ""}${doc.file_url || ""}`;
    return path;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#F5B700]" />
            Help Documents
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Customer booking guide Word documents in English, Sinhala, and Tamil.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-zinc-200"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Regenerate PDFs:</strong> Run{" "}
        <code className="bg-white/80 px-1.5 py-0.5 rounded text-xs">node apps/web/scripts/generate-booking-guide-docx.mjs</code>{" "}
        locally, then{" "}
        <code className="bg-white/80 px-1.5 py-0.5 rounded text-xs">--upload</code> with Supabase env vars to sync storage + DB.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading documents…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
          <p className="mt-2 text-xs text-red-600">
            Apply <code>packages/db/HELP_DOCUMENTS_PATCH.sql</code> in Supabase if the table does not exist yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge className="bg-[#F5B700]/15 text-zinc-900 border-none text-[10px] font-bold">
                    {LANG[doc.language] || doc.language}
                  </Badge>
                  {doc.is_published ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-bold">Published</Badge>
                  ) : (
                    <Badge className="bg-zinc-100 text-zinc-600 border-none text-[10px] font-bold">Draft</Badge>
                  )}
                  <span className="text-[10px] text-zinc-400 font-semibold">v{doc.version} · {fmtSize(doc.file_size_bytes)}</span>
                </div>
                <h2 className="font-bold text-zinc-900 truncate">{doc.title}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{doc.description}</p>
                <p className="text-[10px] text-zinc-400 mt-2">Updated {fmtDate(doc.updated_at)} · {doc.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {doc.file_url && (
                  <>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button className="h-9 rounded-xl bg-zinc-900 text-white text-xs font-bold">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                    </a>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold border-zinc-200">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Preview
                      </Button>
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl text-xs font-semibold border-zinc-200"
                      onClick={() => void navigator.clipboard.writeText(publicShareUrl(doc))}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Copy link
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
