import { absoluteUrl } from "@/lib/site-url";

export function PublicSiteJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trimma",
    url: absoluteUrl("/"),
    description:
      "Find and book salons across Sri Lanka — barbers, beauty parlours, spas, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
