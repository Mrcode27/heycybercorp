"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import NotificationBell from "./NotificationBell";

export type SidebarItem = {
  icon: string;
  label: string;
  href?: string;
};

type ConsoleSidebarProps = {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  children: React.ReactNode;
};

/** Sidebar + content shell used by dashboard and admin. */
export default function ConsoleSidebar({
  title,
  subtitle,
  items,
  children,
}: ConsoleSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = !!item.href && pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href ?? "#"}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body-md transition-all ${
              active
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name={item.icon} className="text-xl" fill={active} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — sticky full-height so it never scrolls away */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-outline-variant/30 bg-surface-container-lowest p-6 lg:sticky lg:top-0 lg:h-screen lg:self-start overflow-y-auto">
        <Link href="/" className="flex items-center gap-2.5 mb-1">
          <Image src="/logo.png" alt="" width={299} height={299} className="h-8 w-auto" />
          <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">
            heycybercorp
          </span>
        </Link>
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-8">
          {subtitle}
        </div>
        {nav}
        <Link
          href="/"
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors"
        >
          <Icon name="home" className="text-xl" />
          Retour au site
        </Link>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header + mobile drawer are pinned together, so the open menu never
            scrolls out of reach (the previous bug that made it look broken). */}
        <div className="sticky top-0 z-50">
          <header className="flex items-center justify-between px-margin-mobile md:px-8 py-4 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden text-on-surface-variant hover:text-primary shrink-0"
                aria-label="Menu"
                aria-expanded={open}
              >
                <Icon name={open ? "close" : "menu"} />
              </button>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface truncate">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Always-visible way home on mobile, without opening the menu */}
              <Link
                href="/"
                className="lg:hidden text-on-surface-variant hover:text-primary"
                aria-label="Retour au site"
              >
                <Icon name="home" />
              </Link>
              <NotificationBell />
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Icon name="person" fill />
              </div>
            </div>
          </header>

          {/* Mobile nav drawer */}
          {open && (
            <div className="lg:hidden border-b border-outline-variant/30 bg-surface-container-lowest p-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors"
              >
                <Icon name="home" className="text-xl" />
                Retour au site
              </Link>
              {nav}
            </div>
          )}
        </div>

        <div className="p-margin-mobile md:p-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
