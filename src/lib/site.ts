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
  { key: "youtube", label: "YouTube", href: "#" }, //  e.g. "https://www.youtube.com/@heycybercorp"
  { key: "linkedin", label: "LinkedIn", href: "#" }, // e.g. "https://www.linkedin.com/company/heycybercorp"
  { key: "discord", label: "Discord", href: "#" }, //  e.g. "https://discord.gg/your-invite-code"
];

/** True once a link has a real destination (not the "#" placeholder). */
export function isConfigured(href: string): boolean {
  const h = href.trim();
  return h !== "" && h !== "#";
}
