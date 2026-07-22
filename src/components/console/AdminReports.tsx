"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

function delta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "nouveau" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function fmtEur(v: number) {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}
function fmtXof(v: number) {
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

/** Live analytics computed by convex/admin.ts → analytics. No sample data. */
export default function AdminReports() {
  const data = useQuery(api.admin.analytics, {});
  const [currency, setCurrency] = useState<"eur" | "xof">("eur");

  if (data === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement des analyses…</p>;
  }

  const hasRevenue = data.months.some((m) => m.eur > 0 || m.xof > 0);
  const chartValues = data.months.map((m) => (currency === "eur" ? m.eur : m.xof));
  const chartMax = Math.max(...chartValues, 1);
  const topMax = Math.max(...data.topCourses.map((t) => t.count), 1);

  const KPIS = [
    {
      icon: "trending_up",
      label: "Revenu (30 j)",
      value:
        data.revenue30d.eur > 0 || data.revenue30d.xof === 0
          ? fmtEur(data.revenue30d.eur)
          : fmtXof(data.revenue30d.xof),
      sub:
        data.revenue30d.xof > 0 && data.revenue30d.eur > 0
          ? `+ ${fmtXof(data.revenue30d.xof)}`
          : undefined,
      delta: delta(
        data.revenue30d.eur + data.revenue30d.xof,
        data.revenuePrev30d.eur + data.revenuePrev30d.xof,
      ),
      color: "text-primary",
    },
    {
      icon: "task_alt",
      label: "Taux de complétion",
      value: data.completionPct === null ? "—" : `${data.completionPct}%`,
      delta: "moyenne",
      color: "text-secondary",
    },
    {
      icon: "person_add",
      label: "Nouveaux étudiants (30 j)",
      value: String(data.newStudents30d),
      delta: delta(data.newStudents30d, data.newStudentsPrev30d),
      color: "text-primary",
    },
    {
      icon: "payments",
      label: "Commandes payées (30 j)",
      value: String(data.paidOrders30d),
      delta: "30 jours",
      color: "text-secondary",
    },
  ];

  return (
    <>
      {!hasRevenue && (
        <div className="mb-8 flex items-center gap-3 glass-card rounded-xl px-5 py-3 border-dashed border-primary/40">
          <Icon name="insights" className="text-primary" />
          <p className="text-on-surface-variant text-sm">
            Analyses en direct — les graphiques se remplissent automatiquement avec les premières
            ventes et inscriptions.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon name={k.icon} className={`${k.color} text-3xl`} fill />
              <span className="font-code-sm text-code-sm text-primary">{k.delta}</span>
            </div>
            <div className="text-headline-lg-mobile font-bold text-white tabular-nums">
              {k.value}
            </div>
            {k.sub && (
              <div className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
                {k.sub}
              </div>
            )}
            <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="font-headline-lg-mobile text-on-surface">Revenus mensuels</h3>
            <div className="flex gap-1">
              {(["eur", "xof"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 py-1 rounded font-label-mono text-xs uppercase border transition-all ${
                    currency === c
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {c === "eur" ? "€" : "FCFA"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-on-surface-variant text-sm mb-6">
            6 derniers mois ({currency === "eur" ? "euros" : "FCFA"}, commandes payées)
          </p>
          <div className="flex items-end justify-between gap-3 h-48">
            {data.months.map((m, i) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-primary font-code-sm text-code-sm tabular-nums">
                  {chartValues[i] > 0
                    ? chartValues[i].toLocaleString("fr-FR", { maximumFractionDigits: 0 })
                    : ""}
                </div>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-primary/30 to-primary shadow-[0_0_12px_rgba(0,145,80,0.3)] min-h-[2px]"
                  style={{ height: `${(chartValues[i] / chartMax) * 100}%` }}
                />
                <div className="font-label-mono text-xs text-on-surface-variant">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top courses */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-headline-lg-mobile text-on-surface mb-1">
            Formations les plus vendues
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">Par nombre d&apos;accès accordés</p>
          {data.topCourses.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              Aucun accès accordé pour l&apos;instant.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {data.topCourses.map((t) => (
                <div key={t.title}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-on-surface text-sm">{t.title}</span>
                    <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
                      {t.count}
                    </span>
                  </div>
                  <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${(t.count / topMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signups chart */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2">
          <h3 className="font-headline-lg-mobile text-on-surface mb-1">Nouvelles inscriptions</h3>
          <p className="text-on-surface-variant text-sm mb-6">Comptes créés par mois</p>
          <div className="flex items-end justify-between gap-3 h-32">
            {data.months.map((m) => {
              const signupMax = Math.max(...data.months.map((x) => x.signups), 1);
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-secondary font-code-sm text-code-sm tabular-nums">
                    {m.signups > 0 ? m.signups : ""}
                  </div>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-secondary/30 to-secondary min-h-[2px]"
                    style={{ height: `${(m.signups / signupMax) * 100}%` }}
                  />
                  <div className="font-label-mono text-xs text-on-surface-variant">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
