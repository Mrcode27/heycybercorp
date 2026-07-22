"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

/**
 * Real certification tracks: one per owned course. The certificate is issued
 * automatically when every lesson is completed (see convex/progress.ts).
 */
export default function CertificationsView() {
  const courses = useQuery(api.entitlements.myCoursesWithProgress);

  if (courses === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement…</p>;
  }

  if (courses.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="workspace_premium" className="text-primary text-5xl mb-4" />
        <h4 className="font-headline-lg-mobile text-on-surface mb-2">
          Aucune certification en cours
        </h4>
        <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
          Chaque formation terminée à 100&nbsp;% délivre un certificat vérifiable en ligne.
          Commencez par choisir une formation.
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
    <>
      <div className="glass-card rounded-xl px-5 py-3 border-dashed border-primary/40 mb-8 flex items-center gap-3">
        <Icon name="workspace_premium" className="text-primary" />
        <p className="text-on-surface-variant text-sm">
          Terminez toutes les leçons d&apos;une formation pour recevoir un certificat avec un code
          de vérification public.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {courses.map((c) => {
          const earned = Boolean(c.certificateCode);
          return (
            <div key={c._id} className="glass-card rounded-xl p-6 flex flex-col text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
                  earned
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-surface-variant border-outline-variant text-on-surface-variant"
                }`}
              >
                <Icon name={earned ? "verified" : "school"} className="text-3xl" fill={earned} />
              </div>
              <span className="font-label-mono text-xs uppercase tracking-widest text-on-surface-variant">
                {c.level}
              </span>
              <h4 className="font-headline-lg-mobile text-on-surface mt-1 mb-4">{c.title}</h4>

              <div className="mb-4">
                <div className="flex justify-between font-code-sm text-code-sm mb-1.5">
                  <span className="text-on-surface-variant">Progression</span>
                  <span className="text-primary tabular-nums">{c.pct}%</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                </div>
              </div>

              <p className="text-on-surface-variant text-sm mb-6 flex-grow">
                {earned
                  ? `Certificat émis — code ${c.certificateCode}`
                  : c.totalLessons === 0
                    ? "Le programme de ce cours arrive bientôt."
                    : `${c.totalLessons - c.completedLessons} leçon${
                        c.totalLessons - c.completedLessons > 1 ? "s" : ""
                      } restante${c.totalLessons - c.completedLessons > 1 ? "s" : ""} avant le certificat.`}
              </p>

              {earned ? (
                <Link
                  href={`/certificat/${c.certificateCode}`}
                  className="mt-auto py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Icon name="workspace_premium" className="text-sm" fill />
                  Voir le certificat
                </Link>
              ) : (
                <Link
                  href={`/dashboard/formations/${c.slug}`}
                  className="mt-auto py-2.5 rounded-lg text-sm font-bold border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all inline-flex items-center justify-center gap-2"
                >
                  <Icon name="play_arrow" />
                  Reprendre la formation
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
