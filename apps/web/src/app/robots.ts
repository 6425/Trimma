import type { MetadataRoute } from "next";
import { getRobotsAllowPaths, getRobotsDisallowPaths } from "@/lib/site-seo";
import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: getRobotsAllowPaths(),
      disallow: getRobotsDisallowPaths(),
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
