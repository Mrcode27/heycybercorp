export type SocialKey = "youtube" | "linkedin" | "discord";
export type SocialLink = { key: SocialKey; label: string; href: string };

/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  👉 PASTE YOUR SOCIAL LINKS HERE                                     │
 * │                                                                      │
 * │  Replace each "#" below with the real page URL.                      │
 * │  Leave a value as "#" and that icon still shows but won't link out   │
 * │  (handy while a channel isn't ready yet).                            │
 * └────────────────────────────────────────────────────────────────────┘
 */
export const SOCIALS: SocialLink[] = [
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@rai1797" },
  { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/heycybercorp/" },
  { key: "discord", label: "Discord", href: "https://discord.gg/Rn2paUNdy" },
];

/** True once a link has a real destination (not the "#" placeholder). */
export function isConfigured(href: string): boolean {
  const h = href.trim();
  return h !== "" && h !== "#";
}

/**
 * Canonical origin — single source of truth for absolute URLs (metadataBase,
 * robots, sitemap, JSON-LD). The apex 308-redirects to www, so www IS canonical;
 * mixing the two splits ranking signals across two hostnames.
 * Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. preview deployments).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.heycybercorp.fr"
).replace(/\/$/, "");

export const SITE_NAME = "heycybercorp";

/**
 * Public contact email — shown on /contact, /entreprise and the legal pages.
 * 👉 Point this at a mailbox on your own domain (e.g. contact@heycybercorp.fr)
 * as soon as one exists: it is also the address for GDPR requests and for
 * reporting illegal content, and a personal Gmail reads badly there.
 */
export const CONTACT_EMAIL = "heycyberpro@gmail.com";

type LegalIdentity = {
  /** Registered name, if it differs from the brand. */
  companyName: string;
  /** SAS, SASU, EURL, SARL, micro-entreprise… */
  legalForm: string;
  /** Share capital, e.g. "1 000 €". Companies only — leave empty otherwise. */
  capital: string;
  /** 9 digits. */
  siren: string;
  /** Registry city of the RCS entry, e.g. "Paris". */
  rcsCity: string;
  /** "FR" followed by 11 characters. */
  vatNumber: string;
  /** Full registered address, one line. */
  address: string;
  /** Legally the company's representative. */
  publicationDirector: string;
  /**
   * Consumer mediator. Subscribing to one is mandatory for B2C sellers in
   * France (art. L612-1 Code de la consommation).
   */
  mediator: { name: string; url: string };
};

/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  👉 FILL THIS IN ONCE                                               │
 * │                                                                     │
 * │  /mentions-legales and /confidentialite both read from here, so    │
 * │  there is exactly one place to edit. A field left empty is simply   │
 * │  not displayed, and appears the moment you fill it — so the notice  │
 * │  never advertises what is missing. Once the company is registered   │
 * │  these fields ARE legally required (LCEN art. 6-III, Code de        │
 * │  commerce art. R.123-237): run `npm run legal:fetch -- <SIREN>`     │
 * │  and they fill themselves from the public registry.                 │
 * └────────────────────────────────────────────────────────────────────┘
 */
export const LEGAL: LegalIdentity = {
  companyName: "heycybercorp",
  legalForm: "",
  capital: "",
  siren: "",
  rcsCity: "",
  vatNumber: "",
  address: "",
  publicationDirector: "",
  mediator: { name: "", url: "" },
};

/**
 * Host of the site, published because the LCEN requires naming it. Kept to one
 * line: it is a legal obligation, not a section anyone came to read.
 */
export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  url: "https://vercel.com",
};
