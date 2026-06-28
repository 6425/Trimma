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
      variant="default"
      size="sm"
      className={`rounded-full h-11 px-3 text-xs font-bold shrink-0 ${className}`}
      onClick={() => openFacebookShare(shareUrl)}
    >
      <Facebook className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </Button>
  );
}
