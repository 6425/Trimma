"use client";

import React, { useState, useEffect } from "react";
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
  logo_name: string;
  logo_name_font_family: string;
  logo_name_font_size: number;
  logo_name_color: string;
  logo_tagline: string;
  logo_tagline_font_family: string;
  logo_tagline_font_size: number;
  logo_tagline_color: string;
};

const DEFAULT_BRANDING: BrandingSettings = {
  logo_name: "Trimma",
  logo_name_font_family: "Outfit",
  logo_name_font_size: 22,
  logo_name_color: "var(--color-brand)",
  logo_tagline: "Sri Lanka's Premium Grooming Marketplace",
  logo_tagline_font_family: "Inter",
  logo_tagline_font_size: 9,
  logo_tagline_color: "#64748b",
};

let cachedBranding: BrandingSettings | null = null;
let brandingListeners: Array<(data: BrandingSettings) => void> = [];

function normalizeBranding(data: Partial<BrandingSettings> | null | undefined): BrandingSettings {
  return {
    logo_name: data?.logo_name || DEFAULT_BRANDING.logo_name,
    logo_name_font_family: data?.logo_name_font_family || DEFAULT_BRANDING.logo_name_font_family,
    logo_name_font_size: data?.logo_name_font_size || DEFAULT_BRANDING.logo_name_font_size,
    logo_name_color: data?.logo_name_color || DEFAULT_BRANDING.logo_name_color,
    logo_tagline: data?.logo_tagline || DEFAULT_BRANDING.logo_tagline,
    logo_tagline_font_family: data?.logo_tagline_font_family || DEFAULT_BRANDING.logo_tagline_font_family,
    logo_tagline_font_size: data?.logo_tagline_font_size || DEFAULT_BRANDING.logo_tagline_font_size,
    logo_tagline_color: data?.logo_tagline_color || DEFAULT_BRANDING.logo_tagline_color,
  };
}

export function pubSubUpdateBranding(data: Record<string, unknown>) {
  const normalized = normalizeBranding(data as Partial<BrandingSettings>);
  cachedBranding = normalized;
  if (typeof window !== "undefined") {
    localStorage.setItem("trimma_branding_settings", JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("trimma_branding_update", { detail: normalized }));
  }
  brandingListeners.forEach((listener) => listener(normalized));
}

export default function Logo({
  className = "",
  iconSize = 48,
  showTagline = true,
  inverse = false,
  title: propTitle,
  tagline: propTagline,
}: LogoProps) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    const handleUpdate = (updatedData: BrandingSettings) => {
      setBranding(normalizeBranding(updatedData));
    };

    const handleEventUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setBranding(normalizeBranding(customEvent.detail));
      }
    };

    brandingListeners.push(handleUpdate);
    window.addEventListener("trimma_branding_update", handleEventUpdate);

    void Promise.resolve().then(() => {
      if (cachedBranding) {
        setBranding(normalizeBranding(cachedBranding));
      } else {
        const stored = localStorage.getItem("trimma_branding_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            cachedBranding = normalizeBranding(parsed);
            setBranding(cachedBranding);
          } catch {
            // ignore invalid cache
          }
        }
      }

      void (async () => {
        try {
          const { data, error } = await supabase
            .from("global_branding_settings")
            .select("logo_name, logo_name_font_family, logo_name_font_size, logo_name_color, logo_tagline, logo_tagline_font_family, logo_tagline_font_size, logo_tagline_color")
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            pubSubUpdateBranding(data);
            setBranding(normalizeBranding(data));
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

  useEffect(() => {
    void Promise.resolve().then(() => {
      const injectFont = (fontName: string) => {
        if (!fontName || ["sans-serif", "serif", "monospace", "Arial", "Inter"].includes(fontName)) return;
        const fontId = `google-font-${fontName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        if (document.getElementById(fontId)) return;

        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      };

      injectFont(branding.logo_name_font_family);
      injectFont(branding.logo_tagline_font_family);
    });
  }, [branding.logo_name_font_family, branding.logo_tagline_font_family]);

  const logoText = propTitle || branding.logo_name;
  const logoTagline = propTagline || branding.logo_tagline;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} style={{ height: iconSize }}>
      <div
        className="relative flex items-center justify-center transition-all duration-300 hover:scale-105 flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(216,30,91,0.25)]"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="46" fill="url(#logo-grad-bg)" stroke={branding.logo_name_color} strokeWidth="3" />
          <circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" />
          <path
            d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z"
            fill="url(#logo-crown-grad)"
            opacity="0.9"
          />
          <path
            d="M44 52 L36 68 M56 52 L64 68"
            stroke={branding.logo_name_color}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <circle cx="36" cy="68" r="4.5" stroke={branding.logo_name_color} strokeWidth="3" />
          <circle cx="64" cy="68" r="4.5" stroke={branding.logo_name_color} strokeWidth="3" />
          <circle cx="50" cy="54" r="3" fill="#ffffff" />
          <defs>
            <linearGradient id="logo-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={branding.logo_name_color} />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="logo-crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <span
          style={{
            fontFamily: branding.logo_name_font_family,
            fontSize: `${branding.logo_name_font_size}px`,
            color: inverse ? "#ffffff" : branding.logo_name_color,
          }}
          className="font-black tracking-tight leading-none transition-all duration-300"
        >
          {logoText}
        </span>

        {showTagline && (
          <span
            style={{
              fontFamily: branding.logo_tagline_font_family,
              fontSize: `${branding.logo_tagline_font_size}px`,
              color: inverse ? "rgba(255, 255, 255, 0.6)" : branding.logo_tagline_color,
            }}
            className="uppercase font-extrabold tracking-widest mt-1.5 leading-none transition-all duration-300"
          >
            {logoTagline}
          </span>
        )}
      </div>
    </div>
  );
}
