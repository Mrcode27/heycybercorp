import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { CONTACT_EMAIL, HOST, LEGAL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "heycybercorp | Mentions Légales",
  description:
    "Mentions légales du site heycybercorp : éditeur, directeur de la publication, hébergeur, propriété intellectuelle et médiation de la consommation.",
  path: "/mentions-legales",
});

const h2 = "font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4 mt-14 first:mt-0";
const p = "font-body-md text-body-md text-on-surface-variant mb-4";
const link = "text-secondary hover:underline";

/**
 * One row of the publisher identity table.
 *
 * A field with no value renders nothing at all rather than an empty marker: a
 * legal notice listing "SIREN —" advertises that the company isn't registered
 * yet. Fill the field in `LEGAL` (or run `npm run legal:fetch`) and its row
 * comes back on its own, no edit here needed.
 */
function Row({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-1 sm:gap-4 py-3 border-b border-outline-variant/20 last:border-0">
      <dt className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-on-surface">{value}</dd>
    </div>
  );
}

export default function MentionsLegalesPage() {
  const mail = (
    <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
      {CONTACT_EMAIL}
    </a>
  );

  return (
    <PublicShell>
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
          Informations légales
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-3">
          Mentions Légales
        </h1>
        <p className="font-code-sm text-code-sm text-on-surface-variant mb-10">
          Dernière mise à jour : août 2026
        </p>

        <div className="max-w-3xl pb-24">
          <h2 className={h2}>Éditeur du site</h2>
          <dl className="mb-4">
            <Row label="Dénomination" value={LEGAL.companyName} />
            <Row label="Forme juridique" value={LEGAL.legalForm} />
            <Row label="Capital social" value={LEGAL.capital} />
            <Row label="SIREN" value={LEGAL.siren} />
            <Row
              label="RCS"
              value={
                LEGAL.siren.trim() && LEGAL.rcsCity.trim()
                  ? `${LEGAL.rcsCity} ${LEGAL.siren}`
                  : ""
              }
            />
            <Row label="TVA intracommunautaire" value={LEGAL.vatNumber} />
            <Row label="Siège social" value={LEGAL.address} />
            <Row label="Directeur de la publication" value={LEGAL.publicationDirector} />
          </dl>
          <p className={p}>Contact : {mail}</p>

          <h2 className={h2}>Hébergement</h2>
          <p className={p}>
            {HOST.name}, {HOST.address} —{" "}
            <a href={HOST.url} target="_blank" rel="noopener noreferrer" className={link}>
              {HOST.url.replace("https://", "")}
            </a>
          </p>

          <h2 className={h2}>Propriété intellectuelle</h2>
          <p className={p}>
            L&apos;ensemble des contenus du site — textes, structures pédagogiques, marques, logos,
            éléments graphiques et code source — est protégé par le droit de la propriété
            intellectuelle. Toute reproduction ou exploitation, totale ou partielle, sans
            autorisation écrite préalable constitue une contrefaçon au sens des articles L.335-2 et
            suivants du Code de la propriété intellectuelle.
          </p>
          <p className={p}>
            Les accès aux formations sont strictement personnels et incessibles. Le partage
            d&apos;identifiants ou la rediffusion des contenus entraînent la suspension du compte,
            sans remboursement.
          </p>

          <h2 className={h2}>Ventes et droit de rétractation</h2>
          <p className={p}>
            Les formations sont vendues à des consommateurs et à des professionnels. Conformément
            aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose
            d&apos;un délai de quatorze (14) jours à compter de la conclusion du contrat pour
            exercer son droit de rétractation, sans avoir à se justifier. La demande est à adresser
            à {mail}.
          </p>

          {/* Same rule as the identity rows: no mediator designated yet means
              the section stays out, rather than announcing the gap. */}
          {LEGAL.mediator.name.trim() && (
            <>
              <h2 className={h2}>Médiation de la consommation</h2>
              <p className={p}>
                Conformément à l&apos;article L.612-1 du Code de la consommation, tout consommateur
                peut recourir gratuitement au médiateur{" "}
                <span className="text-on-surface">{LEGAL.mediator.name}</span>
                {LEGAL.mediator.url.trim() && (
                  <>
                    {" "}
                    —{" "}
                    <a
                      href={LEGAL.mediator.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={link}
                    >
                      {LEGAL.mediator.url.replace("https://", "")}
                    </a>
                  </>
                )}
                , après avoir tenté de résoudre son litige directement auprès de nos services.
              </p>
            </>
          )}

          <h2 className={h2}>Données personnelles</h2>
          <p className={p}>
            Les traitements de données personnelles, leurs finalités, leurs durées de conservation
            et vos droits sont décrits dans notre{" "}
            <Link href="/confidentialite" className={link}>
              Politique de confidentialité
            </Link>
            .
          </p>

          <h2 className={h2}>Signalement de contenu illicite</h2>
          <p className={p}>
            Tout contenu manifestement illicite peut être signalé à {mail}. Conformément à la loi
            n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique,
            l&apos;éditeur met en œuvre les moyens nécessaires à son retrait.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
