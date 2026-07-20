"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-outline-variant/30 bg-surface-container-lowest p-6">
        <Link href="/" className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter mb-1">
          heycybercorp
        </Link>
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-8">
          {subtitle}
        </div>
        {nav}
        <Link
          href="/"
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="logout" className="text-xl" />
          Déconnexion
        </Link>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-margin-mobile md:px-8 py-4 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden text-on-surface-variant hover:text-primary"
              aria-label="Menu"
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="text-on-surface-variant hover:text-primary relative">
              <Icon name="notifications" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Icon name="person" fill />
            </div>
          </div>
        </header>

        {/* Mobile nav drawer */}
        {open && (
          <div className="lg:hidden border-b border-outline-variant/30 bg-surface-container-lowest p-4">
            {nav}
          </div>
        )}

        <div className="p-margin-mobile md:p-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
