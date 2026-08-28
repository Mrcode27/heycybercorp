"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";

/**
 * Blocks a case on a phone-sized screen and explains why.
 *
 * A case opens a terminal and several evidence panels side by side; that needs
 * a physical keyboard and width. Every comparable platform reaches the same
 * conclusion — TryHackMe's AttackBox, Hack The Box's Pwnbox, CompTIA's labs are
 * all desktop-only — so this is an honest constraint, not a shortcut.
 *
 * Detection deliberately avoids `User-Agent`, which lies and is trivially
 * spoofed. Two signals instead: viewport width, and a coarse pointer with no
 * hover. A tablet in landscape with a keyboard passes, which is correct.
 *
 * The refusal is a soft gate. "Continuer quand même" stays available, because a
 * hard wall would turn away a curious student on a device that would actually
 * have coped.
 */
export default function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tooSmall, setTooSmall] = useState(false);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < 1024;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setTooSmall(narrow && coarse);
      setReady(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Render nothing on the first paint rather than flashing the wrong branch:
  // the server has no idea how wide the window is.
  if (!ready) return null;
  if (!tooSmall || override) return <>{children}</>;

  return (
    <div className="glass-card rounded-xl p-8 md:p-12 text-center">
      <div className="w-16 h-16 rounded-xl bg-surface-variant flex items-center justify-center mx-auto mb-6">
        <Icon name="desktop_windows" className="text-primary text-3xl" fill />
      </div>

      <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">
        Ce laboratoire demande un ordinateur
      </h2>
      <p className="text-on-surface-variant max-w-md mx-auto mb-6">
        Les cas pratiques ouvrent un terminal et plusieurs fenêtres d&apos;analyse côte à côte :
        il faut un clavier physique et un écran large.
      </p>

      <p className="font-code-sm text-code-sm text-primary mb-8">
        L&apos;Élite du Terminal ne se forme pas au pouce.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link
          href="/dashboard/labs"
          className="px-6 py-3 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          <Icon name="list" className="text-sm" />
          Voir le catalogue
        </Link>
        <Link
          href="/dashboard/formations"
          className="px-6 py-3 rounded-lg font-bold border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all"
        >
          Continuer mes formations
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setOverride(true)}
        className="mt-8 font-code-sm text-code-sm text-on-surface-variant/70 hover:text-on-surface-variant underline transition-colors"
      >
        Continuer quand même
      </button>
    </div>
  );
}
