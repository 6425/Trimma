"use client";

import { ExternalLink, MapPin, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSalonDirectionsUrl,
  getSalonFullAddress,
  getSalonMapEmbedUrl,
  salonHasMapData,
  type SalonMapInput,
} from "@/lib/salon-map";

type SalonLocationMapProps = {
  salon: SalonMapInput;
  compact?: boolean;
  className?: string;
};

export function SalonLocationMap({ salon, compact = false, className = "" }: SalonLocationMapProps) {
  if (!salonHasMapData(salon)) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center ${className}`}
      >
        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-zinc-500">Location map not available yet.</p>
        <p className="text-[10px] text-zinc-400 mt-1">Contact the salon for directions.</p>
      </div>
    );
  }

  const embedUrl = getSalonMapEmbedUrl(salon);
  const directionsUrl = getSalonDirectionsUrl(salon);
  const fullAddress = getSalonFullAddress(salon);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-zinc-900">Salon location</h4>
          {!compact && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2" title={fullAddress}>
              {fullAddress}
            </p>
          )}
        </div>
        {directionsUrl && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-9 rounded-lg text-[11px] font-bold gap-1.5 border-slate-200"
            onClick={() => window.open(directionsUrl, "_blank", "noopener,noreferrer")}
          >
            <Navigation2 className="w-3.5 h-3.5" />
            Directions
          </Button>
        )}
      </div>

      {embedUrl ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner aspect-[4/3]">
          <iframe
            title={`Map showing ${salon.name || "salon"} location`}
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-zinc-50 p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-brand shrink-0" />
          <p className="text-xs font-medium text-zinc-700">{fullAddress}</p>
        </div>
      )}

      {directionsUrl && !compact && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
