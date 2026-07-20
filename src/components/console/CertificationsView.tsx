import Icon from "../Icon";

// Template with sample certifications — issuing real certificates comes later.
const CERTS = [
  {
    name: "heycybercorp Secure Operator",
    level: "Fondamentaux",
    status: "in-progress",
    progress: 65,
    note: "Terminez 3 formations pour débloquer l'examen.",
  },
  {
    name: "Certified Pentester Junior",
    level: "Spécialiste",
    status: "locked",
    progress: 0,
    note: "Nécessite la certification Secure Operator.",
  },
  {
    name: "Red Team Operator",
    level: "Expert",
    status: "locked",
    progress: 0,
    note: "Nécessite 5 labs avancés validés.",
  },
];

export default function CertificationsView() {
  return (
    <>
      <div className="glass-card rounded-xl px-5 py-3 border-dashed border-primary/40 mb-8 flex items-center gap-3">
        <Icon name="workspace_premium" className="text-primary" />
        <p className="text-on-surface-variant text-sm">
          Aperçu de votre parcours de certification. La délivrance des diplômes vérifiables sera
          activée prochainement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CERTS.map((c) => {
          const locked = c.status === "locked";
          return (
            <div
              key={c.name}
              className={`glass-card rounded-xl p-6 flex flex-col text-center ${locked ? "opacity-70" : ""}`}
            >
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
                  locked
                    ? "bg-surface-variant border-outline-variant text-on-surface-variant"
                    : "bg-primary/10 border-primary/30 text-primary"
                }`}
              >
                <Icon name={locked ? "lock" : "verified"} className="text-3xl" fill={!locked} />
              </div>
              <span className="font-label-mono text-xs uppercase tracking-widest text-on-surface-variant">
                {c.level}
              </span>
              <h4 className="font-headline-lg-mobile text-on-surface mt-1 mb-4">{c.name}</h4>

              {!locked && (
                <div className="mb-4">
                  <div className="flex justify-between font-code-sm text-code-sm mb-1.5">
                    <span className="text-on-surface-variant">Progression</span>
                    <span className="text-primary">{c.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              )}

              <p className="text-on-surface-variant text-sm mb-6 flex-grow">{c.note}</p>
              <button
                disabled={locked || c.progress < 100}
                className={`mt-auto py-2.5 rounded-lg text-sm font-bold transition-all ${
                  locked || c.progress < 100
                    ? "border border-outline-variant text-on-surface-variant cursor-not-allowed"
                    : "bg-primary text-on-primary hover:brightness-110"
                }`}
              >
                {locked ? "Verrouillé" : c.progress < 100 ? "En cours" : "Passer l'examen"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
