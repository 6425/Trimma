import { PUBLIC_SITE_NAV_LINKS } from "@/lib/site-seo";
import {
  TRIMMA_FACEBOOK_URL,
  TRIMMA_INSTAGRAM_URL,
  TRIMMA_TIKTOK_URL,
  TRIMMA_YOUTUBE_URL,
} from "@/lib/trimma-social-links";
import { absoluteUrl } from "@/lib/site-url";

export function PublicSiteJsonLd() {
  const siteUrl = absoluteUrl("/");

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trimma",
    url: siteUrl,
    description:
      "Find and book salons across Sri Lanka — barbers, beauty parlours, spas, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Trimma",
    url: siteUrl,
    logo: absoluteUrl("/logo-yellow.png"),
    sameAs: [TRIMMA_FACEBOOK_URL, TRIMMA_INSTAGRAM_URL, TRIMMA_YOUTUBE_URL, TRIMMA_TIKTOK_URL],
  };

  const siteNavigation = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trimma public pages",
    itemListElement: PUBLIC_SITE_NAV_LINKS.map((link, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: link.name,
      description: link.description,
      url: absoluteUrl(link.path),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigation) }}
      />
    </>
  );
}
