"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildSalonPublicUrl, resolveSalonPublicBaseUrl } from "@/lib/salon-qr-flyer";

type SalonPublicQrSectionProps = {
  salonName: string;
  slug: string;
  /** Compact card for the booking sidebar (desktop). */
  variant?: "default" | "sidebar";
};

/** Same booking URL as the owner dashboard “Store QR Flyer” preview. */
export function SalonPublicQrSection({
  salonName,
  slug,
  variant = "default",
}: SalonPublicQrSectionProps) {
  const salonPublicUrl = useMemo(() => {
    if (!slug?.trim()) return "";
    return buildSalonPublicUrl(slug, resolveSalonPublicBaseUrl());
  }, [slug]);

  if (!slug?.trim() || !salonPublicUrl) return null;

  if (variant === "sidebar") {
    return (
      <section
        className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5"
        aria-label="Salon booking QR code"
      >
        <h3 className="text-sm font-bold text-zinc-900 mb-1">Scan to book</h3>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Open this salon on Trimma and book in one scan.
        </p>
        <div className="rounded-xl border-2 border-zinc-900 bg-white p-3 text-center">
          <QRCodeSVG
            value={salonPublicUrl}
            size={128}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#000000"
            role="img"
            aria-label={`QR code to book ${salonName} on Trimma`}
            className="mx-auto"
          />
          <span className="text-[9px] font-extrabold tracking-widest text-[#ffc800] uppercase block mt-2">
            Scan to Book
          </span>
        </div>
      </section>
    );
  }

  return (
    <section id="salon-qr" className="scroll-mt-24" aria-label="Salon booking QR code">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">Scan to book</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="shrink-0 mx-auto sm:mx-0">
            <div className="rounded-2xl border-2 border-zinc-900 bg-white p-4 shadow-sm text-center">
              <QRCodeSVG
                value={salonPublicUrl}
                size={160}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#000000"
                role="img"
                aria-label={`QR code to book ${salonName} on Trimma`}
                className="mx-auto"
              />
              <span className="text-[10px] font-extrabold tracking-widest text-[#ffc800] uppercase block mt-3">
                Scan to Book
              </span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-sm text-zinc-600 leading-relaxed">
              Scan this code to open <span className="font-semibold text-zinc-900">{salonName}</span> on
              Trimma and book your next appointment.
            </p>
            <p className="mt-3 text-xs font-mono text-zinc-500 break-all">{salonPublicUrl}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
