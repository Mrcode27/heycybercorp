import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * schema.org Course for a single course page — the structured data behind
 * Google's course rich results. Server-rendered so it reaches the crawler.
 */
export default function CourseJsonLd({
  title,
  description,
  slug,
  level,
  priceEurCents,
}: {
  title: string;
  description: string;
  slug: string;
  level: string;
  priceEurCents: number | null;
}) {
  const url = `${SITE_URL}/formations/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description,
    url,
    inLanguage: "fr",
    educationalLevel: level,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(priceEurCents != null
      ? {
          offers: {
            "@type": "Offer",
            price: (priceEurCents / 100).toFixed(2),
            priceCurrency: "EUR",
            category: "Paid",
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: "fr",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
