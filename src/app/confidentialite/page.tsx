import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "heycybercorp | Politique de Confidentialité",
  description:
    "Politique de confidentialité de heycybercorp : données collectées, finalités, durées de conservation, sous-traitants, transferts hors UE et vos droits RGPD.",
  path: "/confidentialite",
});

const h2 = "font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4 mt-12 first:mt-0 scroll-mt-28";
const h3 = "font-label-mono text-label-mono text-secondary uppercase tracking-wider mb-2 mt-6";
const p = "font-body-md text-body-md text-on-surface-variant mb-4";
const li = "text-on-surface-variant list-disc list-inside marker:text-primary";
const mail = "text-secondary hover:underline";

export default function ConfidentialitePage() {
  return (
    <PublicShell>
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
          RGPD — Données personnelles
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-4">
          Politique de Confidentialité
        </h1>
        <p className={p}>Dernière mise à jour : août 2026.</p>

        <div className="max-w-3xl space-y-2 pb-24">
          <h2 className={h2}>1. Responsable du traitement</h2>
          <p className={p}>
            heycybercorp [forme juridique et adresse à compléter], joignable à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={mail}>
              {CONTACT_EMAIL}
            </a>
            , est responsable des traitements de données personnelles réalisés sur le site{" "}
            www.heycybercorp.fr.
          </p>

          <h2 className={h2}>2. Données que nous collectons</h2>
          <ul className="space-y-2">
            <li className={li}>
              <span className="text-on-surface">Compte utilisateur</span> : nom, adresse e-mail,
              région tarifaire (Afrique/Europe) — collectés à l&apos;inscription.
            </li>
            <li className={li}>
              <span className="text-on-surface">Achats</span> : historique de commandes et droits
              d&apos;accès aux formations achetées. Les données de paiement sont traitées
              exclusivement par Stripe ; nous ne voyons ni ne stockons jamais votre numéro de carte.
            </li>
            <li className={li}>
              <span className="text-on-surface">Apprentissage</span> : progression dans les
              formations, temps de visionnage et certificats obtenus.
            </li>
            <li className={li}>
              <span className="text-on-surface">Formulaires de contact / devis</span> : nom, e-mail
              professionnel, entreprise, effectif et contenu du message.
            </li>
            <li className={li}>
              <span className="text-on-surface">Journal d&apos;audit technique</span> : actions
              d&apos;administration et accès, à des fins de sécurité.
            </li>
          </ul>

          <h2 className={h2}>3. Finalités et bases légales</h2>
          <div className={h3}>Exécution du contrat</div>
          <p className={p}>
            Création et gestion de votre compte, fourniture des formations achetées, suivi de votre
            progression et délivrance des certificats.
          </p>
          <div className={h3}>Intérêt légitime</div>
          <p className={p}>
            Sécurisation de la plateforme, prévention de la fraude, journal d&apos;audit et
            amélioration de nos contenus.
          </p>
          <div className={h3}>Obligation légale</div>
          <p className={p}>
            Conservation des pièces comptables liées aux commandes (obligations fiscales et
            comptables).
          </p>
          <div className={h3}>Consentement</div>
          <p className={p}>
            Aucun cookie publicitaire ou de mesure d&apos;audience tierce n&apos;est déposé sans
            votre consentement (voir section 8).
          </p>

          <h2 id="destinataires" className={h2}>
            4. Destinataires et sous-traitants
          </h2>
          <ul className="space-y-2">
            <li className={li}>
              <span className="text-on-surface">Clerk</span> — gestion des comptes et de
              l&apos;authentification.
            </li>
            <li className={li}>
              <span className="text-on-surface">Convex</span> — hébergement de la base de données de
              la plateforme.
            </li>
            <li className={li}>
              <span className="text-on-surface">Stripe</span> — traitement des paiements par carte
              et facturation.
            </li>
            <li className={li}>
              <span className="text-on-surface">Google (SMTP)</span> — acheminement des e-mails de
              notification des formulaires.
            </li>
            <li className={li}>
              <span className="text-on-surface">YouTube / Vimeo / Bunny Stream</span> — diffusion
              des vidéos de formation lorsque la leçon utilise un lecteur embarqué.
            </li>
          </ul>
          <p className={p}>
            Ces prestataires n&apos;accèdent aux données que pour l&apos;exécution de leurs missions
            et sont liés par des engagements contractuels conformes à l&apos;article 28 du RGPD.
          </p>

          <h2 className={h2}>5. Transferts hors Union européenne</h2>
          <p className={p}>
            Certains prestataires (Clerk, Convex, Stripe) hébergent des données aux États-Unis. Ces
            transferts sont encadrés par les clauses contractuelles types de la Commission
            européenne et/ou leur adhésion au Data Privacy Framework UE — États-Unis. Vous pouvez
            demander les garanties mises en œuvre à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={mail}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <h2 className={h2}>6. Durées de conservation</h2>
          <ul className="space-y-2">
            <li className={li}>
              Compte et accès aux formations : durée du compte, puis suppression après 3 ans
              d&apos;inactivité.
            </li>
            <li className={li}>Commandes / pièces comptables : 10 ans (obligations comptables).</li>
            <li className={li}>Messages de contact non convertis : 3 ans après le dernier contact.</li>
            <li className={li}>Journal d&apos;audit : 12 mois.</li>
          </ul>

          <h2 className={h2}>7. Vos droits</h2>
          <p className={p}>
            Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés,
            vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de
            portabilité, d&apos;opposition et de limitation du traitement de vos données.
          </p>
          <p className={p}>
            Pour exercer ces droits, écrivez à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={mail}>
              {CONTACT_EMAIL}
            </a>{" "}
            — une réponse vous sera apportée dans un délai maximal d&apos;un mois. Vous pouvez
            également introduire une réclamation auprès de la CNIL (
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className={mail}
            >
              www.cnil.fr
            </a>
            ).
          </p>

          <h2 id="cookies" className={h2}>
            8. Cookies
          </h2>
          <p className={p}>
            Le site ne dépose <span className="text-on-surface font-bold">aucun cookie</span>{" "}
            publicitaire ni de mesure d&apos;audience tierce. Seuls des éléments strictement
            nécessaires au fonctionnement sont utilisés :
          </p>
          <ul className="space-y-2">
            <li className={li}>
              <span className="text-on-surface">Session d&apos;authentification</span> (Clerk) —
              indispensable pour rester connecté.
            </li>
            <li className={li}>
              <span className="text-on-surface">Lecteurs vidéo embarqués</span> — lorsque vous
              lancez une vidéo hébergée par YouTube (via le domaine « nocookie »), Vimeo ou Bunny,
              ces services peuvent déposer leurs propres cookies ; ils ne sont sollicités qu&apos;à
              votre action de lecture.
            </li>
          </ul>

          <h2 className={h2}>9. Sécurité</h2>
          <p className={p}>
            Nous appliquons des mesures techniques et organisationnelles adaptées : chiffrement
            HTTPS intégral, en-têtes de sécurité stricts (HSTS, Content-Security-Policy),
            authentification déléguée à Clerk et journalisation des accès sensibles.
          </p>

          <h2 className={h2}>10. Évolution de cette politique</h2>
          <p className={p}>
            La présente politique peut être modifiée pour refléter les évolutions du site ou de la
            réglementation. Toute version substantielle sera signalée sur cette page avec sa date
            de mise à jour.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
