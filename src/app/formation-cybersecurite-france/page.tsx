import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Formation cybersécurité en France : parcours et tarifs | heycybercorp",
  description:
    "Découvrez les formations en cybersécurité accessibles depuis la France : bases de la sécurité informatique, réseaux, OSINT et hacking éthique. Parcours, exercices et tarifs en euros.",
  path: "/formation-cybersecurite-france",
});

const topics = [
  {
    title: "Débuter en cybersécurité",
    description:
      "Construisez les bases : hygiène numérique, réseaux et sécurité informatique avant d'aborder des sujets plus spécialisés.",
  },
  {
    title: "Approfondir la défense",
    description:
      "Travaillez sur l'analyse des vulnérabilités, la protection des systèmes et la sécurité des environnements cloud.",
  },
  {
    title: "Découvrir la sécurité offensive",
    description:
      "Explorez les méthodes de test d'intrusion et de hacking éthique dans un cadre de formation.",
  },
];

export default function FranceTrainingPage() {
  return (
    <PublicShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formation cybersécurité en France", path: "/formation-cybersecurite-france" },
        ]}
      />
      <main className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="max-w-4xl">
          <p className="font-label-mono text-primary uppercase tracking-widest mb-5">
            Parcours accessibles depuis la France
          </p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-7">
            Formation en cybersécurité en France
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            Vous cherchez à acquérir des compétences en cybersécurité depuis la France ?
            heycybercorp propose des parcours en ligne, du niveau débutant aux sujets de
            sécurité offensive. Consultez le catalogue pour choisir une formation selon
            votre niveau et vos objectifs.
          </p>
          <div className="flex flex-wrap gap-4 mb-20">
            <Link href="/formations" className="px-7 py-3 bg-primary text-on-primary rounded-lg font-bold">
              Explorer les formations
            </Link>
            <Link href="/tarifs" className="px-7 py-3 border border-secondary text-secondary rounded-lg font-bold">
              Voir les tarifs en euros
            </Link>
          </div>
        </div>

        <section className="mb-20" aria-labelledby="parcours-title">
          <h2 id="parcours-title" className="font-headline-lg text-headline-lg text-on-surface mb-8">
            Quel parcours choisir ?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {topics.map((topic) => (
              <div key={topic.title} className="glass-panel p-7 rounded-xl border border-outline-variant/30">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4">
                  {topic.title}
                </h3>
                <p className="text-on-surface-variant">{topic.description}</p>
              </div>
            ))}
          </div>
          <p className="text-on-surface-variant mt-6">
            Les contenus disponibles, les niveaux et les prérequis sont détaillés sur chaque
            <Link href="/formations" className="text-secondary underline ml-1">fiche de formation</Link>.
          </p>
        </section>

        <section className="max-w-4xl mb-20" aria-labelledby="france-title">
          <h2 id="france-title" className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Suivre une formation depuis la France
          </h2>
          <p className="text-on-surface-variant mb-5">
            Les formations sont proposées sur la plateforme heycybercorp. Vous pouvez comparer
            les parcours avant de vous inscrire et consulter les prix affichés en euros pour
            la région Europe. Les modalités et le contenu varient selon la formation choisie.
          </p>
          <p className="text-on-surface-variant">
            Si vous formez une équipe, la page
            <Link href="/entreprise" className="text-secondary underline mx-1">Entreprise</Link>
            présente les parcours adaptés aux collaborateurs et permet de demander un programme
            correspondant à vos besoins.
          </p>
        </section>

        <section className="max-w-4xl" aria-labelledby="questions-title">
          <h2 id="questions-title" className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Questions fréquentes
          </h2>
          <div className="space-y-7 text-on-surface-variant">
            <div>
              <h3 className="font-bold text-on-surface mb-2">Je débute : par où commencer ?</h3>
              <p>Commencez par les fondamentaux de la sécurité informatique et des réseaux. Comparez ensuite les prérequis des formations du catalogue.</p>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-2">Où voir le prix en euros ?</h3>
              <p>Consultez la <Link href="/tarifs" className="text-secondary underline">page Tarifs</Link> et sélectionnez la région Europe pour voir les offres disponibles en euros.</p>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-2">Puis-je former mes collaborateurs ?</h3>
              <p>Oui. Décrivez votre besoin sur la <Link href="/contact" className="text-secondary underline">page Contact</Link> pour discuter d&apos;un parcours destiné à votre équipe.</p>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
