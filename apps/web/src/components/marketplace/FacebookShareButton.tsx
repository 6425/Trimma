"use client";

import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openFacebookShare } from "@/lib/salon-public-social";

type Props = {
  shareUrl: string;
  label?: string;
  className?: string;
};

export function FacebookShareButton({ shareUrl, label = "Share", className = "" }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`rounded-full h-9 px-3 text-xs font-bold border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/10 ${className}`}
      onClick={() => openFacebookShare(shareUrl)}
    >
      <Facebook className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </Button>
  );
}
