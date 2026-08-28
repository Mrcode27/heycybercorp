"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";
import type { TutorialAction } from "@/lib/adminLabTutorial";
import styles from "./DossierApp.module.css";

type CaseData = NonNullable<FunctionReturnType<typeof api.cases.getCase>>;
export type DossierStep = CaseData["steps"][number];

export type DossierData = {
  title: string;
  steps: readonly DossierStep[];
  signedIn?: boolean;
  adminPreview?: {
    guided: boolean;
    solutions: Record<string, AdminSolution>;
  };
};

type AdminSolution = {
  answer: string;
  accept: string[];
  match: "exact" | "contains" | "keywords";
  reveal?: string | null;
  tutorial?: {
    mindset: string;
    actions: TutorialAction[];
    proof: string;
    transfer: string;
  };
};

function normalise(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}\s@._:/-]/gu, " ").replace(/\s+/g, " ").trim();
}

function distance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

function previewMatches(value: string, solution: AdminSolution) {
  const reply = normalise(value);
  const candidates = [solution.answer, ...solution.accept].map(normalise).filter(Boolean);
  if (!reply) return false;
  if (solution.match === "keywords") return candidates.length > 0 && candidates.every((candidate) => reply.includes(candidate));
  if (solution.match === "contains") return candidates.some((candidate) => reply.includes(candidate));
  return candidates.some((candidate) => reply === candidate || (Math.floor(candidate.length / 8) > 0 && distance(reply, candidate) <= Math.floor(candidate.length / 8)));
}

/** The complete investigation workflow, kept inside the simulated machine. */
export default function DossierApp({ dossier }: { dossier: DossierData }) {
  const [adminSolved, setAdminSolved] = useState<Set<string>>(() => new Set());
  const solved = dossier.steps.filter((step) => step.solved || adminSolved.has(String(step._id))).length;
  const total = dossier.steps.length;
  const done = total > 0 && solved === total;
  const progress = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.caseIcon}><Icon name="policy" fill /></div>
          <div className={styles.caseIdentity}>
            <p><span /> DOSSIER ACTIF · CONFIDENTIEL</p>
            <h2>{dossier.title}</h2>
          </div>
          <div className={styles.score}>
            <strong>{solved}<span>/{total}</span></strong>
            <small>OBJECTIFS</small>
          </div>
        </div>
        <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
        <div className={styles.progressMeta}><span>Progression de l’enquête</span><strong>{progress}%</strong></div>

        {done && (
          <div className={styles.completeBanner}>
            <Icon name="workspace_premium" fill />
            <div><strong>Dossier clos avec succès</strong><span>Les conclusions et conséquences sont maintenant consignées.</span></div>
          </div>
        )}
        {dossier.signedIn === false && (
          <div className={styles.authBanner}>
            <Icon name="lock" /><span>Mode consultation : reconnectez-vous depuis la page du cas pour soumettre.</span>
          </div>
        )}
      </header>

      <main className={styles.steps}>
        <div className={styles.sectionLabel}><span>PLAN D’INVESTIGATION</span><i /></div>
        {dossier.steps.map((step, index) => (
          <StepBlock key={step._id} step={step} index={index} total={total} signedIn={dossier.signedIn !== false} adminPreview={dossier.adminPreview} adminSolved={adminSolved.has(String(step._id))} onAdminSolved={() => setAdminSolved((current) => new Set(current).add(String(step._id)))} />
        ))}
      </main>
    </div>
  );
}

