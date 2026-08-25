import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "heycybercorp | Mentions Légales",
  description:
    "Mentions légales du site heycybercorp : éditeur, directeur de la publication, hébergeur et propriété intellectuelle.",
  path: "/mentions-legales",
});

const h2 = "font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4 mt-12 first:mt-0";
const p = "font-body-md text-body-md text-on-surface-variant mb-4";

export default function MentionsLegalesPage() {
  return (
    <PublicShell>
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
          Informations légales
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-10">Mentions Légales</h1>

        <div className="max-w-3xl space-y-4 pb-24">
          <h2 className={h2}>1. Éditeur du site</h2>
          <p className={p}>
            Le présent site est édité par <span className="text-on-surface font-bold">heycybercorp</span> [
            forme juridique à compléter], immatriculée sous le numéro SIREN [
            à compléter], dont le siège social est situé [adresse à compléter].
          </p>
          <p className={p}>
            Numéro de TVA intracommunautaire : [à compléter].
            <br />
            Directeur de la publication : [à compléter].
            <br />
            Contact :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>

          <h2 className={h2}>2. Hébergement</h2>
          <p className={p}>
            Le site est hébergé par :
            <br />
            <span className="text-on-surface">Vercel Inc.</span>
            <br />
            440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
            <br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
              https://vercel.com
            </a>
          </p>

          <h2 className={h2}>3. Propriété intellectuelle</h2>
          <p className={p}>
            L&apos;ensemble des contenus du site (textes, structures pédagogiques, marques, logos,
            éléments graphiques et code source) est protégé par le droit de la propriété
            intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle,
            sans l&apos;autorisation écrite préalable de heycybercorp est interdite et constituerait
            une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la
            propriété intellectuelle.
          </p>
          <p className={p}>
            Les accès aux formations acquis par achat sont strictement personnels et incessibles ;
            le partage d&apos;identifiants ou de contenus de formation est interdit.
          </p>

          <h2 className={h2}>4. Conditions générales</h2>
          <p className={p}>
            Les ventes de formations réalisées sur le site sont soumises aux conditions générales de
            vente, communiquées sur demande à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            et jointes au processus de commande. Le droit de rétractation de quatorze (14) jours
            prévu par le Code de la consommation s&apos;applique aux consommateurs, sauf exécution
            du contenu numérique avec accord préalable exprès.
          </p>

          <h2 className={h2}>5. Données personnelles</h2>
          <p className={p}>
            Le traitement de vos données personnelles est décrit dans notre{" "}
            <Link href="/confidentialite" className="text-secondary hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>

          <h2 className={h2}>6. Signalement</h2>
          <p className={p}>
            Tout signalement de contenu illicite peut être adressé à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
            numérique (LCEN), l&apos;éditeur met en œuvre les moyens nécessaires au retrait des
            contenus manifestement illicites qui lui seraient signalés.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
