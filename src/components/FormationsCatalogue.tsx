"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import Icon from "@/components/Icon";
import { formatCoursePrice, formatDuration, type Region } from "@/lib/format";

type LiveCourse = FunctionReturnType<typeof api.courses.listPublished>[number];

const FILTERS = ["Tous", "Débutant", "Intermédiaire", "Avancé"] as const;

const TIERS = [
  { level: "Débutant", icon: "shield", color: "text-primary", label: "01. Fondamentaux" },
  { level: "Intermédiaire", icon: "terminal", color: "text-secondary", label: "02. Spécialiste" },
  { level: "Avancé", icon: "warning", color: "text-error", label: "03. Expert" },
] as const;

function accent(level: string) {
  return level === "Avancé" ? "error" : level === "Intermédiaire" ? "secondary" : "primary";
}
function accentText(level: string) {
  const a = accent(level);
  return a === "primary" ? "text-primary" : a === "secondary" ? "text-secondary" : "text-error";
}
function accentBadge(level: string) {
  const a = accent(level);
  return a === "primary"
    ? "bg-primary/10 text-primary border-primary/20"
    : a === "secondary"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-error/10 text-error border-error/20";
}

function CourseCard({
  course,
  region,
  owned,
}: {
  course: LiveCourse;
  region: Region;
  owned: boolean;
}) {
  const duration = formatDuration(course.durationSec);
  const meta =
    course.lessonCount > 0
      ? `${course.lessonCount} leçon${course.lessonCount > 1 ? "s" : ""}${duration ? ` · ${duration}` : ""}`
      : "Programme en préparation";

  return (
    <Link
      href={`/formations/${course.slug}`}
      className={`glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer ${
        course.level === "Avancé" ? "bg-error-container/5 border-error/20" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${accentBadge(
            course.level,
          )}`}
        >
          {course.level}
        </span>
        <span className="text-on-surface-variant font-code-sm text-code-sm">{meta}</span>
      </div>
      <h3
        className={`font-headline-lg text-headline-lg-mobile mb-3 ${
          course.level === "Avancé" ? "text-error" : "text-on-surface"
        }`}
      >
        {course.title}
      </h3>
      <p className="text-on-surface-variant font-body-md text-body-md mb-6 flex-grow">
        {course.description}
      </p>

      <div className="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
        {owned ? (
          <span className="font-code-sm text-code-sm text-primary flex items-center gap-1.5">
            <Icon name="verified" className="text-sm" fill />
            POSSÉDÉ · ACCÈS À VIE
          </span>
        ) : course.priceEur != null && course.priceXof != null ? (
          <span className={`font-headline-lg-mobile font-bold ${accentText(course.level)}`}>
            {formatCoursePrice(course.priceEur, course.priceXof, region)}
          </span>
        ) : (
          <span className="font-code-sm text-code-sm text-on-surface-variant">Bientôt</span>
        )}
        <Icon
          name={owned ? "play_circle" : "arrow_forward"}
          className={`${accentText(course.level)} group-hover:translate-x-2 transition-transform`}
        />
      </div>
    </Link>
  );
}

/** Live catalogue — courses come from Convex (admin-managed), no hardcoded data. */
export default function FormationsCatalogue() {
  const courses = useQuery(api.courses.listPublished);
  const me = useQuery(api.users.current);
  const ownedIds = useQuery(api.entitlements.myCourseIds);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const [regionOverride, setRegionOverride] = useState<Region | null>(null);

  const region: Region = regionOverride ?? me?.region ?? "EUROPE";
  const owned = new Set(ownedIds ?? []);
  const visible = (courses ?? []).filter((c) => filter === "Tous" || c.level === filter);

  return (
    <>
      {/* Header + Filters */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-4">
              Académie de Cyberdéfense
            </h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
              Maîtrisez l&apos;art de la guerre numérique à travers nos parcours certifiants. Du
              novice à l&apos;expert en intrusion. Achat unique, accès à vie.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="glass-panel p-2 flex flex-wrap gap-2 rounded-xl">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded font-label-mono text-label-mono transition-all ${
                    filter === f
                      ? "active-filter"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {(["EUROPE", "AFRIQUE"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegionOverride(r)}
                  className={`px-3 py-1 rounded font-label-mono text-xs uppercase tracking-widest border transition-all ${
                    region === r
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {r === "EUROPE" ? "Europe (€)" : "Afrique (FCFA)"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loading skeleton */}
      {courses === undefined && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-xl h-64 animate-pulse">
              <div className="h-4 w-24 bg-surface-variant rounded mb-4" />
              <div className="h-6 w-3/4 bg-surface-variant rounded mb-3" />
              <div className="h-4 w-full bg-surface-variant rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty catalogue */}
      {courses?.length === 0 && (
        <div className="glass-panel rounded-xl p-16 text-center">
          <Icon name="satellite_alt" className="text-primary text-5xl mb-4" />
          <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
            Catalogue en cours de déploiement
          </h3>
          <p className="text-on-surface-variant">
            Les premières formations arrivent très bientôt. Revenez nous voir !
          </p>
        </div>
      )}

      {/* Tiers */}
      {TIERS.map((tier) => {
        const tierCourses = visible.filter((c) => c.level === tier.level);
        if (tierCourses.length === 0) return null;
        return (
          <section key={tier.level} className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <Icon name={tier.icon} className={tier.color} fill />
              <h2 className="font-headline-lg text-headline-lg">{tier.label}</h2>
              <div className="h-px flex-grow bg-outline-variant/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {tierCourses.map((c) => (
                <CourseCard key={c._id} course={c} region={region} owned={owned.has(c._id)} />
              ))}
              {tier.level === "Avancé" && (
                <div className="border-2 border-dashed border-outline-variant/20 rounded-xl flex items-center justify-center p-12 text-center group">
                  <div className="flex flex-col items-center gap-4 opacity-30 group-hover:opacity-60 transition-opacity">
                    <Icon name="add_circle" className="text-4xl" />
                    <p className="font-label-mono text-label-mono">
                      NOUVEAU CONTENU EXPERT
                      <br />
                      EN DÉPLOIEMENT...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
