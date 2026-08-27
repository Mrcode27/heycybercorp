"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { formatDuration } from "@/lib/format";

/**
 * Turn a lesson URL into something playable.
 *
 * YouTube, Vimeo and Bunny Stream get their own iframe players; a plain file
 * URL goes into a <video> tag. Note the gap this leaves: an HLS playlist
 * (.m3u8) pasted as a bare URL only plays natively in Safari, so Bunny content
 * belongs here as an iframe embed rather than as a raw playlist link.
 */
function toPlayerSource(url: string): { type: "iframe" | "video"; src: string } {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  // Bunny Stream: both the /embed/ and /play/ forms name the same video, and
  // only /embed/ is meant to be framed.
  const bunny = url.match(
    /iframe\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([\w-]+)/,
  );
  if (bunny) {
    return {
      type: "iframe",
      src: `https://iframe.mediadelivery.net/embed/${bunny[1]}/${bunny[2]}`,
    };
  }
  return { type: "video", src: url };
}

/**
 * The student course player: lesson sidebar + video area + progress.
 * Access rules live server-side (lessons.playback / progress.record) —
 * this component only renders what the backend allows.
 */
export default function CoursePlayer({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detail = useQuery(api.courses.detail, { slug });
  const progressRows = useQuery(
    api.progress.forCourse,
    detail ? { courseId: detail.course._id } : "skip",
  );
  const record = useMutation(api.progress.record);

  const requested = searchParams.get("lecon") as Id<"lessons"> | null;
  const [currentId, setCurrentId] = useState<Id<"lessons"> | null>(requested);
  const [earnedCert, setEarnedCert] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const lastReport = useRef(0);

  const lessons = detail?.lessons ?? [];
  const lessonId =
    currentId && lessons.some((l) => l._id === currentId)
      ? currentId
      : (lessons[0]?._id ?? null);

  const playback = useQuery(api.lessons.playback, lessonId ? { lessonId } : "skip");

  // Keep the ?lecon= query param shareable/bookmarkable.
  useEffect(() => {
    if (lessonId && lessonId !== requested) {
      router.replace(`/dashboard/formations/${slug}?lecon=${lessonId}`, { scroll: false });
    }
  }, [lessonId, requested, router, slug]);

  if (detail === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-on-surface-variant font-code-sm">Chargement du cours…</p>
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="glass-card rounded-xl p-12 text-center max-w-md">
          <Icon name="search_off" className="text-error text-5xl mb-4" />
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
            Cours introuvable
          </h1>
          <Link href="/dashboard/formations" className="text-primary hover:underline">
            ← Retour à mes formations
          </Link>
        </div>
      </div>
    );
  }

  const { course, owned } = detail;
  const current = lessons.find((l) => l._id === lessonId) ?? null;
  const completedIds = new Set(
    (progressRows ?? []).filter((p) => p.completedAt).map((p) => p.lessonId),
  );
  const done = lessons.filter((l) => completedIds.has(l._id)).length;
  const pct = lessons.length === 0 ? 0 : Math.round((done / lessons.length) * 100);
  const currentIdx = current ? lessons.findIndex((l) => l._id === current._id) : -1;
  const canWatch = Boolean(current && (owned || current.isPreview));

  async function markComplete(lesson: NonNullable<typeof current>, seconds: number) {
    setMarking(true);
    try {
      const cert = await record({
        lessonId: lesson._id,
        secondsWatched: Math.round(seconds || lesson.durationSec || 0),
        completed: true,
      });
      if (cert) setEarnedCert(cert);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-margin-mobile md:px-8 py-4 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard/formations"
            className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
            aria-label="Retour"
          >
            <Icon name="arrow_back" />
          </Link>
          <div className="min-w-0">
            <div className="font-label-mono text-label-mono text-primary uppercase text-xs">
              Formation
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface truncate">
              {course.title}
            </h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="w-40 bg-surface-variant h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {pct}%
          </span>
        </div>
      </header>

      {/* Certificate earned banner */}
      {earnedCert && (
        <div className="mx-margin-mobile md:mx-8 mt-6 glass-card rounded-xl px-6 py-4 border-primary/50 flex flex-col sm:flex-row sm:items-center gap-4">
          <Icon name="workspace_premium" className="text-primary text-3xl" fill />
          <div className="flex-grow">
            <div className="font-bold text-on-surface">Formation terminée — félicitations !</div>
            <div className="text-on-surface-variant text-sm">
              Votre certificat vérifiable a été émis.
            </div>
          </div>
          <Link
            href={`/certificat/${earnedCert}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all"
          >
            Voir mon certificat
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
        {/* Video area */}
        <main className="p-margin-mobile md:p-8">
          {current === null ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Icon name="pending_actions" className="text-secondary text-5xl mb-4" />
              <h2 className="font-headline-lg-mobile text-on-surface mb-2">
                Aucune leçon publiée
              </h2>
              <p className="text-on-surface-variant">
                Le contenu de ce cours est en préparation. Revenez bientôt !
              </p>
            </div>
          ) : !canWatch ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Icon name="lock" className="text-error text-5xl mb-4" fill />
              <h2 className="font-headline-lg-mobile text-on-surface mb-2">Leçon verrouillée</h2>
              <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                Achetez cette formation pour débloquer toutes les leçons — paiement unique, accès
                à vie.
              </p>
              <Link
                href={`/formations/${course.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all"
              >
                <Icon name="shopping_cart" />
                Voir l&apos;offre
              </Link>
            </div>
          ) : (
            <>
              {/* Player */}
              <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-console aspect-video mb-6">
                {playback === undefined ? (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-code-sm">
                    Vérification de l&apos;accès…
                  </div>
                ) : !playback.allowed ? (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-code-sm">
                    Accès refusé.
                  </div>
                ) : playback.kind === "url" && playback.url ? (
                  (() => {
                    const source = toPlayerSource(playback.url);
                    return source.type === "iframe" ? (
                      <iframe
                        key={current._id}
                        src={source.src}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={current.title}
                      />
                    ) : (
                      <video
                        key={current._id}
                        src={source.src}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full"
                        onTimeUpdate={(e) => {
                          // Throttled fire-and-forget upsert; the server keeps the max.
                          const now = Date.now();
                          if (now - lastReport.current < 15000) return;
                          lastReport.current = now;
                          record({
                            lessonId: current._id,
                            secondsWatched: Math.round(e.currentTarget.currentTime),
                            completed: false,
                          }).catch(() => {});
                        }}
                        onEnded={(e) => markComplete(current, e.currentTarget.duration)}
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8">
                    <Icon name="cloud_upload" className="text-secondary text-5xl" />
                    <p className="text-on-surface font-medium">
                      {playback.kind === "azure"
                        ? "Vidéo en cours de téléversement sécurisé"
                        : "Contenu vidéo à venir"}
                    </p>
                    <p className="text-on-surface-variant text-sm max-w-sm">
                      Cette leçon sera lisible très bientôt. Vous pouvez déjà la marquer comme
                      terminée si vous l&apos;avez suivie ailleurs.
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson info + actions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="min-w-0">
                  <div className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs mb-1">
                    Leçon {String(currentIdx + 1).padStart(2, "0")} / {lessons.length}
                  </div>
                  <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
                    {current.title}
                  </h2>
                  {current.description && (
                    <p className="text-on-surface-variant">{current.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={marking || completedIds.has(current._id)}
                  onClick={() => markComplete(current, 0)}
                  className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 font-bold rounded-lg text-sm transition-all ${
                    completedIds.has(current._id)
                      ? "bg-primary/10 text-primary border border-primary/30 cursor-default"
                      : "bg-primary text-on-primary hover:brightness-110 disabled:opacity-60"
                  }`}
                >
                  <Icon name="check_circle" fill={completedIds.has(current._id)} />
                  {completedIds.has(current._id)
                    ? "Leçon terminée"
                    : marking
                      ? "Enregistrement…"
                      : "Marquer comme terminée"}
                </button>
              </div>

              {/* Prev / next */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={currentIdx <= 0}
                  onClick={() => setCurrentId(lessons[currentIdx - 1]._id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  <Icon name="chevron_left" />
                  Précédente
                </button>
                <button
                  type="button"
                  disabled={currentIdx >= lessons.length - 1}
                  onClick={() => setCurrentId(lessons[currentIdx + 1]._id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  Suivante
                  <Icon name="chevron_right" />
                </button>
              </div>
            </>
          )}
        </main>

        {/* Lessons sidebar */}
        <aside className="border-t lg:border-t-0 lg:border-l border-outline-variant/30 bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-lg-mobile text-on-surface">Programme</h3>
            <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
              {done}/{lessons.length}
            </span>
          </div>
          <div className="sm:hidden w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <ol className="flex flex-col gap-2">
            {lessons.map((lesson, i) => {
              const active = lesson._id === lessonId;
              const lessonDone = completedIds.has(lesson._id);
              const accessible = owned || lesson.isPreview;
              return (
                <li key={lesson._id}>
                  <button
                    type="button"
                    onClick={() => setCurrentId(lesson._id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "bg-primary/10 border border-primary/30 text-on-surface"
                        : "text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                        lessonDone
                          ? "bg-primary border-primary text-on-primary"
                          : "border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      {lessonDone ? (
                        <Icon name="check" className="text-sm" />
                      ) : (
                        <span className="font-code-sm text-[11px] tabular-nums">{i + 1}</span>
                      )}
                    </span>
                    <span className="flex-grow min-w-0 truncate text-sm">{lesson.title}</span>
                    {!accessible && (
                      <Icon name="lock" className="text-sm text-on-surface-variant shrink-0" />
                    )}
                    {lesson.durationSec ? (
                      <span className="font-code-sm text-[11px] text-on-surface-variant shrink-0">
                        {formatDuration(lesson.durationSec)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
