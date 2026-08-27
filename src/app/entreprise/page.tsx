import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PublicShell from "@/components/PublicShell";
import Icon from "@/components/Icon";
import LiveForm from "@/components/LiveForm";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "heycybercorp | Solutions Entreprise",
  description:
    "Formez vos équipes à la cybersécurité : sensibilisation, hygiène numérique, gouvernance et tests d'intrusion. Programmes sur mesure pour entreprises en Afrique et en Europe.",
  path: "/entreprise",
});

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  icon: string;
  photo?: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Nono Raissa",
    role: "Founder & CEO",
    bio: "À l'origine de heycybercorp : expert en cybersécurité offensive et formation des équipes techniques.",
    icon: "swords",
    photo: "/founder.jpeg",
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
              className="bg-primary text-on-primary px-8 py-4 rounded-sm font-bold text-lg hover:shadow-glow-primary transition-all"
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
          <div className={TEAM.length === 1 ? "flex justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"}>
            {TEAM.map((member) => (
              <div key={member.name} className="text-center group max-w-xs">
                <div className="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-glow-strong transition-all duration-500">
                  <div className="hexagon-inner w-full h-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon name={member.icon} className="text-primary text-5xl" />
                    )}
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
                  <div className="text-on-surface">{CONTACT_EMAIL}</div>
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
                  <div className="text-on-surface">Paris, France · Douala, Cameroun</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <LiveForm
              kind="devis"
              className="glass-card p-8 md:p-12 rounded-sm space-y-6"
              submitLabel="Envoyer la requête"
              submitIcon="send"
              submitClassName="w-full bg-primary text-on-primary font-bold py-4 rounded-sm hover:shadow-glow-primary transition-all flex items-center justify-center gap-2"
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
