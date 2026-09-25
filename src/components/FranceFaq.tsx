import Link from "next/link";

const questions = [
  {
    question: "Puis-je suivre une formation en cybersécurité depuis la France ?",
    answer: (
      <>
        Oui. Les parcours sont accessibles sur la plateforme heycybercorp. Consultez le
        <Link href="/formations" className="text-secondary underline ml-1">catalogue des formations</Link>
        {" "}pour voir les sujets et les niveaux actuellement proposés.
      </>
    ),
  },
  {
    question: "Où trouver le prix d'une formation pour la France ?",
    answer: (
      <>
        La <Link href="/tarifs" className="text-secondary underline">page Tarifs</Link> affiche les offres
        en euros lorsque la région Europe est sélectionnée. Vérifiez les détails de chaque offre avant de vous inscrire.
      </>
    ),
  },
  {
    question: "Quelle formation choisir si je débute en cybersécurité ?",
    answer: (
      <>
        Commencez par les fondamentaux de la sécurité informatique et des réseaux, puis comparez les
        prérequis indiqués dans le <Link href="/formations" className="text-secondary underline">catalogue</Link>.
      </>
    ),
  },
  {
    question: "Proposez-vous des formations en cybersécurité pour les entreprises en France ?",
    answer: (
      <>
        La <Link href="/entreprise" className="text-secondary underline">page Entreprise</Link> présente les
        parcours pour les équipes. Vous pouvez aussi <Link href="/contact" className="text-secondary underline">décrire votre besoin</Link>
        {" "}pour discuter d&apos;un programme adapté.
      </>
    ),
  },
];

export default function FranceFaq() {
  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" aria-labelledby="france-faq-title">
      <div className="max-w-3xl mb-10">
        <p className="font-label-mono text-primary uppercase tracking-widest mb-4">France · Formations</p>
        <h2 id="france-faq-title" className="font-headline-lg text-headline-xl text-on-surface mb-4">
          Questions fréquentes sur nos formations en France
        </h2>
        <p className="text-on-surface-variant">
          Les réponses pratiques pour choisir un parcours de cybersécurité depuis la France.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {questions.map(({ question, answer }) => (
          <article key={question} className="glass-panel rounded-xl border border-outline-variant/30 p-7">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4">{question}</h3>
            <p className="text-on-surface-variant">{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
