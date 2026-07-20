"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "./Icon";
import StudentCourses from "./console/StudentCourses";

export default function DashboardConsole() {
  const me = useQuery(api.users.current);
  const myCourses = useQuery(api.entitlements.myCourses);

  const firstName = me?.name?.split(" ")[0] ?? "Opérateur";
  const owned = myCourses ?? [];

  const STATS = [
    {
      icon: "school",
      label: "Formations possédées",
      value: myCourses === undefined ? "—" : owned.length,
      color: "text-primary",
    },
    { icon: "public", label: "Région", value: me?.region ?? "—", color: "text-secondary" },
    { icon: "verified_user", label: "Type d'accès", value: "À vie", color: "text-primary" },
  ];

  return (
    <>
      {/* Welcome */}
      <div className="glass-card rounded-xl p-8 mb-8 relative overflow-hidden cyber-grid-dots">
        <div className="font-label-mono text-label-mono text-primary uppercase tracking-widest mb-2">
          Bienvenue
        </div>
        <h2 className="font-headline-lg text-headline-lg text-white mb-2">{firstName}</h2>
        <p className="text-on-surface-variant max-w-md">
          {owned.length > 0
            ? "Reprenez là où vous vous êtes arrêté, ou explorez de nouvelles formations."
            : "Vous n'avez pas encore de formation. Découvrez le catalogue pour commencer votre parcours."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-6">
            <Icon name={s.icon} className={`${s.color} text-3xl mb-3`} fill />
            <div className="text-headline-lg-mobile font-bold text-white">{s.value}</div>
            <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* My courses */}
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-headline-lg text-headline-lg-mobile text-white">Mes formations</h3>
        <div className="h-px flex-grow bg-outline-variant/30" />
      </div>
      <StudentCourses />
    </>
  );
}
