import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import Icon from "@/components/Icon";
import LiveForm from "@/components/LiveForm";

export const metadata: Metadata = {
  title: "heycybercorp | Solutions Entreprise",
};

const TEAM = [
  {
    name: "Alexandre V.",
    role: "Lead Pentester",
    bio: "Expert en compromission Active Directory et Red Teaming.",
    icon: "swords",
  },
  {
    name: "Sarah K.",
    role: "DFIR Analyst",
    bio: "Spécialiste en réponse aux incidents et analyse forensique.",
    icon: "biotech",
  },
  {
    name: "Marc-André D.",
    role: "Cloud Sec Architect",
    bio: "Ancien RSSI, expert en sécurisation d'environnements AWS & Azure.",
    icon: "cloud",
  },
  {
    name: "Jérôme L.",
    role: "Exploit Dev",
    bio: "Chercheur spécialisé en reverse engineering et kernel hacking.",
    icon: "memory",
  },
];

const inputClass =
  "w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none";
const labelClass = "font-label-mono text-label-mono text-on-surface-variant uppercase";

export default function EntreprisePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative min-h-[560px] flex items-center justify-center overflow-hidden cyber-grid-dots pt-24">
        <div className="relative z-10 text-center px-margin-mobile max-w-4xl">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
            Division Corporate
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-6">
            Sécurisez l&apos;avenir de votre infrastructure humaine.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
            Des programmes de montée en compétences cyber sur-mesure pour vos équipes techniques,
            conçus par des experts du terrain dans un environnement de simulation haute-fidélité.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/tarifs"
              className="bg-primary text-on-primary px-8 py-4 rounded-sm font-bold text-lg hover:shadow-[0_0_15px_rgba(106,221,147,0.4)] transition-all"
            >
              Consulter nos offres
            </Link>
            <Link
              href="/contact"
              className="border border-secondary text-secondary px-8 py-4 rounded-sm font-bold text-lg hover:bg-secondary/10 transition-all"
            >
              Parler à un expert
            </Link>
          </div>
        </div>
      </section>

      {/* Histoire & Valeurs */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">
              Notre Histoire &amp; Valeurs
            </h2>
            <div className="space-y-6 font-body-md text-body-md text-on-surface-variant">
              <p>
                Né au cœur des enjeux de souveraineté numérique,{" "}
                <span className="text-primary font-bold">heycybercorp</span> a été fondé par un
                collectif d&apos;anciens analystes SOC et chercheurs en vulnérabilités. Notre
                mission : combler le fossé entre la théorie académique et la réalité brutale des
                cyberattaques modernes.
              </p>
              <p>
                Nous croyons que la défense n&apos;est pas qu&apos;une question d&apos;outils, mais
                de réflexes. Nos valeurs sont ancrées dans la rigueur technique, le partage de
                connaissance et l&apos;éthique offensive au service de la protection.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="p-6 bg-surface-container-low border-l-4 border-primary">
                <div className="text-headline-lg font-bold text-primary mb-1">98%</div>
                <div className="text-label-mono font-label-mono uppercase text-on-surface-variant">
                  Taux de réussite
                </div>
              </div>
              <div className="p-6 bg-surface-container-low border-l-4 border-secondary">
                <div className="text-headline-lg font-bold text-secondary mb-1">500+</div>
                <div className="text-label-mono font-label-mono uppercase text-on-surface-variant">
                  Entreprises formées
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square glass-card rounded-xl overflow-hidden relative flex items-end p-8 cyber-grid">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="relative w-full p-6 bg-surface-container/90 backdrop-blur-md border border-outline-variant/30">
                <div className="font-code-sm text-code-sm text-primary mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  SYSTEM_CORE_VALUES.EXE
                </div>
                <div className="font-label-mono text-label-mono text-on-surface">
                  &gt; Intégrité. Excellence. Résilience.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">
              L&apos;Elite du Terminal
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Nos formateurs sont des praticiens certifiés intervenant quotidiennement sur des
              environnements critiques.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-[0_0_30px_rgba(0,145,80,0.3)] transition-all duration-500">
                  <div className="hexagon-inner w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <Icon name={member.icon} className="text-primary text-5xl" />
                  </div>
                </div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                  {member.name}
                </h3>
                <p className="font-label-mono text-label-mono text-secondary mb-2 uppercase tracking-wider">
                  {member.role}
                </p>
                <p className="text-on-surface-variant text-sm px-4">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-6">
              Prêt à renforcer vos défenses ?
            </h2>
            <p className="text-on-surface-variant mb-8">
              Discutons de vos besoins spécifiques : audits de compétences, parcours de formation
              personnalisés ou simulations de crise.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high border border-outline-variant text-primary rounded-sm">
                  <Icon name="mail" />
                </div>
                <div>
                  <div className="font-label-mono text-label-mono text-primary uppercase">Email</div>
                  <div className="text-on-surface">corporate@heycybercorp.io</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high border border-outline-variant text-secondary rounded-sm">
                  <Icon name="location_on" />
                </div>
                <div>
                  <div className="font-label-mono text-label-mono text-secondary uppercase">
                    Siège
                  </div>
                  <div className="text-on-surface">Station F, Paris, France</div>
                </div>
              </div>
            </div>
            <div className="mt-12 p-6 glass-card rounded-sm border-dashed border-primary/40">
              <div className="font-code-sm text-code-sm text-on-surface-variant mb-2">
                heycybercorp_cli --status
              </div>
              <div className="font-code-sm text-code-sm text-primary">
                [OK] Systèmes opérationnels <br />
                [OK] Experts disponibles pour consultation <br />
                <span className="cursor-blink">_</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <LiveForm
              kind="devis"
              className="glass-card p-8 md:p-12 rounded-sm space-y-6"
              submitLabel="Envoyer la requête"
              submitIcon="send"
              submitClassName="w-full bg-primary text-on-primary font-bold py-4 rounded-sm hover:shadow-[0_0_20px_rgba(106,221,147,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Nom Complet</label>
                  <input name="nom" className={inputClass} placeholder="ex: Jean Dupont" type="text" required />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Email Professionnel</label>
                  <input
                    name="email"
                    className={inputClass}
                    placeholder="nom@entreprise.com"
                    type="email"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Entreprise</label>
                  <input name="entreprise" className={inputClass} placeholder="Nom de votre société" type="text" />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Effectif IT</label>
                  <select name="effectif" className={inputClass}>
                    <option>1 - 10</option>
                    <option>11 - 50</option>
                    <option>50 - 200</option>
                    <option>200+</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Votre Projet</label>
                <textarea
                  name="message"
                  className={inputClass}
                  placeholder="Décrivez vos objectifs de formation ou de sécurité..."
                  rows={4}
                  required
                  minLength={10}
                />
              </div>
            </LiveForm>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
