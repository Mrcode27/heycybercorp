import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Crawl rules. Everything public is open; the console, the auth pages and the
 * certificate viewer are not. Certificates carry a learner's real name, so they
 * stay out of the index for privacy, not for SEO.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api/", "/connexion", "/inscription", "/certificat"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
