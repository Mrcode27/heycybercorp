"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "@/components/Icon";
import BuyPackageButton from "@/components/BuyPackageButton";
import CheckoutResultBanner from "@/components/CheckoutResultBanner";
import { formatCoursePrice, formatDuration, type Region } from "@/lib/format";

function levelBadge(level: string) {
  return level === "Avancé"
    ? "bg-error/10 text-error border-error/20"
    : level === "Intermédiaire"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-primary/10 text-primary border-primary/20";
}

/** Course landing page: overview, lesson list, price card + Stripe buy flow. */
export default function CourseDetail({ slug }: { slug: string }) {
  const detail = useQuery(api.courses.detail, { slug });

  if (detail === undefined) {
    return (
      <div className="glass-panel rounded-xl p-16 animate-pulse">
        <div className="h-4 w-32 bg-surface-variant rounded mb-6" />
        <div className="h-8 w-2/3 bg-surface-variant rounded mb-4" />
        <div className="h-4 w-full bg-surface-variant rounded" />
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="glass-panel rounded-xl p-16 text-center">
        <Icon name="search_off" className="text-error text-5xl mb-4" />
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
          Formation introuvable
        </h1>
        <p className="text-on-surface-variant mb-8">
          Ce cours n&apos;existe pas ou n&apos;est plus publié.
        </p>
        <Link
          href="/formations"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all"
        >
          <Icon name="arrow_back" className="text-sm" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const { course, lessons, owned, pkg } = detail;
  const region: Region = detail.region ?? "EUROPE";
  const totalSec = lessons.reduce((s, l) => s + (l.durationSec ?? 0), 0);
  const duration = formatDuration(totalSec);

  return (
    <>
      {/* Stripe redirects the buyer back here — the banner re-checks
          the payment with Stripe before claiming anything. */}
      <CheckoutResultBanner surface="glass-panel" spacing="mb-8" />

      <Link
        href="/formations"
        className="inline-flex items-center gap-2 font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest mb-8"
      >
        <Icon name="arrow_back" className="text-sm" />
        Catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: overview + lessons */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${levelBadge(
                course.level,
              )}`}
            >
              {course.level}
            </span>
            {owned && (
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                <Icon name="verified" className="text-[12px]" fill /> Possédé
              </span>
            )}
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-4">
            {course.title}
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg mb-8">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-4 mb-12 font-code-sm text-code-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <Icon name="play_lesson" className="text-primary text-lg" />
              {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
            </span>
            {duration && (
              <span className="flex items-center gap-2">
                <Icon name="schedule" className="text-primary text-lg" />
                {duration}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Icon name="all_inclusive" className="text-primary text-lg" />
              Accès à vie
            </span>
            <span className="flex items-center gap-2">
              <Icon name="workspace_premium" className="text-primary text-lg" />
              Certificat vérifiable inclus
            </span>
          </div>

          {/* Lessons */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">
              Programme
            </h2>
            <div className="h-px flex-grow bg-outline-variant/30" />
          </div>

          {lessons.length === 0 ? (
            <div className="glass-panel rounded-xl p-10 text-center">
              <Icon name="pending_actions" className="text-secondary text-4xl mb-3" />
              <p className="text-on-surface-variant">
                Le programme détaillé sera publié très prochainement.
              </p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {lessons.map((lesson, i) => {
                const accessible = owned || lesson.isPreview;
                const row = (
                  <div
                    className={`glass-panel rounded-xl px-5 py-4 flex items-center gap-4 ${
                      accessible ? "hover:border-primary/40 transition-colors" : "opacity-75"
                    }`}
                  >
                    <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums w-8">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-grow min-w-0">
                      <div className="text-on-surface font-medium truncate">{lesson.title}</div>
                      {lesson.description && (
                        <div className="text-on-surface-variant text-sm truncate">
                          {lesson.description}
                        </div>
                      )}
                    </div>
                    {lesson.isPreview && !owned && (
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-secondary/10 text-secondary border-secondary/20 whitespace-nowrap">
                        Aperçu gratuit
                      </span>
                    )}
                    {lesson.durationSec ? (
                      <span className="font-code-sm text-code-sm text-on-surface-variant whitespace-nowrap">
                        {formatDuration(lesson.durationSec)}
                      </span>
                    ) : null}
                    <Icon
                      name={accessible ? "play_circle" : "lock"}
                      className={accessible ? "text-primary" : "text-on-surface-variant"}
                    />
                  </div>
                );
                return (
                  <li key={lesson._id}>
                    {accessible ? (
                      <Link href={`/dashboard/formations/${course.slug}?lecon=${lesson._id}`}>
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Right: price / access card */}
        <div>
          <div className="glass-panel rounded-xl p-8 sticky top-28">
            {owned ? (
              <>
                <div className="font-label-mono text-label-mono text-primary uppercase tracking-widest mb-2">
                  Accès actif
                </div>
                <p className="text-on-surface-variant text-sm mb-6">
                  Vous possédez cette formation. Bon entraînement, opérateur.
                </p>
                <Link
                  href={`/dashboard/formations/${course.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all"
                >
                  <Icon name="play_arrow" fill />
                  Accéder au cours
                </Link>
              </>
            ) : pkg ? (
              <>
                <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-2">
                  Pack {pkg.name} · paiement unique
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface">
                    {formatCoursePrice(pkg.priceEur, pkg.priceXof, region)}
                  </span>
                </div>
                <div className="text-on-surface-variant text-sm mb-6">
                  soit{" "}
                  {formatCoursePrice(
                    pkg.priceEur,
                    pkg.priceXof,
                    region === "EUROPE" ? "AFRIQUE" : "EUROPE",
                  )}{" "}
                  · débloque toutes les formations {course.level}
                </div>

                <BuyPackageButton
                  packageId={pkg._id}
                  label="Débloquer ce pack"
                  className="w-full inline-flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all disabled:opacity-60"
                />

                <div className="mt-6 pt-6 border-t border-outline-variant/20 space-y-2 font-code-sm text-code-sm text-on-surface-variant">
                  <p className="flex items-center gap-2">
                    <Icon name="lock" className="text-sm text-primary" /> Paiement sécurisé
                    Stripe
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="credit_card" className="text-sm text-primary" /> Carte bancaire
                    et autres moyens proposés par Stripe
                  </p>
                  {region === "AFRIQUE" && (
                    <p className="flex items-start gap-2">
                      <Icon name="phone_iphone" className="text-sm text-secondary mt-0.5" />
                      Mobile Money (Orange/MTN/Wave) arrive bientôt — en attendant, le paiement
                      par carte est disponible.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-2">
                  Bientôt disponible
                </div>
                <p className="text-on-surface-variant text-sm">
                  Aucun pack ne couvre encore ce niveau. Revenez très prochainement.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
