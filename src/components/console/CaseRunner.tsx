"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import CaseArtifact from "./CaseArtifact";
import { cleanConvexError } from "@/lib/errors";

type CaseData = NonNullable<FunctionReturnType<typeof api.cases.getCase>>;
type Step = CaseData["steps"][number];

/**
 * Plays one case: the scene, the evidence, then the questions in order.
 *
 * The client never holds an answer. Each submission is checked by
 * `cases.submitStep`, which returns only whether it was right — never how
 * close, never which option was wrong.
 */
export default function CaseRunner({ slug }: { slug: string }) {
  const data = useQuery(api.cases.getCase, { slug });

  if (data === undefined) {
    return (
      <div className="glass-card rounded-xl p-12 animate-pulse">
        <div className="h-4 w-40 bg-surface-variant rounded mb-6" />
        <div className="h-8 w-2/3 bg-surface-variant rounded mb-4" />
        <div className="h-3 w-full bg-surface-variant rounded" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="search_off" className="text-error text-5xl mb-4" />
        <h2 className="font-headline-lg-mobile text-on-surface mb-2">Cas introuvable</h2>
        <Link href="/dashboard/labs" className="text-primary hover:underline">
          ← Retour aux labs
        </Link>
      </div>
    );
  }

  if (!data.unlocked) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="lock" className="text-secondary text-5xl mb-4" />
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">
          {data.title}
        </h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-8">{data.summary}</p>
        <p className="font-code-sm text-code-sm text-on-surface-variant mb-6">
          Ce cas fait partie du pack {data.level}.
        </p>
        <Link
          href={data.signedIn ? "/tarifs" : "/connexion"}
          className="px-6 py-3 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          {data.signedIn ? "Débloquer ce pack" : "Se connecter"}
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    );
  }

  const solved = data.steps.filter((s) => s.solved).length;
  const total = data.steps.length;
  const done = total > 0 && solved === total;
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  const hasWebOS = data.artifacts.some((artifact) => artifact.kind === "webos");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/labs"
        className="inline-flex items-center gap-2 font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
      >
        <Icon name="arrow_back" className="text-sm" />
        Tous les cas
      </Link>

      {/* Scene */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm border-primary/30 text-primary">
            {data.level}
          </span>
          <span className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">
            {data.category} · ~{data.estimatedMinutes} min
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">{data.title}</h1>
        <p className="text-on-surface-variant whitespace-pre-wrap">{data.setting}</p>

        <div className="mt-6 pt-6 border-t border-outline-variant/20">
          <div className="flex justify-between font-code-sm text-code-sm text-on-surface-variant mb-1.5">
            <span>
              Étapes résolues : {solved}/{total}
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {done && (
        <div className="glass-card rounded-xl p-6 border-primary/50 flex items-start gap-4">
          <Icon name="workspace_premium" className="text-primary text-3xl shrink-0" fill />
          <div>
            <div className="font-headline-lg-mobile text-on-surface mb-1">Dossier clos</div>
            <p className="text-on-surface-variant text-sm">
              Toutes les étapes sont validées. Relisez les conséquences ci-dessous : c&apos;est là
              que se trouve la leçon, pas dans la bonne réponse.
            </p>
          </div>
        </div>
      )}

      {/* Evidence */}
      {data.artifacts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest text-primary flex items-center gap-2">
            <Icon name={hasWebOS ? "desktop_windows" : "inventory_2"} className="text-lg" />
            {hasWebOS ? "Environnement pratique" : "Pièces du dossier"}
          </h2>
          {data.artifacts.map((a) => (
            <CaseArtifact
              key={a._id}
              artifact={a}
              dossier={{ title: data.title, steps: data.steps, signedIn: data.signedIn }}
            />
          ))}
        </div>
      )}

      {/* A webOS case is deliberately self-contained: duplicating its questions
          below the full-screen machine made the simulation feel ornamental. */}
      {hasWebOS ? (
        <div className="glass-card rounded-xl px-5 py-4 flex items-start gap-3 border-primary/20">
          <Icon name="info" className="text-primary text-xl shrink-0" />
          <div>
            <p className="text-on-surface text-sm font-semibold">L’enquête se déroule dans le poste Linux.</p>
            <p className="text-on-surface-variant text-sm mt-1">
              Démarrez l’environnement ci-dessus. Les pièces, le terminal et le centre
              d’investigation y restent accessibles jusqu’à votre décision finale.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest text-primary">
            Investigation
          </h2>
          {data.steps.map((step, i) => (
            <StepCard key={step._id} step={step} index={i} total={total} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ step, index, total }: { step: Step; index: number; total: number }) {
  const submit = useMutation(api.cases.submitStep);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Held locally so the reveal appears immediately on success, before the
  // query round-trips.
  const [justSolved, setJustSolved] = useState<string | null>(null);

  const solved = step.solved || justSolved !== null;
  const reveal = step.reveal ?? justSolved;
  const remaining = step.maxAttempts - step.attempts;

  async function check(value: string) {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    setWrong(false);
    try {
      const r = await submit({ stepId: step._id as Id<"caseSteps">, answer: value });
      if (r.correct) {
        setJustSolved(r.reveal ?? "");
        setAnswer("");
      } else {
        setWrong(true);
      }
    } catch (err) {
      setError(cleanConvexError(err, "La validation a échoué."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`glass-card rounded-xl p-6 ${solved ? "border-primary/40" : ""}`}
      aria-label={`Étape ${index + 1} sur ${total}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">
          Étape {index + 1}/{total}
        </span>
        <span className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant">
          {step.points} pts
          {solved && <Icon name="check_circle" className="text-primary text-base" fill />}
        </span>
      </div>

      <p className="text-on-surface mb-4 whitespace-pre-wrap">{step.prompt}</p>

      {solved ? (
        reveal ? (
          <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
            <div className="font-label-mono text-label-mono uppercase tracking-wider text-primary mb-1">
              Conséquence
            </div>
            <p className="text-on-surface-variant text-sm whitespace-pre-wrap">{reveal}</p>
          </div>
        ) : (
          <p className="font-code-sm text-code-sm text-primary flex items-center gap-1.5">
            <Icon name="check_circle" className="text-sm" fill />
            Validé.
          </p>
        )
      ) : (
        <>
          {step.kind === "choice" ? (
            <div className="space-y-2">
              {step.choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy || remaining <= 0}
                  onClick={() => check(c)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-outline-variant/40 text-on-surface hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                check(answer);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Votre réponse…"
                spellCheck={false}
                autoComplete="off"
                disabled={remaining <= 0}
                className="flex-1 bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded font-code-sm text-code-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !answer.trim() || remaining <= 0}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50"
              >
                {busy ? "Vérification…" : "Valider"}
              </button>
            </form>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4">
            {step.hint &&
              (showHint ? (
                <p className="text-on-surface-variant text-sm">
                  <span className="text-secondary font-bold">Indice — </span>
                  {step.hint}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="font-code-sm text-code-sm text-secondary hover:underline inline-flex items-center gap-1.5"
                >
                  <Icon name="lightbulb" className="text-sm" />
                  Afficher l&apos;indice
                </button>
              ))}
            {step.attempts > 0 && remaining > 0 && (
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {remaining} tentative{remaining > 1 ? "s" : ""} restante
                {remaining > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {wrong && (
            <p className="mt-3 font-code-sm text-code-sm text-error flex items-center gap-1.5">
              <Icon name="cancel" className="text-sm" />
              Ce n&apos;est pas la bonne réponse. Relisez les pièces du dossier.
            </p>
          )}
          {remaining <= 0 && (
            <p className="mt-3 font-code-sm text-code-sm text-error">
              Plus de tentatives sur cette étape. Les suivantes restent ouvertes.
            </p>
          )}
          {error && (
            <p className="mt-3 font-code-sm text-code-sm text-error flex items-center gap-1.5">
              <Icon name="error" className="text-sm" />
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
