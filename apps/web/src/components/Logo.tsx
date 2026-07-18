/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useTheme } from "@/providers/ThemeProvider";
import { shouldShowBetaBadge } from "@/lib/show-beta-badge";

interface LogoProps {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
  inverse?: boolean;
  /** Force logo asset on branded panels (e.g. yellow login hero). */
  variant?: "auto" | "dark" | "light" | "yellow";
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
  variant = "auto",
  title,
  tagline: propTagline,
}: LogoProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [defaultTagline, setDefaultTagline] = useState(DEFAULT_TAGLINE);
  // Per-deployment: live Vercel project sets NEXT_PUBLIC_APP_URL to www.trimma.io (no badge),
  // beta project sets it to beta.trimma.io (shows badge).
  const showBetaBadge = shouldShowBetaBadge(null);

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

  const displayTagline = propTagline ?? (showTagline ? defaultTagline : null);
  const logoHeight = Math.max(iconSize * 1.2, 32);
  const logoSrc =
    variant === "dark"
      ? "/logo-dark.svg"
      : variant === "light"
        ? "/logo-light.svg"
        : variant === "yellow"
          ? "/logo-yellow.png"
          : isDarkTheme
            ? "/logo-yellow.png"
            : inverse
              ? "/logo-dark.svg"
              : "/logo-light.svg";

  const betaBadgeClass =
    variant === "dark"
      ? "bg-black/10 text-black/80 border-black/20"
      : isDarkTheme
        ? "bg-[#ffde5a]/15 text-[#ffde5a] border-[#ffde5a]/35"
        : inverse
          ? "bg-white/10 text-white/90 border-white/20"
          : "bg-slate-100 text-slate-500 border-slate-200";

  const taglineClass =
    variant === "dark"
      ? "text-black/70"
      : isDarkTheme
        ? "text-[#ffde5a]/75"
        : inverse
          ? "text-white/60"
          : "text-zinc-500";

  const brandTitle = title || "Trimma";

  if (variant === "dark") {
    return (
      <div className={`flex flex-col select-none ${className}`}>
        <div className="flex items-start gap-1.5">
          <div className="flex items-center gap-2.5" style={{ minHeight: logoHeight }}>
            <div
              className="flex shrink-0 items-center justify-center rounded-full bg-black font-black leading-none text-[#febb02]"
              style={{
                width: iconSize,
                height: iconSize,
                fontSize: Math.round(iconSize * 0.58),
              }}
              aria-hidden
            >
              t
            </div>
            <span
              className="font-black text-black tracking-tight leading-none"
              style={{ fontSize: Math.round(iconSize * 0.88) }}
            >
              {brandTitle}
            </span>
          </div>
          {showBetaBadge ? (
            <span
              className={`mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${betaBadgeClass}`}
            >
              Beta
            </span>
          ) : null}
        </div>
        {displayTagline ? (
          <span
            className={`uppercase font-extrabold tracking-widest mt-1 leading-none truncate ${taglineClass}`}
            style={{ fontSize: Math.max(8, Math.round(iconSize * 0.22)) }}
          >
            {displayTagline}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-start">
        <img
          src={logoSrc}
          alt="Trimma Logo"
          style={{ height: logoHeight }}
          className="w-auto object-contain"
          fetchPriority="high"
          draggable={false}
        />
        {showBetaBadge ? (
          <span className={`ml-1.5 mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${betaBadgeClass}`}>
            Beta
          </span>
        ) : null}
      </div>
      {displayTagline ? (
        <span
          className={`uppercase font-extrabold tracking-widest mt-1 leading-none truncate ${taglineClass}`}
          style={{ fontSize: Math.max(8, Math.round(iconSize * 0.22)) }}
        >
          {displayTagline}
        </span>
      ) : null}
    </div>
  );
}

