import { SITE_URL } from "@/lib/site";

/**
 * BreadcrumbList schema — Google renders this as the breadcrumb trail in search
 * results ("heycybercorp › Formations › OSINT") instead of a raw URL.
 * Paths are site-relative and start with "/".
 */
export default function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; path: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
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
