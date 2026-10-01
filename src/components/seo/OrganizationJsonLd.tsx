import { SITE_NAME, SITE_URL, SOCIALS, isConfigured } from "@/lib/site";

/**
 * Organization + WebSite schema for the home page. This is what lets Google
 * treat heycybercorp as a brand entity rather than an anonymous domain.
 *
 * `sameAs` is populated from the real social links only — placeholder "#"
 * entries are skipped, so filling one in later wires it up automatically.
 * Claiming a profile you don't own is worse than claiming none.
 */
export default function OrganizationJsonLd() {
  const sameAs = SOCIALS.filter((s) => isConfigured(s.href)).map((s) => s.href);

  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Formations en cybersécurité en ligne, en français, pour la France et l'Europe : fondamentaux, hacking éthique, OSINT et gouvernance.",
    // Locality + country only: the full street address belongs here once
    // LEGAL.address in src/lib/site.ts is filled in.
    address: { "@type": "PostalAddress", addressLocality: "Paris", addressCountry: "FR" },
    // The market the site is built for. Listed countries rather than the
    // continent alone, so the francophone neighbours of France count too.
    areaServed: [
      { "@type": "Country", name: "France" },
      { "@type": "Country", name: "Belgique" },
      { "@type": "Country", name: "Suisse" },
      { "@type": "Country", name: "Luxembourg" },
      { "@type": "Place", name: "Europe" },
    ],
    knowsLanguage: "fr-FR",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  const data = { "@context": "https://schema.org", "@graph": [organization, website] };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
