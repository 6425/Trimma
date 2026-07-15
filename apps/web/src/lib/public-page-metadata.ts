import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const DEFAULT_OG_IMAGE_PATH = "/logo-yellow.png";

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
      images: [{ url: ogImage, alt: "Trimma — Find. Book. Glow." }],
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
