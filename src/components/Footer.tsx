import Link from "next/link";
import Socials from "./Socials";
// Real pages now — see /mentions-legales and /confidentialite.
const LEGAL = [
  { label: "Mentions Légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
];

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 w-full py-12">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-8">
        <Link
          href="/"
          className="text-primary font-headline-lg-mobile text-headline-lg-mobile font-bold"
        >
          heycybercorp
        </Link>
        <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10">
          {/* Same social links as the homepage — edit them in src/lib/site.ts */}
          <Socials variant="footer" />
          <div className="flex flex-wrap justify-center gap-6">
            {LEGAL.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant text-center md:text-right">
          © 2026 heycybercorp. Protégez votre futur.
        </div>
      </div>
    </footer>
  );
}
