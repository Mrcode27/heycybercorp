"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

type Theme = "dark" | "light";

const THEMES: {
  key: Theme;
  name: string;
  tag: string;
  desc: string;
  /** Swatches shown in the preview strip: page, surface, accent, ink. */
  swatch: [string, string, string, string];
}[] = [
  {
    key: "dark",
    name: "Terminal",
    tag: "Design d'origine",
    desc: "Fond noir, vert néon et grille cyber. L'identité d'origine du site.",
    swatch: ["#0d1512", "#19211e", "#6add93", "#dce5df"],
  },
  {
    key: "light",
    name: "Signal",
    tag: "Nouveau design",
    desc: "Fond clair, vert et jaune repris du logo. Plus lisible en plein jour, et sur mobile.",
    swatch: ["#fbfbf6", "#ffffff", "#00620b", "#ffff00"],
  },
];

/**
 * Switches the public site between the two palettes.
 *
 * The choice is site-wide, not per-visitor: it is stored in Convex, so saving
 * here repaints the site for everyone currently browsing it, live. There is no
 * deploy involved, and nothing to undo but clicking the other card.
 */
export default function AdminAppearance() {
  const settings = useQuery(api.settings.get);
  const setTheme = useMutation(api.settings.setTheme);
  const [busy, setBusy] = useState<Theme | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = settings?.theme;

  async function choose(theme: Theme) {
    if (theme === active) return;
    setBusy(theme);
    setError(null);
    try {
      await setTheme({ theme });
    } catch (err) {
      setError(cleanConvexError(err, "Le changement de thème a échoué."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-outline-variant/30">
        <Icon name="palette" className="text-secondary" fill />
        <div>
          <h3 className="font-headline-lg-mobile text-on-surface">Apparence du site</h3>
          <p className="font-code-sm text-code-sm text-on-surface-variant">
            S&apos;applique immédiatement à tous les visiteurs.
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {THEMES.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => choose(t.key)}
              disabled={busy !== null || settings === undefined}
              aria-pressed={isActive}
              className={`text-left rounded-xl border p-5 transition-all disabled:opacity-60 ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/40 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                  {t.tag}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-primary font-code-sm text-code-sm">
                    <Icon name="check_circle" className="text-sm" fill /> Actif
                  </span>
                )}
              </div>

              <div className="font-headline-lg-mobile text-on-surface mb-2">{t.name}</div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">{t.desc}</p>

              {/* Swatches are literal hex, not tokens: they must show the OTHER
                  theme's colours while the admin panel itself stays current. */}
              <div className="flex gap-2" aria-hidden>
                {t.swatch.map((c) => (
                  <span
                    key={c}
                    className="w-9 h-9 rounded-md border border-outline-variant/40"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {busy === t.key && (
                <p className="mt-3 font-code-sm text-code-sm text-on-surface-variant">
                  Application…
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="px-6 pb-6 font-code-sm text-code-sm text-error flex items-center gap-1.5">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
}
