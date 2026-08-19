import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Courses = FunctionReturnType<typeof api.courses.listPublished>;

/** ISO-8601 duration ("PT2H30M") — what schema.org expects, not raw seconds. */
function isoDuration(totalSec: number): string | undefined {
  if (!totalSec || totalSec <= 0) return undefined;
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  // Sub-minute totals would yield a bare "PT", which is invalid — round up.
  if (h === 0 && m === 0) return "PT1M";
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
}

/**
 * schema.org ItemList of Courses for the catalogue page. This is what lets
 * Google show the courses as rich results rather than a plain blue link.
 * Server-rendered: it must be in the HTML the crawler receives.
 */
export default function CourseListJsonLd({ courses }: { courses: Courses }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catalogue des formations heycybercorp",
    numberOfItems: courses.length,
    itemListElement: courses.map((c, i) => {
      const workload = isoDuration(c.durationSec);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Course",
          name: c.title,
          description: c.description,
          url: `${SITE_URL}/formations/${c.slug}`,
          inLanguage: "fr",
          educationalLevel: c.level,
          provider: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
          },
          // priceEur is in cents and comes from the covering package.
          ...(c.priceEur != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: (c.priceEur / 100).toFixed(2),
                  priceCurrency: "EUR",
                  category: "Paid",
                  availability: "https://schema.org/InStock",
                  url: `${SITE_URL}/formations/${c.slug}`,
                },
              }
            : {}),
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: workload,
            inLanguage: "fr",
          },
        },
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      // Escaping "<" keeps a course title containing markup from breaking out
      // of the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
