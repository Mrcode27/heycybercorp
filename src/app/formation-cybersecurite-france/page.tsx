import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Formation cybersécurité en France : parcours et tarifs | heycybercorp",
  description:
    "Formations en cybersécurité en ligne pour la France : fondamentaux, OSINT, gouvernance et hacking éthique, et le cadre français (Code pénal, RGPD, NIS2). Tarifs en euros.",
  path: "/formation-cybersecurite-france",
});

const linkClass = "text-secondary underline";

// Slugs of live courses. A renamed slug would 404 here, so keep them in step
// with /admin/formations.
const topics = [
  {
    title: "Débuter en cybersécurité",
    description:
      "Construisez les bases : hygiène numérique, réseaux et sécurité informatique avant d'aborder des sujets plus spécialisés.",
    course: { name: "Introduction à la Cybersécurité", slug: "introduction-cybersecurite" },
  },
  {
    title: "Approfondir la défense",
    description:
      "Simulez des attaques pour mieux comprendre la menace, puis bâtissez la détection et la défense.",
    course: { name: "Red Team & Blue Team", slug: "red-team-blue-team" },
  },
  {
    title: "Découvrir la sécurité offensive",
    description:
      "Explorez les méthodes de test d'intrusion et de hacking éthique, toujours sur des systèmes que vous êtes autorisé à tester.",
    course: { name: "Introduction au Hacking Éthique", slug: "introduction-hacking-ethique" },
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
            France · Europe francophone
          </p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-7">
            Formation en cybersécurité en France
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            heycybercorp propose des formations en cybersécurité en ligne et en français, du
            niveau débutant aux sujets de sécurité offensive, avec des prix en euros. Cette page
            fait le point sur le cadre dans lequel vous exercerez en France et en Europe (droit
            pénal du numérique, RGPD, directive NIS2) et sur les formations qui y préparent.
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
                <p className="text-on-surface-variant mb-4">{topic.description}</p>
                <Link href={`/formations/${topic.course.slug}`} className={linkClass}>
                  {topic.course.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-on-surface-variant mt-6">
            Les contenus disponibles, les niveaux et les prérequis sont détaillés sur chaque
            <Link href="/formations" className={`${linkClass} ml-1`}>fiche de formation</Link>.
          </p>
        </section>

        <section className="max-w-4xl mb-20" aria-labelledby="cadre-title">
          <h2 id="cadre-title" className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Le cadre de la cybersécurité en France et en Europe
          </h2>
          <div className="space-y-5 text-on-surface-variant">
            <p>
              <strong className="text-on-surface">Le cadre légal du hacking éthique.</strong> En
              France, l&apos;accès frauduleux à un système d&apos;information est sanctionné par
              l&apos;article 323-1 du Code pénal. Un test d&apos;intrusion ne se pratique donc que
              sur un système que l&apos;on est autorisé à tester. C&apos;est pourquoi le parcours
              commence par l&apos;
              <Link href="/formations/introduction-hacking-ethique" className={linkClass}>
                introduction au hacking éthique
              </Link>{" "}
              et par la création d&apos;un{" "}
              <Link href="/formations/laboratoire-hacking" className={linkClass}>
                laboratoire isolé
              </Link>{" "}
              pour s&apos;entraîner légalement.
            </p>
            <p>
              <strong className="text-on-surface">RGPD et NIS2.</strong> Le RGPD impose de
              notifier la CNIL dans les 72 heures lorsqu&apos;une violation de données personnelles
              présente un risque pour les personnes. La directive européenne NIS2 étend les
              obligations de cybersécurité à de nombreuses entreprises et administrations, avec
              l&apos;ANSSI comme autorité nationale. Le module{" "}
              <Link href="/formations/gouvernance-risques-conformite" className={linkClass}>
                Gouvernance, Risques et Conformité
              </Link>{" "}
              pose les bases : politiques de sécurité, gestion des risques et normes de
              conformité.
            </p>
            <p>
              <strong className="text-on-surface">Protéger ses comptes au quotidien.</strong> Le
              phishing reste l&apos;une des menaces les plus signalées sur cybermalveillance.gouv.fr,
              le dispositif national d&apos;assistance aux victimes. Les formations sur la sécurité
              des comptes de réseaux sociaux apprennent à reconnaître ces attaques et à activer la
              double authentification.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mb-20" aria-labelledby="france-title">
          <h2 id="france-title" className="font-headline-lg text-headline-lg text-on-surface mb-6">
            Se former en ligne, à son rythme
          </h2>
          <p className="text-on-surface-variant mb-5">
            Les formations sont en ligne : vous les suivez depuis Paris, Lyon, Bruxelles ou
            Genève, au rythme qui vous convient. Chaque pack s&apos;achète une seule fois, en
            euros, et donne un accès à vie aux formations de son niveau.
          </p>
          <p className="text-on-surface-variant">
            Si vous formez une équipe, la page
            <Link href="/entreprise" className={`${linkClass} mx-1`}>Entreprise</Link>
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
              <h3 className="font-bold text-on-surface mb-2">Combien coûte une formation ?</h3>
              <p>Les prix sont en euros, avec un paiement unique par pack. Le détail des offres est sur la <Link href="/tarifs" className={linkClass}>page Tarifs</Link>.</p>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-2">Le hacking éthique est-il légal en France ?</h3>
              <p>Oui, à condition de n&apos;intervenir que sur des systèmes que vous possédez ou que vous êtes explicitement autorisé à tester. Les exercices se font dans votre propre laboratoire.</p>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-2">Puis-je former mes collaborateurs ?</h3>
              <p>Oui. Décrivez votre besoin sur la <Link href="/contact" className={linkClass}>page Contact</Link> pour discuter d&apos;un parcours destiné à votre équipe.</p>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
