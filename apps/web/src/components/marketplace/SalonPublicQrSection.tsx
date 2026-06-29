"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { buildSalonPublicUrl, resolveSalonPublicBaseUrl } from "@/lib/salon-qr-flyer";

type SalonPublicQrSectionProps = {
  salonName: string;
  slug: string;
};

export function SalonPublicQrSection({ salonName, slug }: SalonPublicQrSectionProps) {
  const salonPublicUrl = useMemo(() => {
    if (!slug?.trim()) return "";
    return buildSalonPublicUrl(slug, resolveSalonPublicBaseUrl());
  }, [slug]);

  if (!slug?.trim() || !salonPublicUrl) return null;

  return (
    <section id="salon-qr" className="scroll-mt-24" aria-label="Salon booking QR code">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 md:gap-8">
          <div className="shrink-0 mx-auto sm:mx-0">
            <div className="rounded-2xl border-2 border-zinc-900 bg-white p-3 shadow-sm min-h-[11rem] min-w-[11rem] flex items-center justify-center">
              <QRCodeSVG
                value={salonPublicUrl}
                size={176}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#000000"
                role="img"
                aria-label={`QR code to book ${salonName} on Trimma`}
              />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              <QrCode className="h-3.5 w-3.5" />
              Salon QR code
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">
              Scan to book on Trimma
            </h2>
            <p className="text-sm text-zinc-600 mt-2 leading-relaxed max-w-lg">
              Point your phone camera at this code to open {salonName}&apos;s booking page —
              share it at your reception desk, window, or business card.
            </p>
            <p className="mt-3 text-xs font-mono text-zinc-500 break-all">{salonPublicUrl}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
