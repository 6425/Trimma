"use client";

import { Facebook, Youtube } from "lucide-react";
import { readSalonSocialLinks, type SalonSocialLinks } from "@/lib/salon-public-social";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

const linkClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/15 bg-black/10 text-black hover:bg-black/20 transition-colors";

const facebookLinkClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#ffde5a] bg-[#ffde5a] text-black hover:bg-[#ffe680] hover:border-[#ffe680] transition-colors";

type Props = {
  salon: Record<string, unknown> | null | undefined;
  links?: SalonSocialLinks;
  className?: string;
};

export function SalonSocialLinks({ salon, links, className = "" }: Props) {
  const social = links ?? readSalonSocialLinks(salon);
  const items = [
    social.facebookUrl
      ? { key: "facebook", href: social.facebookUrl, label: "Facebook", icon: <Facebook className="w-4 h-4" /> }
      : null,
    social.tiktokUrl
      ? { key: "tiktok", href: social.tiktokUrl, label: "TikTok", icon: <TikTokIcon className="w-4 h-4" /> }
      : null,
    social.youtubeUrl
      ? { key: "youtube", href: social.youtubeUrl, label: "YouTube", icon: <Youtube className="w-4 h-4" /> }
      : null,
  ].filter(Boolean) as Array<{ key: string; href: string; label: string; icon: React.ReactNode }>;

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.label}
          aria-label={`${item.label} page`}
          className={item.key === "facebook" ? facebookLinkClass : linkClass}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
