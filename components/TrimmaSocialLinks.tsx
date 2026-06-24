import { Facebook, Youtube } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import {
  TRIMMA_FACEBOOK_URL,
  TRIMMA_TIKTOK_URL,
  TRIMMA_YOUTUBE_URL,
  trimmaSocialIconClass,
} from "@/lib/trimma-social-links";

type TrimmaSocialLinksProps = {
  className?: string;
};

export function TrimmaSocialLinks({ className = "flex items-center gap-3" }: TrimmaSocialLinksProps) {
  return (
    <div className={className}>
      <a
        href={TRIMMA_FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Trimma on Facebook"
        className={trimmaSocialIconClass}
      >
        <Facebook className="w-5 h-5" />
      </a>
      <a
        href={TRIMMA_YOUTUBE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Trimma on YouTube"
        className={trimmaSocialIconClass}
      >
        <Youtube className="w-5 h-5" />
      </a>
      <a
        href={TRIMMA_TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Trimma on TikTok"
        className={trimmaSocialIconClass}
      >
        <TikTokIcon className="w-5 h-5" />
      </a>
    </div>
  );
}
