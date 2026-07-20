import Icon from "../Icon";

// Sample data — this page is a visual template until analytics are wired.
const REVENUE = [
  { m: "Fév", v: 42 },
  { m: "Mar", v: 58 },
  { m: "Avr", v: 51 },
  { m: "Mai", v: 73 },
  { m: "Juin", v: 88 },
  { m: "Juil", v: 96 },
];
const MAX = Math.max(...REVENUE.map((d) => d.v));

const KPIS = [
  { icon: "trending_up", label: "Revenu (30j)", value: "1.9M FCFA", delta: "+14%", color: "text-primary" },
  { icon: "task_alt", label: "Taux de complétion", value: "68%", delta: "+5%", color: "text-secondary" },
  { icon: "person_add", label: "Nouveaux étudiants", value: "127", delta: "+22%", color: "text-primary" },
  { icon: "star", label: "Note moyenne", value: "4.7/5", delta: "+0.2", color: "text-secondary" },
];

const TOP = [
  { title: "Ligne de Commande Linux", sales: 934, share: 100 },
  { title: "Penetration Testing : Web", sales: 412, share: 44 },
  { title: "SOC & Incident Response", sales: 268, share: 29 },
  { title: "Reverse Engineering", sales: 88, share: 9 },
];

export default function AdminReports() {
  return (
    <>
      <div className="note-preview mb-8 flex items-center gap-3 glass-card rounded-xl px-5 py-3 border-dashed border-primary/40">
        <Icon name="insights" className="text-primary" />
        <p className="text-on-surface-variant text-sm">
          Aperçu du tableau de bord analytique — données d&apos;exemple. Se remplira automatiquement
          une fois les ventes actives.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon name={k.icon} className={`${k.color} text-3xl`} fill />
              <span className="font-code-sm text-code-sm text-primary">{k.delta}</span>
            </div>
            <div className="text-headline-lg-mobile font-bold text-white tabular-nums">{k.value}</div>
            <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-headline-lg-mobile text-on-surface mb-1">Revenus mensuels</h3>
          <p className="text-on-surface-variant text-sm mb-6">6 derniers mois (en M FCFA)</p>
          <div className="flex items-end justify-between gap-3 h-48">
            {REVENUE.map((d) => (
              <div key={d.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-primary font-code-sm text-code-sm tabular-nums">{d.v}</div>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-primary/30 to-primary shadow-[0_0_12px_rgba(0,145,80,0.3)]"
                  style={{ height: `${(d.v / MAX) * 100}%` }}
                />
                <div className="font-label-mono text-xs text-on-surface-variant">{d.m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top courses */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-headline-lg-mobile text-on-surface mb-1">Formations les plus vendues</h3>
          <p className="text-on-surface-variant text-sm mb-6">Par nombre d&apos;accès</p>
          <div className="flex flex-col gap-5">
            {TOP.map((t) => (
              <div key={t.title}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-on-surface text-sm">{t.title}</span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">{t.sales}</span>
                </div>
                <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${t.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
