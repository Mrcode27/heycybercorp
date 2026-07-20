import Icon from "../Icon";

// Template with sample labs — the live lab environment comes later.
const LABS = [
  { name: "Injection SQL — Blind", level: "Débutant", color: "text-primary", border: "border-primary/20", desc: "Extraire une base de données via une injection SQL en aveugle.", status: "Disponible", icon: "database" },
  { name: "Escalade de privilèges Linux", level: "Intermédiaire", color: "text-secondary", border: "border-secondary/20", desc: "Passer de www-data à root sur une machine mal configurée.", status: "Disponible", icon: "terminal" },
  { name: "Active Directory — Kerberoasting", level: "Avancé", color: "text-error", border: "border-error/20", desc: "Compromettre un domaine Windows via des tickets Kerberos.", status: "Verrouillé", icon: "lan" },
  { name: "Reverse d'un binaire ELF", level: "Avancé", color: "text-error", border: "border-error/20", desc: "Analyser et casser la logique d'un binaire pour trouver le flag.", status: "Verrouillé", icon: "memory" },
];

export default function LabsView() {
  return (
    <>
      <div className="glass-card rounded-xl px-5 py-3 border-dashed border-primary/40 mb-8 flex items-center gap-3">
        <Icon name="science" className="text-primary" />
        <p className="text-on-surface-variant text-sm">
          Aperçu des laboratoires pratiques. Les environnements interactifs (machines virtuelles à
          la demande) arriveront dans une prochaine étape.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LABS.map((lab) => {
          const locked = lab.status === "Verrouillé";
          return (
            <div
              key={lab.name}
              className={`glass-card rounded-xl p-6 flex flex-col ${locked ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-surface-variant flex items-center justify-center">
                  <Icon name={lab.icon} className={lab.color} />
                </div>
                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${lab.border} ${lab.color}`}>
                  {lab.level}
                </span>
              </div>
              <h4 className="font-headline-lg-mobile text-on-surface mb-2">{lab.name}</h4>
              <p className="text-on-surface-variant text-sm mb-6 flex-grow">{lab.desc}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
                  <Icon name={locked ? "lock" : "bolt"} className="text-sm" />
                  {lab.status}
                </span>
                <button
                  disabled={locked}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    locked
                      ? "border border-outline-variant text-on-surface-variant cursor-not-allowed"
                      : "bg-primary text-on-primary hover:brightness-110"
                  }`}
                >
                  {locked ? "Prérequis manquant" : "Lancer le lab"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
