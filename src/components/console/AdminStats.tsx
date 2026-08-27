"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

export default function AdminStats() {
  const stats = useQuery(api.admin.stats, {});

  const KPIS = [
    { icon: "group", label: "Utilisateurs", value: stats?.users, color: "text-primary" },
    {
      icon: "school",
      label: "Cours publiés",
      value: stats ? `${stats.published}/${stats.courses}` : undefined,
      color: "text-secondary",
    },
    { icon: "shopping_cart", label: "Accès accordés", value: stats?.accessGranted, color: "text-primary" },
    { icon: "payments", label: "Commandes payées", value: stats?.paidOrders, color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {KPIS.map((k) => (
        <div key={k.label} className="glass-card rounded-xl p-6">
          <Icon name={k.icon} className={`${k.color} text-3xl mb-3`} fill />
          <div className="text-headline-lg-mobile font-bold text-on-surface tabular-nums">
            {k.value ?? "—"}
          </div>
          <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">
            {k.label}
          </div>
        </div>
      ))}
    </div>
  );
}
