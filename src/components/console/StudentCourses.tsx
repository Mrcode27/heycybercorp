"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

function levelBadge(level: string) {
  return level === "Avancé"
    ? "bg-error/10 text-error border-error/20"
    : level === "Intermédiaire"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-primary/10 text-primary border-primary/20";
}

/** Owned courses with real progress bars; empty state links to the catalogue. */
export default function StudentCourses() {
  const myCourses = useQuery(api.entitlements.myCoursesWithProgress);

  if (myCourses === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement…</p>;
  }

  if (myCourses.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="menu_book" className="text-primary text-5xl mb-4" />
        <h4 className="font-headline-lg-mobile text-on-surface mb-2">
          Aucune formation pour l&apos;instant
        </h4>
        <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
          Chaque formation est un achat unique, accessible à vie. Choisissez la vôtre et lancez
          votre montée en compétences.
        </p>
        <Link
          href="/formations"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all"
        >
          Parcourir le catalogue
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {myCourses.map((c) => (
        <div key={c._id} className="glass-card rounded-xl p-6 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <span
              className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${levelBadge(
                c.level,
              )}`}
            >
              {c.level}
            </span>
            {c.certificateCode ? (
              <Link
                href={`/certificat/${c.certificateCode}`}
                className="flex items-center gap-1 text-primary font-code-sm text-code-sm hover:underline"
              >
                <Icon name="workspace_premium" className="text-sm" fill />
                Certifié
              </Link>
            ) : (
              <Icon name="verified" className="text-primary" fill />
            )}
          </div>
          <h4 className="font-headline-lg-mobile text-on-surface mb-2">{c.title}</h4>
          <p className="text-on-surface-variant text-sm mb-5 flex-grow line-clamp-2">
            {c.description}
          </p>

          <div className="mb-4">
            <div className="flex justify-between font-code-sm text-code-sm mb-1.5">
              <span className="text-on-surface-variant">
                {c.totalLessons === 0
                  ? "Programme en préparation"
                  : `${c.completedLessons}/${c.totalLessons} leçons`}
              </span>
              <span className="text-primary tabular-nums">{c.pct}%</span>
            </div>
            <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary shadow-glow-primary"
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </div>

          <Link
            href={`/dashboard/formations/${c.slug}`}
            className="mt-auto inline-flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all"
          >
            <Icon name="play_arrow" fill />
            {c.pct === 0 ? "Commencer" : c.pct === 100 ? "Revoir" : "Continuer"}
          </Link>
        </div>
      ))}
    </div>
  );
}
