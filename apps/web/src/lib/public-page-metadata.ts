import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function buildPublicPageMetadata({
  title,
  description,
  path,
}: PublicPageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.includes("Trimma") ? title : `${title} | Trimma`;

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
    },
    robots: { index: true, follow: true },
  };
}
