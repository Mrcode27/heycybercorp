"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

type Filter = "tous" | "à faire" | "terminés" | "verrouillés";
type Case = FunctionReturnType<typeof api.cases.listForStudent>["cases"][number];

const LEVEL_STYLE: Record<string, string> = {
  Débutant: "border-primary/30 text-primary",
  Intermédiaire: "border-secondary/30 text-secondary",
  Avancé: "border-error/30 text-error",
};

/**
 * The case catalogue. Stays fully usable on a phone by design — the desktop
 * gate applies to *playing* a case, not to browsing what you'd be buying.
 */
export default function CasesCatalogue() {
  const data = useQuery(api.cases.listForStudent);
  const [filter, setFilter] = useState<Filter>("tous");

  if (data === undefined) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-11 w-11 rounded-lg bg-surface-variant mb-4" />
            <div className="h-4 w-2/3 bg-surface-variant rounded mb-3" />
            <div className="h-3 w-full bg-surface-variant rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { cases, stats } = data;
  if (cases.length === 0) return null;

  const shown = cases.filter((c) => {
    if (filter === "terminés") return c.completed;
    if (filter === "à faire") return c.unlocked && !c.completed;
    if (filter === "verrouillés") return !c.unlocked;
    return true;
  });

  const pct = stats.maxPoints === 0 ? 0 : Math.round((stats.points / stats.maxPoints) * 100);

  return (
    <section className="mb-14">
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <div className="font-headline-lg text-headline-lg text-primary tabular-nums">
                {stats.points}
              </div>
              <div className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                Points
              </div>
            </div>
            <div className="w-px h-12 bg-outline-variant/40" />
            <div>
              <div className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
                {stats.completed}/{stats.total}
              </div>
              <div className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                Dossiers clos
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-50">
            <div className="flex justify-between font-code-sm text-code-sm text-on-surface-variant mb-1.5">
              <span>Progression sur vos cas débloqués</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(["tous", "à faire", "terminés", "verrouillés"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg font-label-mono text-label-mono uppercase tracking-wider transition-all ${
              filter === f
                ? "active-filter"
                : "border border-outline-variant/40 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shown.map((c) => (
          <CaseCard key={c._id} c={c} />
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-on-surface-variant font-code-sm text-code-sm">
          Aucun cas dans cette catégorie.
        </p>
      )}
    </section>
  );
}

function CaseCard({ c }: { c: Case }) {
  const pct = c.totalSteps === 0 ? 0 : Math.round((c.solvedSteps / c.totalSteps) * 100);
  const started = c.solvedSteps > 0;

  return (
    <div
      className={`glass-card rounded-xl p-6 flex flex-col ${c.unlocked ? "" : "opacity-75"} ${
        c.completed ? "border-primary/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
          <Icon
            name={c.icon}
            className={c.completed ? "text-primary" : "text-on-surface-variant"}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {c.points} pts
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${
              LEVEL_STYLE[c.level] ?? ""
            }`}
          >
            {c.level}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-headline-lg-mobile text-on-surface">{c.title}</h4>
        {c.completed && <Icon name="verified" className="text-primary text-lg" fill />}
      </div>
      <div className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant mb-3">
        {c.category} · ~{c.estimatedMinutes} min
        {c.isFree && " · accès libre"}
      </div>
      <p className="text-on-surface-variant text-sm mb-5 grow">{c.summary}</p>

      {started && !c.completed && (
        <div className="mb-4">
          <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-code-sm text-code-sm text-on-surface-variant mt-1.5">
            {c.solvedSteps}/{c.totalSteps} étapes
          </p>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
        <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
          <Icon
            name={c.completed ? "check_circle" : c.unlocked ? "folder_open" : "lock"}
            className="text-sm"
            fill={c.completed}
          />
          {c.completed
            ? "Dossier clos"
            : c.unlocked
              ? `${c.totalSteps} étapes`
              : `Pack ${c.level} requis`}
        </span>
        {c.unlocked ? (
          <Link
            href={`/dashboard/labs/${c.slug}`}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center gap-1.5"
          >
            {c.completed ? "Revoir" : started ? "Reprendre" : "Ouvrir le dossier"}
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        ) : (
          <Link
            href="/tarifs"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all"
          >
            Débloquer
          </Link>
        )}
      </div>
    </div>
  );
}
