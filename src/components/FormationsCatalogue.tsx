"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

type Course = {
  title: string;
  desc: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  modules: string;
  status: string;
  locked: boolean;
  tier: 1 | 2 | 3;
  accent: "primary" | "secondary" | "error";
  progress?: number;
  quote?: string;
};

const COURSES: Course[] = [
  {
    title: "Introduction aux Réseaux Sécurisés",
    desc: "Comprendre les protocoles TCP/IP et la topologie des réseaux critiques pour identifier les vulnérabilités de base.",
    level: "Débutant",
    modules: "12 Modules",
    status: "READY_TO_LAUNCH",
    locked: false,
    tier: 1,
    accent: "primary",
  },
  {
    title: "Ligne de Commande Linux",
    desc: "Maîtrisez le terminal, le scripting Bash et la gestion des permissions dans un environnement Unix sécurisé.",
    level: "Débutant",
    modules: "08 Modules",
    status: "READY_TO_LAUNCH",
    locked: false,
    tier: 1,
    accent: "primary",
  },
  {
    title: "Cryptographie Appliquée",
    desc: "Les mathématiques derrière le chiffrement AES, RSA et les protocoles d'échange de clés modernes.",
    level: "Intermédiaire",
    modules: "15 Modules",
    status: "LOCKED_BY_PREREQ",
    locked: true,
    tier: 1,
    accent: "secondary",
  },
  {
    title: "Penetration Testing : Web",
    desc: "Exploitation de vulnérabilités OWASP Top 10, SQL injection et XSS dans des environnements de laboratoire contrôlés.",
    level: "Intermédiaire",
    modules: "24 Modules",
    status: "EN_COURS [33%]",
    locked: false,
    tier: 2,
    accent: "secondary",
    progress: 33,
  },
  {
    title: "SOC & Incident Response",
    desc: "Analyse de logs SIEM, détection d'anomalies et mise en place de stratégies de remédiation post-attaque.",
    level: "Intermédiaire",
    modules: "18 Modules",
    status: "LOCKED_BY_SUBSCRIPTION",
    locked: true,
    tier: 2,
    accent: "secondary",
  },
  {
    title: "Reverse Engineering",
    desc: "Désassemblage de malwares, analyse de binaires et exploitation de corruption mémoire sous x64.",
    level: "Avancé",
    modules: "30 Modules",
    status: "ACCESS_RESTRICTED",
    locked: true,
    tier: 3,
    accent: "error",
    quote: "Un niveau de maîtrise requis pour les unités d'élite de défense.",
  },
];

const FILTERS = ["Tous", "Débutant", "Intermédiaire", "Avancé"] as const;

const TIERS = [
  { id: 1, icon: "shield", color: "text-primary", label: "01. Fondamentaux" },
  { id: 2, icon: "terminal", color: "text-secondary", label: "02. Spécialiste" },
  { id: 3, icon: "warning", color: "text-error", label: "03. Expert" },
] as const;

function accentText(a: Course["accent"]) {
  return a === "primary" ? "text-primary" : a === "secondary" ? "text-secondary" : "text-error";
}
function accentBadge(a: Course["accent"]) {
  return a === "primary"
    ? "bg-primary/10 text-primary border-primary/20"
    : a === "secondary"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-error/10 text-error border-error/20";
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div
      className={`glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer ${
        course.tier === 3 ? "bg-error-container/5 border-error/20" : ""
      } ${course.locked ? "opacity-80" : ""}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${accentBadge(
            course.accent
          )}`}
        >
          {course.level}
        </span>
        <span className="text-on-surface-variant font-code-sm text-code-sm">{course.modules}</span>
      </div>
      <h3
        className={`font-headline-lg text-headline-lg-mobile mb-3 ${
          course.tier === 3 ? "text-error" : "text-on-surface"
        }`}
      >
        {course.title}
      </h3>
      <p className="text-on-surface-variant font-body-md text-body-md mb-6 flex-grow">
        {course.desc}
      </p>

      {course.quote && (
        <div className="mb-4 p-4 bg-surface-container rounded font-code-sm text-code-sm text-on-surface-variant border-l-2 border-error italic">
          &quot;{course.quote}&quot;
        </div>
      )}

      {typeof course.progress === "number" && (
        <div className="w-full bg-surface-variant h-1 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-primary h-full shadow-[0_0_10px_rgba(106,221,147,0.5)]"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
        <span
          className={`font-code-sm text-code-sm ${
            course.locked ? "text-on-surface-variant opacity-60" : accentText(course.accent)
          }`}
        >
          {course.status}
        </span>
        <Icon
          name={course.locked ? "lock" : course.progress ? "play_circle" : "arrow_forward"}
          className={`${
            course.locked ? "text-on-surface-variant" : accentText(course.accent)
          } group-hover:translate-x-2 transition-transform`}
        />
      </div>
    </div>
  );
}

export default function FormationsCatalogue() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");

  const visible = COURSES.filter((c) => filter === "Tous" || c.level === filter);

  return (
    <>
      {/* Header + Filter */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-primary mb-4">
              Académie de Cyberdéfense
            </h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
              Maîtrisez l&apos;art de la guerre numérique à travers nos parcours certifiants. Du
              novice à l&apos;expert en intrusion.
            </p>
          </div>
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
        </div>
      </section>

      {/* Tiers */}
      {TIERS.map((tier) => {
        const tierCourses = visible.filter((c) => c.tier === tier.id);
        if (tierCourses.length === 0) return null;
        return (
          <section key={tier.id} className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <Icon name={tier.icon} className={tier.color} fill />
              <h2 className="font-headline-lg text-headline-lg">{tier.label}</h2>
              <div className="h-px flex-grow bg-outline-variant/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {tierCourses.map((c) => (
                <CourseCard key={c.title} course={c} />
              ))}
              {tier.id === 3 && (
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
