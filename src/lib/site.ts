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

/** Public contact email — shown on /contact, /entreprise and the legal pages. */
export const CONTACT_EMAIL = "rainono27@gmail.com";
