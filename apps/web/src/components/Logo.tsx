"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface LogoProps {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
  inverse?: boolean;
  title?: string;
  tagline?: string;
}

// Default luxury branding values used as safe fallback
const DEFAULT_BRANDING = {
  logo_name: "Trimma",
  logo_name_font_family: "Outfit",
  logo_name_font_size: 22,
  logo_name_color: "var(--color-brand)",
  logo_tagline: "Sri Lanka's Premium Grooming Marketplace",
  logo_tagline_font_family: "Inter",
  logo_tagline_font_size: 9,
  logo_tagline_color: "#64748b",
  logo_svg_raw: "",
  logo_image_url: ""
};

// Pub-Sub caching layer to prevent duplicate database calls from multiple Logo instances
let cachedBranding: any = null;
let brandingListeners: Array<(data: any) => void> = [];

export function pubSubUpdateBranding(data: any) {
  cachedBranding = data;
  if (typeof window !== "undefined") {
    localStorage.setItem("trimma_branding_settings", JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("trimma_branding_update", { detail: data }));
  }
  brandingListeners.forEach(listener => listener(data));
}

export default function Logo({ 
  className = "", 
  iconSize = 48, 
  showTagline = true, 
  inverse = false,
  title: propTitle,
  tagline: propTagline
}: LogoProps) {
  
  // Always initialize with DEFAULT_BRANDING to ensure identical server and client initial markup
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    // Load cached branding settings on client mount to prevent SSR mismatch
    if (typeof window !== "undefined") {
      if (cachedBranding) {
        setBranding(cachedBranding);
      } else {
        const stored = localStorage.getItem("trimma_branding_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            cachedBranding = parsed;
            setBranding(parsed);
          } catch (_) {}
        }
      }
    }

    // 1. Subscribe to pub-sub styling updates
    const handleUpdate = (updatedData: any) => {
      setBranding(updatedData);
    };
    brandingListeners.push(handleUpdate);

    // 2. Cross-component custom event listener
    const handleEventUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
      }
    };
    window.addEventListener("trimma_branding_update", handleEventUpdate);

    // 3. Fetch latest branding settings from Supabase on mount to stay in perfect real-time sync
    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from("global_branding_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        if (data) {
          pubSubUpdateBranding(data);
          setBranding(data); // Sync local state immediately
        }
      } catch (err) {
        console.log("Global branding lookup skipped or table not initialized yet.");
      }
    };

    fetchBranding();

    return () => {
      brandingListeners = brandingListeners.filter(l => l !== handleUpdate);
      window.removeEventListener("trimma_branding_update", handleEventUpdate);
    };
  }, []);

  // 4. Inject Google Font families dynamically into document head
  useEffect(() => {
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
  }, [branding.logo_name_font_family, branding.logo_tagline_font_family]);

  // Resolve layout parameters
  const logoText = propTitle || branding.logo_name;
  const logoTagline = propTagline || branding.logo_tagline;
  const isSvgCustom = !!branding.logo_svg_raw;

  // Extract base64 image data-url if raw SVG contains a wrapped image, allowing self-healing borderless rendering
  let customImageSrc = "";
  if (isSvgCustom) {
    const match = branding.logo_svg_raw.match(/href="([^"]+)"/i) || branding.logo_svg_raw.match(/href='([^']+)'/i);
    if (match) {
      customImageSrc = match[1];
    }
  }

  if (branding.logo_image_url) {
    return (
      <div className={`flex items-center select-none ${className}`} style={{ height: iconSize }}>
        <img 
          src={branding.logo_image_url} 
          alt={logoText} 
          style={{ height: iconSize }}
          className="w-auto max-w-full object-contain rounded-xl transition-all duration-300 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} style={{ height: iconSize }}>
      {/* 1. Sleek Icon / SVG Container */}
      <div 
        className={`relative flex items-center justify-center transition-all duration-300 hover:scale-105 flex-shrink-0 ${
          isSvgCustom ? "bg-white border border-slate-200/60 rounded-xl p-0.5 shadow-sm" : ""
        }`} 
        style={isSvgCustom ? { height: '100%', width: 'auto', aspectRatio: '1/1' } : { width: iconSize, height: iconSize }}
      >
        {isSvgCustom ? (
          customImageSrc ? (
            <img 
              src={customImageSrc} 
              alt={logoText} 
              className="h-full w-auto object-contain transition-all duration-300 scale-105 hover:scale-115"
              style={{ height: '100%' }}
            />
          ) : (
            <div 
              className="w-full h-full object-contain [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
              dangerouslySetInnerHTML={{ __html: branding.logo_svg_raw }}
            />
          )
        ) : (
          // Default Premium Scissors & Glow Circle Badge Logo Design
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(216,30,91,0.25)]"
            fill="none"
          >
            <circle cx="50" cy="50" r="46" fill="url(#logo-grad-bg)" stroke={branding.logo_name_color} strokeWidth="3" />
            <circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" />
            
            {/* Crown Motif */}
            <path 
              d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z" 
              fill="url(#logo-crown-grad)" 
              opacity="0.9"
            />
            {/* Intersecting Scissors */}
            <path 
              d="M44 52 L36 68 M56 52 L64 68" 
              stroke={branding.logo_name_color} 
              strokeWidth="4.5" 
              strokeLinecap="round" 
            />
            <circle cx="36" cy="68" r="4.5" stroke={branding.logo_name_color} strokeWidth="3" />
            <circle cx="64" cy="68" r="4.5" stroke={branding.logo_name_color} strokeWidth="3" />
            
            {/* Center Pivot Pin */}
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
        )}
      </div>

      {/* 2. Sleek Typography Column */}
      <div className="flex flex-col justify-center">
        <span 
          style={{ 
            fontFamily: branding.logo_name_font_family,
            fontSize: `${branding.logo_name_font_size}px`,
            color: inverse ? '#ffffff' : branding.logo_name_color,
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
              color: inverse ? 'rgba(255, 255, 255, 0.6)' : branding.logo_tagline_color,
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
