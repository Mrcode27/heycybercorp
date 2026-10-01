import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const OG_IMAGE = { url: "/logo.png", width: 512, height: 512, alt: SITE_NAME };

/**
 * Canonical + hreflang for one page. The site exists in a single version, aimed
 * at France: declaring it as fr-FR (and as the x-default) tells search engines
 * which market it serves, on top of the .fr domain. Without it a French-language
 * page is just as plausibly for any francophone country.
 */
export function pageAlternates(path: string): Metadata["alternates"] {
  const url = path === "" ? "/" : path;
  return { canonical: url, languages: { "fr-FR": url, "x-default": url } };
}

/**
 * Page metadata with a matching canonical URL and per-page social cards.
 *
 * Next does NOT derive `og:title` from `title`. A page that sets only
 * title/description therefore inherits the root layout's OpenGraph block, so
 * every share of that page shows the *homepage* copy. Building both from one
 * source here keeps them in sync.
 *
 * `path` must start with "/" (or be "" for the home page).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: pageAlternates(path),
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      url: `${SITE_URL}${path}`,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
