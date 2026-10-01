"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const fieldClass =
  "w-full bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded text-sm";

const PREFS = [
  {
    key: "emailNotifications" as const,
    label: "Notifications par email",
    desc: "Nouveautés et rappels de formation",
    fallback: true,
  },
  {
    key: "weeklySummary" as const,
    label: "Résumé hebdomadaire",
    desc: "Votre progression chaque semaine",
    fallback: false,
  },
];

export default function StudentSettings() {
  const me = useQuery(api.users.current);
  const updatePrefs = useMutation(api.users.updatePrefs);
  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({});

  if (me === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement…</p>;
  }
  if (me === null) return null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Profile */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-headline-lg-mobile text-on-surface mb-1">Profil</h3>
        <p className="text-on-surface-variant text-sm mb-6">
          Ces informations proviennent de votre compte. Gérez-les via le menu utilisateur en haut à
          droite.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Nom</label>
            <input readOnly value={me.name ?? "—"} className={`${fieldClass} opacity-70`} />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Email</label>
            <input readOnly value={me.email} className={`${fieldClass} opacity-70`} />
          </div>
        </div>
      </div>

      {/* Preferences — persisted on the user row (users.updatePrefs) */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-headline-lg-mobile text-on-surface mb-5">Préférences</h3>
        <div className="flex flex-col gap-4">
          {PREFS.map((p) => {
            const prefValues = {
              emailNotifications:
                localPrefs.emailNotifications ?? me.prefs?.emailNotifications ?? true,
              weeklySummary: localPrefs.weeklySummary ?? me.prefs?.weeklySummary ?? false,
            };
            const on = prefValues[p.key];
            return (
              <div key={p.key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-on-surface text-sm font-medium">{p.label}</div>
                  <div className="text-on-surface-variant text-xs">{p.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={p.label}
                  onClick={() => {
                    const next = { ...prefValues, [p.key]: !on };
                    setLocalPrefs(next);
                    updatePrefs({ prefs: next }).catch(() => setLocalPrefs(prefValues));
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 flex transition-all ${
                    on ? "bg-primary justify-end" : "bg-surface-variant justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-background" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
