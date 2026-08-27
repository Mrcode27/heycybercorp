import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import Icon from "@/components/Icon";
import HeroTerminal from "@/components/HeroTerminal";
import PricingPreview from "@/components/PricingPreview";
import LiveForm from "@/components/LiveForm";
import FreeContent from "@/components/FreeContent";
import Socials from "@/components/Socials";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
import { CONTACT_EMAIL } from "@/lib/site";

const COURSES = [
  {
    icon: "verified_user",
    title: "Débutant",
    accent: "text-primary",
    iconBg: "bg-surface-variant text-primary",
    desc: "Les bases fondamentales de la sécurité informatique, les protocoles réseaux et l'hygiène numérique.",
    meta: "12 Modules",
    border: "hover:border-primary",
    hoverText: "hover:text-primary",
  },
  {
    icon: "security",
    title: "Intermédiaire",
    accent: "text-secondary",
    iconBg: "bg-surface-variant text-secondary",
    desc: "Analyse des vulnérabilités, protection des terminaux et sécurisation des environnements cloud.",
    meta: "24 Modules",
    border: "border-secondary/50 hover:border-secondary",
    hoverText: "hover:text-secondary",
  },
  {
    icon: "terminal",
    title: "Hacking Éthique",
    accent: "text-primary",
    iconBg: "bg-primary/20 text-primary",
    desc: "Test d'intrusion, exploitation avancée, ingénierie inverse et Red Teaming de haut niveau.",
    meta: "Professional",
    border: "border-primary/30 hover:border-primary bg-primary/5",
    hoverText: "hover:text-primary",
  },
];

export default function Home() {
  return (
    <PublicShell>
      <OrganizationJsonLd />
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden cyber-grid">
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary font-label-mono text-label-mono">
              <Icon name="shield" className="text-[14px]" />
              STATUS: SECURE_ENVIRONMENT_ALPHA
            </div>
            <h1 className="font-headline-xl text-headline-xl lg:text-[64px] leading-tight text-on-surface">
              Maîtrisez l&apos;Art de la <span className="text-primary italic">Cyberdéfense</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Formations de pointe pour les talents africains et européens. Apprenez auprès des
              experts du renseignement et de la sécurité offensive.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/formations"
                className="px-8 py-4 bg-brand-green text-white rounded-lg font-bold cyber-glow-primary hover:brightness-110 transition-all flex items-center gap-2 group"
              >
                Découvrir nos formations
                <Icon
                  name="arrow_forward"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="/tarifs"
                className="px-8 py-4 border border-brand-teal text-brand-teal rounded-lg font-bold hover:bg-brand-teal/10 transition-all"
              >
                Voir les tarifs
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-8">
              <div className="flex -space-x-3">
                {["#2aa561", "#0097b2", "#004630"].map((c, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    <Icon name="person" className="text-white text-[18px]" />
                  </div>
                ))}
              </div>
              <div className="text-on-surface-variant text-sm font-label-mono uppercase tracking-widest">
                +500 Étudiants Formés en 2024
              </div>
            </div>
          </div>

          {/* Interactive terminal */}
          <div className="hidden lg:block relative">
            <HeroTerminal />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary/20 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Course preview */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="text-primary font-label-mono mb-4 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              CATALOGUE DE FORMATIONS
            </div>
            <h2 className="font-headline-lg text-headline-xl text-on-surface">
              Préparez-vous aux Menaces de Demain
            </h2>
          </div>
          <p className="text-on-surface-variant font-body-md max-w-md">
            Des programmes immersifs conçus par des praticiens du terrain, allant de
            l&apos;initiation au hacking éthique avancé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COURSES.map((c) => (
            <div
              key={c.title}
              className={`glass-panel p-8 rounded-xl group transition-all duration-500 relative overflow-hidden flex flex-col h-full ${c.border}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div
                  className={`w-12 h-12 rounded flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c.iconBg}`}
                >
                  <Icon name={c.icon} />
                </div>
                <h3 className="font-headline-lg text-on-surface mb-4">{c.title}</h3>
                <p className="text-on-surface-variant mb-8 flex-1">{c.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`font-label-mono ${c.accent}`}>{c.meta}</span>
                  <Link
                    href="/formations"
                    className={`text-on-surface transition-colors flex items-center gap-2 ${c.hoverText}`}
                  >
                    Détails <Icon name="east" className="text-sm" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 bg-surface-container-low border-y border-outline-variant/30">
        <PricingPreview />
      </section>

      {/* Free content + community */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <FreeContent />
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-secondary font-label-mono mb-4">
            <span className="h-px w-8 bg-secondary" />
            COMMUNAUTÉ
          </div>
          <h2 className="font-headline-lg text-headline-xl text-on-surface mb-4 text-balance">
            Rejoignez la communauté
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-10">
            Suivez heycybercorp pour des astuces, des lives et les coulisses de la cyberdéfense.
          </p>
          <Socials variant="hero" />
        </div>
      </section>

      {/* Quote request form */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="glass-panel rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="p-12 lg:p-16 bg-primary/5 border-r border-outline-variant/30">
            <h2 className="font-headline-xl text-on-surface mb-6">
              Besoin d&apos;un programme spécifique ?
            </h2>
            <p className="text-on-surface-variant mb-12">
              Nos experts analysent vos besoins pour créer des parcours de montée en compétences
              personnalisés pour vos collaborateurs.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                  <Icon name="mail" className="text-sm" />
                </div>
                <div>
                  <div className="text-on-surface font-medium">Email Direct</div>
                  <div className="text-on-surface-variant text-sm">{CONTACT_EMAIL}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-6 h-6 rounded bg-secondary/20 flex items-center justify-center text-secondary">
                  <Icon name="location_on" className="text-sm" />
                </div>
                <div>
                  <div className="text-on-surface font-medium">Bureaux</div>
                  <div className="text-on-surface-variant text-sm">Paris · Douala</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 lg:p-16">
            <LiveForm
              kind="devis"
              className="space-y-6"
              submitLabel="Envoyer ma demande"
              submitClassName="w-full py-4 bg-secondary text-on-secondary font-bold rounded-lg hover:brightness-110 cyber-glow-secondary transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
                    Nom Complet
                  </label>
                  <input
                    name="nom"
                    className="w-full bg-field border border-outline-variant text-on-surface focus:border-secondary focus:ring-0 rounded p-3 transition-colors outline-none"
                    placeholder="Jean Dupont"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
                    Email Professionnel
                  </label>
                  <input
                    name="email"
                    className="w-full bg-field border border-outline-variant text-on-surface focus:border-secondary focus:ring-0 rounded p-3 transition-colors outline-none"
                    placeholder="jean@entreprise.com"
                    type="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
                  Type de Formation
                </label>
                <select
                  name="type"
                  className="w-full bg-field border border-outline-variant text-on-surface focus:border-secondary focus:ring-0 rounded p-3 transition-colors outline-none"
                >
                  <option>Audit &amp; Pentesting</option>
                  <option>Sécurité Cloud</option>
                  <option>Réponse aux Incidents</option>
                  <option>Autre (Préciser)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
                  Votre Message
                </label>
                <textarea
                  name="message"
                  className="w-full bg-field border border-outline-variant text-on-surface focus:border-secondary focus:ring-0 rounded p-3 transition-colors outline-none"
                  placeholder="Décrivez votre projet..."
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
