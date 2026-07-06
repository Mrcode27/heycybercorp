"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

const NAV_LINKS = [
  { href: "/formations", label: "Formations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link
          href="/"
          className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter"
        >
          heycybercorp
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1"
                  : "font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden sm:inline-block bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-bold hover:bg-primary transition-all active:scale-95"
          >
            Connexion
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-xl px-margin-mobile py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={
                isActive(link.href)
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-bold text-center"
          >
            Connexion
          </Link>
        </div>
      )}
    </nav>
  );
}
