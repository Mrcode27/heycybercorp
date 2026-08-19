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
      "Formations en cybersécurité pour les talents africains et européens : fondamentaux, hacking éthique, OSINT et gouvernance.",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "fr",
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
