import type { Metadata } from "next";
import ConsoleSidebar, { type SidebarItem } from "@/components/ConsoleSidebar";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Tableau de bord | heycybercorp",
};

const NAV: SidebarItem[] = [
  { icon: "dashboard", label: "Tableau de bord", href: "/dashboard", active: true },
  { icon: "school", label: "Mes Formations", href: "#" },
  { icon: "science", label: "Labs Pratiques", href: "#" },
  { icon: "workspace_premium", label: "Certifications", href: "#" },
  { icon: "credit_card", label: "Abonnement", href: "#" },
  { icon: "settings", label: "Paramètres", href: "#" },
];

const COURSES = [
  {
    title: "Penetration Testing : Web",
    level: "Intermédiaire",
    progress: 66,
    modules: "16 / 24 modules",
    accent: "primary",
  },
  {
    title: "Ligne de Commande Linux",
    level: "Débutant",
    progress: 100,
    modules: "08 / 08 modules",
    accent: "primary",
  },
  {
    title: "SOC & Incident Response",
    level: "Intermédiaire",
    progress: 25,
    modules: "04 / 18 modules",
    accent: "secondary",
  },
  {
    title: "Cryptographie Appliquée",
    level: "Intermédiaire",
    progress: 10,
    modules: "01 / 15 modules",
    accent: "secondary",
  },
];

const STATS = [
  { icon: "military_tech", label: "Rang", value: "Opérateur", color: "text-primary" },
  { icon: "local_fire_department", label: "Série", value: "12 jours", color: "text-secondary" },
  { icon: "check_circle", label: "Modules complétés", value: "29", color: "text-primary" },
  { icon: "science", label: "Labs résolus", value: "17", color: "text-secondary" },
];

export default function DashboardPage() {
  return (
    <ConsoleSidebar title="Tableau de bord" subtitle="Espace Étudiant" items={NAV}>
      {/* Welcome + plan status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card rounded-xl p-8 relative overflow-hidden cyber-grid-dots">
          <div className="font-label-mono text-label-mono text-primary uppercase tracking-widest mb-2">
            Bienvenue, Opérateur
          </div>
          <h2 className="font-headline-lg text-headline-lg text-white mb-3">Jean Dupont</h2>
          <p className="text-on-surface-variant max-w-md mb-6">
            Vous progressez bien. Poursuivez votre montée en compétences pour débloquer le module
            Red Teaming.
          </p>
          <button className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all flex items-center gap-2">
            Reprendre la formation
            <Icon name="play_arrow" fill />
          </button>
        </div>

        <div className="glass-card rounded-xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
              Abonnement
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded border border-primary/30">
              ACTIF
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg-mobile text-white mb-1">
            Intermédiaire
          </div>
          <div className="text-on-surface-variant text-sm mb-6">30 000 FCFA / mois</div>
          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <Icon name="event" className="text-secondary text-sm" />
              Renouvellement : 04 août 2026
            </div>
            <button className="w-full py-2.5 mt-2 border border-outline text-on-surface rounded-lg hover:bg-surface-variant transition-all text-sm font-bold">
              Gérer l&apos;abonnement
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Course progress */}
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-headline-lg text-headline-lg-mobile text-white">
          Progression des formations
        </h3>
        <div className="h-px flex-grow bg-outline-variant/30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COURSES.map((c) => {
          const done = c.progress === 100;
          return (
            <div key={c.title} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${
                      c.accent === "primary"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-secondary/10 text-secondary border-secondary/20"
                    }`}
                  >
                    {c.level}
                  </span>
                  <h4 className="font-headline-lg-mobile text-on-surface mt-3">{c.title}</h4>
                </div>
                <Icon
                  name={done ? "check_circle" : "play_circle"}
                  className={done ? "text-primary" : "text-secondary"}
                  fill
                />
              </div>
              <div className="flex justify-between font-code-sm text-code-sm mb-2">
                <span className="text-on-surface-variant">{c.modules}</span>
                <span className={c.accent === "primary" ? "text-primary" : "text-secondary"}>
                  {c.progress}%
                </span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${c.accent === "primary" ? "bg-primary" : "bg-secondary"}`}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ConsoleSidebar>
  );
}
