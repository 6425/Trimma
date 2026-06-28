"use client";

import React, { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildSalonOwnerInviteLoginLink } from "@/lib/salon-owner-invite-link";

type CopySalonInviteLinkButtonProps = {
  salonId: string;
  ownerEmail?: string | null;
  className?: string;
  size?: "sm" | "default";
};

export function CopySalonInviteLinkButton({
  salonId,
  ownerEmail,
  className,
  size = "sm",
}: CopySalonInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = buildSalonOwnerInviteLoginLink({ salonId, ownerEmail });
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invitation link copied. Paste it in WhatsApp or any chat.");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy the link. Please try again.");
    }
  };

  const heightClass = size === "sm" ? "h-9" : "h-10";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleCopy()}
      className={`rounded-xl font-bold text-xs shrink-0 ${heightClass} ${className || ""}`}
    >
      {copied ? (
        <Check className="w-4 h-4 mr-1.5" />
      ) : (
        <Link2 className="w-4 h-4 mr-1.5" />
      )}
      {copied ? "Copied" : "Copy invitation link"}
    </Button>
  );
}

export function SalonInviteLinkHint() {
  return (
    <p className="text-[10px] text-zinc-500 leading-relaxed">
      Share the invitation link on WhatsApp when you are offline. The owner signs in with Google and their Gmail is saved
      to this salon automatically. Automated Send Invitation (email + WhatsApp) still works as before when owner Gmail
      is set.
    </p>
  );
}
