"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "@/components/Icon";
import { formatDate } from "@/lib/format";

/** Renders the diploma (screen + print) or the "invalid code" state. */
export default function CertificateView({ code }: { code: string }) {
  const cert = useQuery(api.certificates.verify, { code });

  if (cert === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-on-surface-variant font-code-sm">Vérification du certificat…</p>
      </div>
    );
  }

  if (cert === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 cyber-grid">
        <div className="glass-card rounded-xl p-12 text-center max-w-md">
          <Icon name="gpp_bad" className="text-error text-5xl mb-4" fill />
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
            Certificat non reconnu
          </h1>
          <p className="text-on-surface-variant mb-2">
            Le code <span className="font-code-sm text-error">{code}</span>{" "}
            ne correspond à aucun certificat émis par heycybercorp.
          </p>
          <p className="text-on-surface-variant text-sm mb-8">
            Vérifiez la saisie ou contactez la personne qui vous l&apos;a transmis.
          </p>
          <Link href="/" className="text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 cyber-grid print:bg-white print:p-0">
      {/* Screen-only toolbar */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/"
          className="font-headline-lg text-headline-lg-mobile font-bold text-primary tracking-tighter"
        >
          heycybercorp
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 font-code-sm text-code-sm text-primary">
            <Icon name="verified_user" className="text-sm" fill />
            Certificat authentique
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all"
          >
            <Icon name="print" className="text-sm" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* The diploma */}
      <div className="max-w-3xl mx-auto rounded-2xl border-2 border-primary/40 bg-surface-container-lowest p-10 md:p-16 text-center relative overflow-hidden print:border-emerald-700 print:bg-white print:text-black">
        <div className="absolute inset-0 cyber-grid-dots opacity-40 pointer-events-none print:hidden" />
        <div className="relative">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-primary mb-6 print:border-emerald-700 print:text-emerald-700">
            <Icon name="workspace_premium" className="text-4xl" fill />
          </div>

          <div className="font-label-mono text-label-mono uppercase tracking-[0.3em] text-on-surface-variant mb-2 print:text-gray-600">
            Certificat de réussite
          </div>
          <div className="font-headline-lg text-headline-lg-mobile text-primary font-bold tracking-tighter mb-10 print:text-emerald-700">
            heycybercorp — Académie de Cyberdéfense
          </div>

          <p className="text-on-surface-variant mb-3 print:text-gray-600">Décerné à</p>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-8 print:text-black">
            {cert.studentName}
          </h1>

          <p className="text-on-surface-variant mb-3 print:text-gray-600">
            pour avoir complété avec succès la formation
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 print:text-black">
            {cert.courseTitle}
          </h2>
          {cert.courseLevel && (
            <p className="font-label-mono text-label-mono uppercase tracking-widest text-secondary mb-10 print:text-gray-700">
              Niveau {cert.courseLevel}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 pt-8 border-t border-outline-variant/30 print:border-gray-300">
            <div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant print:text-gray-500">
                Date d&apos;émission
              </div>
              <div className="text-on-surface font-medium print:text-black">
                {formatDate(cert.issuedAt)}
              </div>
            </div>
            <div>
              <div className="font-label-mono text-xs uppercase text-on-surface-variant print:text-gray-500">
                Code de vérification
              </div>
              <div className="font-code-sm text-primary tabular-nums print:text-emerald-700">
                {cert.code}
              </div>
            </div>
          </div>

          <p className="mt-8 font-code-sm text-code-sm text-on-surface-variant print:text-gray-500">
            Authenticité vérifiable sur heycybercorp.fr/certificat/{cert.code}
          </p>
        </div>
      </div>
    </div>
  );
}
