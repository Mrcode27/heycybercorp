import type { Metadata } from "next";
import ConsoleSidebar, { type SidebarItem } from "@/components/ConsoleSidebar";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Admin | heycybercorp",
};

const NAV: SidebarItem[] = [
  { icon: "monitoring", label: "Vue d'ensemble", href: "/admin", active: true },
  { icon: "group", label: "Utilisateurs", href: "#" },
  { icon: "school", label: "Formations", href: "#" },
  { icon: "card_membership", label: "Abonnements", href: "#" },
  { icon: "assessment", label: "Rapports", href: "#" },
];

const KPIS = [
  { icon: "group", label: "Utilisateurs actifs", value: "2 481", delta: "+12%", color: "text-primary" },
  { icon: "payments", label: "Revenu mensuel", value: "8.4M FCFA", delta: "+8%", color: "text-secondary" },
  { icon: "school", label: "Formations actives", value: "37", delta: "+3", color: "text-primary" },
  { icon: "trending_up", label: "Taux de complétion", value: "74%", delta: "+5%", color: "text-secondary" },
];

const USERS = [
  { name: "Awa Diop", email: "awa.diop@mail.sn", plan: "Hacking Pro", region: "Afrique", status: "Actif" },
  { name: "Lucas Martin", email: "l.martin@mail.fr", plan: "Intermédiaire", region: "Europe", status: "Actif" },
  { name: "Kofi Mensah", email: "kofi@mail.gh", plan: "Débutant", region: "Afrique", status: "Suspendu" },
  { name: "Sofia Rossi", email: "s.rossi@mail.it", plan: "Intermédiaire", region: "Europe", status: "Actif" },
  { name: "Ibrahim Touré", email: "i.toure@mail.ci", plan: "Hacking Pro", region: "Afrique", status: "En attente" },
];

const COURSES = [
  { title: "Penetration Testing : Web", level: "Intermédiaire", students: 412, state: "Publié" },
  { title: "Reverse Engineering", level: "Avancé", students: 88, state: "Publié" },
  { title: "Cryptographie Appliquée", level: "Intermédiaire", students: 0, state: "Brouillon" },
  { title: "Ligne de Commande Linux", level: "Débutant", students: 934, state: "Publié" },
];

function statusClasses(status: string) {
  switch (status) {
    case "Actif":
    case "Publié":
      return "bg-primary/10 text-primary border-primary/30";
    case "Suspendu":
      return "bg-error/10 text-error border-error/30";
    case "Brouillon":
      return "bg-surface-variant text-on-surface-variant border-outline-variant/40";
    default:
      return "bg-secondary/10 text-secondary border-secondary/30";
  }
}

export default function AdminPage() {
  return (
    <ConsoleSidebar title="Panneau d'Administration" subtitle="Console SOC" items={NAV}>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon name={k.icon} className={`${k.color} text-3xl`} fill />
              <span className="font-code-sm text-code-sm text-primary">{k.delta}</span>
            </div>
            <div className="text-headline-lg-mobile font-bold text-white">{k.value}</div>
            <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="glass-card rounded-xl overflow-hidden mb-8">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <Icon name="group" className="text-primary" fill />
            <h3 className="font-headline-lg-mobile text-on-surface">Gestion des Utilisateurs</h3>
          </div>
          <button className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all flex items-center gap-2">
            <Icon name="person_add" className="text-sm" />
            Ajouter
          </button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
                <th className="p-4">Utilisateur</th>
                <th className="p-4 hidden md:table-cell">Plan</th>
                <th className="p-4 hidden md:table-cell">Région</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {USERS.map((u, i) => (
                <tr
                  key={u.email}
                  className={`border-t border-outline-variant/20 ${
                    i % 2 ? "bg-surface-container-lowest/50" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Icon name="person" className="text-lg" fill />
                      </div>
                      <div className="min-w-0">
                        <div className="text-on-surface font-medium truncate">{u.name}</div>
                        <div className="text-on-surface-variant text-xs truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-on-surface-variant">{u.plan}</td>
                  <td className="p-4 hidden md:table-cell text-on-surface-variant">{u.region}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${statusClasses(
                        u.status
                      )}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2 text-on-surface-variant">
                      <button className="hover:text-secondary transition-colors" aria-label="Éditer">
                        <Icon name="edit" className="text-lg" />
                      </button>
                      <button className="hover:text-error transition-colors" aria-label="Supprimer">
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <Icon name="school" className="text-secondary" fill />
            <h3 className="font-headline-lg-mobile text-on-surface">Gestion des Formations</h3>
          </div>
          <button className="px-4 py-2 border border-outline text-on-surface font-bold rounded-lg text-sm hover:bg-surface-variant transition-all flex items-center gap-2">
            <Icon name="add" className="text-sm" />
            Nouveau cours
          </button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
                <th className="p-4">Formation</th>
                <th className="p-4 hidden md:table-cell">Niveau</th>
                <th className="p-4">Étudiants</th>
                <th className="p-4">État</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {COURSES.map((c, i) => (
                <tr
                  key={c.title}
                  className={`border-t border-outline-variant/20 ${
                    i % 2 ? "bg-surface-container-lowest/50" : ""
                  }`}
                >
                  <td className="p-4 text-on-surface font-medium">{c.title}</td>
                  <td className="p-4 hidden md:table-cell text-on-surface-variant">{c.level}</td>
                  <td className="p-4 text-on-surface-variant font-code-sm">{c.students}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${statusClasses(
                        c.state
                      )}`}
                    >
                      {c.state}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2 text-on-surface-variant">
                      <button className="hover:text-secondary transition-colors" aria-label="Éditer">
                        <Icon name="edit" className="text-lg" />
                      </button>
                      <button className="hover:text-error transition-colors" aria-label="Supprimer">
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ConsoleSidebar>
  );
}
