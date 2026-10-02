import Link from "next/link";
import PublicShell from "@/components/PublicShell";

/**
 * Site-wide 404. Serves both unknown URLs and pages that call notFound() —
 * notably the admin area for non-admins, which must be indistinguishable from
 * a page that doesn't exist. No <title> here on purpose: the two cases stream
 * it in a different order, so the tab would differ. Both keep the root title.
 */
export default function NotFound() {
  return (
    <PublicShell>
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
          Erreur 404
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-3">
          Page introuvable
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/" className="text-secondary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </section>
    </PublicShell>
  );
}
