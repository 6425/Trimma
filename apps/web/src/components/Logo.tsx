"use client";

import React, { useState, useEffect } from "react";
import { Scissors } from "lucide-react";
import { supabase } from "../config/supabase";

interface LogoProps {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
  inverse?: boolean;
  title?: string;
  tagline?: string;
}

type BrandingSettings = {
  logo_tagline: string;
};

const DEFAULT_TAGLINE = "Sri Lanka's Premium Grooming Marketplace";

let cachedTagline: string | null = null;
let brandingListeners: Array<(tagline: string) => void> = [];

export function pubSubUpdateBranding(data: Record<string, unknown>) {
  const tagline =
    typeof data.logo_tagline === "string" && data.logo_tagline.trim()
      ? data.logo_tagline
      : DEFAULT_TAGLINE;

  cachedTagline = tagline;
  if (typeof window !== "undefined") {
    localStorage.setItem("trimma_branding_tagline", tagline);
    window.dispatchEvent(new CustomEvent("trimma_branding_update", { detail: data }));
  }
  brandingListeners.forEach((listener) => listener(tagline));
}

export default function Logo({
  className = "",
  iconSize = 32,
  showTagline = false,
  inverse = false,
  title,
  tagline: propTagline,
}: LogoProps) {
  const [defaultTagline, setDefaultTagline] = useState(DEFAULT_TAGLINE);

  useEffect(() => {
    const handleUpdate = (updatedTagline: string) => {
      setDefaultTagline(updatedTagline);
    };

    const handleEventUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ logo_tagline?: string }>;
      if (typeof customEvent.detail?.logo_tagline === "string") {
        setDefaultTagline(customEvent.detail.logo_tagline);
      }
    };

    brandingListeners.push(handleUpdate);
    window.addEventListener("trimma_branding_update", handleEventUpdate);

    void Promise.resolve().then(() => {
      if (cachedTagline) {
        setDefaultTagline(cachedTagline);
      } else {
        const stored = localStorage.getItem("trimma_branding_tagline");
        if (stored) {
          cachedTagline = stored;
          setDefaultTagline(stored);
        }
      }

      void (async () => {
        try {
          const { data, error } = await supabase
            .from("global_branding_settings")
            .select("logo_tagline")
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            pubSubUpdateBranding(data);
            if (data.logo_tagline) setDefaultTagline(data.logo_tagline);
          }
        } catch {
          // table may not exist yet in some environments
        }
      })();
    });

    return () => {
      brandingListeners = brandingListeners.filter((listener) => listener !== handleUpdate);
      window.removeEventListener("trimma_branding_update", handleEventUpdate);
    };
  }, []);

  const wordmark = `${(title || "Trimma").replace(/\.$/, "")}.`;
  const displayTagline = propTagline ?? (showTagline ? defaultTagline : null);
  const scissorsSize = Math.max(14, Math.round(iconSize * 0.62));
  const wordmarkSize = Math.max(16, Math.round(iconSize * 0.55));

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div
        className="rounded-lg bg-[#F5B700] flex items-center justify-center shrink-0"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        <Scissors
          className="text-black"
          style={{ width: scissorsSize, height: scissorsSize }}
          strokeWidth={2.25}
        />
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <span
          className={`font-bold tracking-tight leading-none ${inverse ? "text-white" : "text-black"}`}
          style={{ fontSize: wordmarkSize }}
        >
          {wordmark}
        </span>

        {displayTagline ? (
          <span
            className={`uppercase font-extrabold tracking-widest mt-1 leading-none truncate ${
              inverse ? "text-white/60" : "text-zinc-500"
            }`}
            style={{ fontSize: Math.max(8, Math.round(iconSize * 0.22)) }}
          >
            {displayTagline}
          </span>
        ) : null}
      </div>
    </div>
  );
}
