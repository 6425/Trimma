import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_ALT, DEFAULT_OG_IMAGE_SIZE } from "@/lib/public-page-metadata";

const FEATURES_ORIGIN = "https://trimma.io";
const FEATURES_PATH = "/features";
const FEATURES_URL = `${FEATURES_ORIGIN}${FEATURES_PATH}`;
const FEATURES_OG_IMAGE = `${FEATURES_ORIGIN}/og-share.png`;
const FEATURES_DESCRIPTION =
  "Explore Trimma features — instant salon booking, salon dashboard, staff scheduling, deals, analytics, and more for salons in Sri Lanka.";

export const metadata: Metadata = {
  title: { absolute: "Features | Trimma" },
  description: FEATURES_DESCRIPTION,
  alternates: { canonical: FEATURES_URL },
  openGraph: {
    title: "Features | Trimma",
    description: FEATURES_DESCRIPTION,
    url: FEATURES_URL,
    siteName: "Trimma",
    type: "website",
    images: [
      {
        url: FEATURES_OG_IMAGE,
        alt: DEFAULT_OG_IMAGE_ALT,
        width: DEFAULT_OG_IMAGE_SIZE.width,
        height: DEFAULT_OG_IMAGE_SIZE.height,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | Trimma",
    description: FEATURES_DESCRIPTION,
    images: [FEATURES_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

function FeaturesJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Features | Trimma",
    url: FEATURES_URL,
    description: FEATURES_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: "Trimma",
      url: `${FEATURES_ORIGIN}/`,
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FeaturesJsonLd />
      {children}
    </>
  );
}