function StepBlock({ step, index, total, signedIn, adminPreview, adminSolved, onAdminSolved }: {
  step: DossierStep;
  index: number;
  total: number;
  signedIn: boolean;
  adminPreview?: DossierData["adminPreview"];
  adminSolved: boolean;
  onAdminSolved: () => void;
}) {
  const submit = useMutation(api.cases.submitStep);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [justSolved, setJustSolved] = useState<string | null>(null);

  const solution = adminPreview?.solutions[String(step._id)];
  const solved = step.solved || adminSolved || justSolved !== null;
  const reveal = step.reveal ?? justSolved ?? (adminSolved ? solution?.reveal ?? null : null);
  const remaining = step.maxAttempts - step.attempts;
  const open = signedIn && remaining > 0;

  async function check(value: string) {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    setWrong(false);
    if (solution) {
      const correct = previewMatches(value, solution);
      if (correct) {
        setJustSolved(solution.reveal ?? "Réponse validée en mode test administrateur.");
        onAdminSolved();
        setAnswer("");
      } else {
        setWrong(true);
      }
      setBusy(false);
      return;
    }
    try {
      const result = await submit({ stepId: step._id as Id<"caseSteps">, answer: value });
      if (result.correct) {
        setJustSolved(result.reveal ?? "");
        setAnswer("");
      } else {
        setWrong(true);
      }
    } catch (cause) {
      setError(cleanConvexError(cause, "La validation a échoué."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.step} ${solved ? styles.stepSolved : ""}`} aria-label={`Objectif ${index + 1} sur ${total}`}>
      <aside className={styles.timeline}>
        <span>{solved ? <Icon name="check" /> : String(index + 1).padStart(2, "0")}</span>
        {index < total - 1 && <i />}
      </aside>
      <div className={styles.stepBody}>
        <div className={styles.stepMeta}>
          <span>OBJECTIF {String(index + 1).padStart(2, "0")}</span>
          <span><Icon name="stars" /> {step.points} POINTS</span>
        </div>
        <p className={styles.prompt}>{step.prompt}</p>

        {adminPreview?.guided && solution && !solved && (
          <div className={styles.adminSolution}>
            <div><Icon name="psychology" fill /><span>COACH D’INVESTIGATION</span></div>
            {solution.tutorial ? (
              <>
                <p className={styles.coachMindset}><strong>Réflexe</strong><span>{solution.tutorial.mindset}</span></p>
                <ol className={styles.coachActions}>
                  {solution.tutorial.actions.map((action, actionIndex) => (
                    <li key={`${actionIndex}-${action.title}`}>
                      <span>{actionIndex + 1}</span>
                      <div><strong>{action.title}</strong><p>{action.instruction}</p>{action.command && <code>{action.command}</code>}{action.observe && <small><b>À observer :</b> {action.observe}</small>}</div>
                    </li>
                  ))}
                </ol>
                <p className={styles.coachProof}><strong>Ce que cela prouve</strong><span>{solution.tutorial.proof}</span></p>
                <p className={styles.coachTransfer}><strong>À retenir</strong><span>{solution.tutorial.transfer}</span></p>
              </>
            ) : <p><span>Construisez d’abord une observation vérifiable à partir des pièces.</span></p>}
            <details className={styles.coachAnswer}>
              <summary>Vérifier la réponse après l’analyse</summary>
              <code>{solution.answer}</code>
              {solution.accept.length > 0 && <small>Également accepté : {solution.accept.join(" · ")}</small>}
            </details>
          </div>
        )}

        {solved ? (
          reveal ? (
            <div className={styles.reveal}>
              <div><Icon name="verified" fill /><span>ANALYSE VALIDÉE</span></div>
              <p>{reveal}</p>
            </div>
          ) : (
            <p className={styles.validated}><Icon name="check_circle" fill /> Objectif validé.</p>
          )
        ) : (
          <>
            {step.kind === "choice" ? (
              <div className={styles.choices}>
                {step.choices.map((choice, choiceIndex) => (
                  <button key={choice} type="button" disabled={busy || !open} onClick={() => check(choice)}>
                    <span>{String.fromCharCode(65 + choiceIndex)}</span><p>{choice}</p><Icon name="arrow_forward" />
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); check(answer); }} className={styles.answerForm}>
                <div><Icon name="terminal" /><input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Saisissez votre conclusion…" spellCheck={false} autoComplete="off" disabled={!open} /></div>
                <button type="submit" disabled={busy || !answer.trim() || !open}>{busy ? "Vérification…" : "Soumettre"}<Icon name="arrow_forward" /></button>
              </form>
            )}

            <div className={styles.stepFooter}>
              {step.hint && (showHint ? (
                <p><Icon name="lightbulb" /><span><strong>INDICE</strong>{step.hint}</span></p>
              ) : (
                <button type="button" onClick={() => setShowHint(true)}><Icon name="lightbulb" /> Afficher un indice</button>
              ))}
              <span className={styles.attempts}><Icon name="refresh" /> {remaining} tentative{remaining > 1 ? "s" : ""}</span>
            </div>

            {wrong && <p className={styles.error}><Icon name="error" /> Réponse non validée. Reprenez l’analyse des pièces.</p>}
            {remaining <= 0 && <p className={styles.error}><Icon name="block" /> Limite atteinte pour cet objectif.</p>}
            {error && <p className={styles.error}><Icon name="error" /> {error}</p>}
          </>
        )}
      </div>
    </section>
  );
}
