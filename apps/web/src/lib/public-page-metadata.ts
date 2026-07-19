import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

/** 1200×630 share card: Trimma logo centered on brand dark (not the raw logo banner). */
export const DEFAULT_OG_IMAGE_PATH = "/og-share.png";
export const DEFAULT_OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const DEFAULT_OG_IMAGE_ALT = "Trimma — Find. Book. Glow.";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImagePath?: string;
};

export function buildPublicPageMetadata({
  title,
  description,
  path,
  ogImagePath = DEFAULT_OG_IMAGE_PATH,
}: PublicPageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.includes("Trimma") ? title : `${title} | Trimma`;
  const ogImage = absoluteUrl(ogImagePath);

  return {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: "Trimma",
      type: "website",
      images: [
        {
          url: ogImage,
          alt: DEFAULT_OG_IMAGE_ALT,
          width: DEFAULT_OG_IMAGE_SIZE.width,
          height: DEFAULT_OG_IMAGE_SIZE.height,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}
