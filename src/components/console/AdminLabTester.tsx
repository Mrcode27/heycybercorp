"use client";

import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";
import AdminModal from "./AdminModal";
import CaseArtifact from "./CaseArtifact";
import DossierApp, { type DossierData } from "./DossierApp";
import {
  buildChallengeTutorial,
  buildPracticalTutorial,
  type LabTutorial,
  type TutorialAction,
} from "@/lib/adminLabTutorial";

export type AdminCasePreview = FunctionReturnType<typeof api.cases.adminList>[number];
export type AdminChallengePreview = FunctionReturnType<typeof api.labs.adminList>[number];
export type AdminTestTarget =
  | { kind: "practical"; item: AdminCasePreview }
  | { kind: "challenge"; item: AdminChallengePreview };

type TestMode = "free" | "guided";

export default function AdminLabTester({ target, onClose }: { target: AdminTestTarget; onClose: () => void }) {
  const [mode, setMode] = useState<TestMode | null>(null);
  const item = target.item;

  return (
    <AdminModal title={item.title} eyebrow="Session de test administrateur" icon={target.kind === "practical" ? "folder_special" : "flag"} onClose={onClose} wide escapeCloses={false}>
      {mode === null ? (
        <ModeChoice target={target} onChoose={setMode} />
      ) : (
        <div className="min-h-full bg-surface-container-lowest">
          <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 px-5 md:px-7 py-3 border-b border-outline-variant/30 bg-surface-container-low/95 backdrop-blur-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 font-label-mono text-label-mono uppercase tracking-wider text-primary">
              <Icon name="admin_panel_settings" className="text-sm" fill /> Test isolé
            </span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Aucun score, tentative ou progression ne sera enregistré.</span>
            <div className="md:ml-auto flex items-center gap-2">
              <button type="button" onClick={() => setMode("free")} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${mode === "free" ? "border-primary/40 bg-primary/10 text-primary" : "border-outline-variant/40 text-on-surface-variant"}`}><Icon name="visibility_off" className="text-sm mr-1" /> Sans guide</button>
              <button type="button" onClick={() => setMode("guided")} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${mode === "guided" ? "border-secondary/40 bg-secondary/10 text-secondary" : "border-outline-variant/40 text-on-surface-variant"}`}><Icon name="school" className="text-sm mr-1" /> Avec guide</button>
              <button type="button" onClick={() => setMode(null)} className="w-9 h-9 grid place-items-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface" aria-label="Changer le mode"><Icon name="restart_alt" /></button>
            </div>
          </div>
          {target.kind === "practical" ? <PracticalTest item={target.item} guided={mode === "guided"} /> : <ChallengeTest item={target.item} guided={mode === "guided"} />}
        </div>
      )}
    </AdminModal>
  );
}

function ModeChoice({ target, onChoose }: { target: AdminTestTarget; onChoose: (mode: TestMode) => void }) {
  const item = target.item;
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <div className="text-center max-w-2xl mx-auto mb-9">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl grid place-items-center border border-primary/20 bg-primary/10 text-primary"><Icon name="science" className="text-3xl" fill /></div>
        <p className="font-label-mono text-label-mono uppercase tracking-[0.18em] text-primary mb-2">Prévisualisation administrateur</p>
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-3">Comment voulez-vous tester ce lab ?</h3>
        <p className="text-on-surface-variant">Les deux modes ouvrent le contenu complet, même s’il est en brouillon ou normalement verrouillé par un pack.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ModeCard icon="visibility_off" title="Test réaliste" badge="Sans aide" description="Jouez exactement comme un étudiant : brief, pièces et validations, sans afficher les réponses." bullets={["Aucune solution visible", "Validation locale sans score", "Idéal pour contrôler la difficulté"]} onClick={() => onChoose("free")} />
        <ModeCard icon="school" title="Test guidé" badge="Tutoriel raisonné" description="Suivez la démarche complète d’un analyste : cadrage, hypothèses, commandes, observations et conclusion." bullets={["État d’esprit avant les outils", "Actions exactes et preuves attendues", "Solution révélée seulement à la fin"]} onClick={() => onChoose("guided")} featured />
      </div>

      <div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container/45 p-4 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
        <Icon name="info" className="text-secondary" />
        <span><strong className="text-on-surface">{target.kind === "practical" ? "Cas pratique" : "Challenge"}</strong> · {item.level} · {item.published ? "Publié" : "Brouillon"}</span>
        <span className="md:ml-auto font-code-sm text-code-sm">{target.kind === "practical" ? `${target.item.steps.reduce((sum, step) => sum + step.points, 0)} pts · ${target.item.steps.length} étape${target.item.steps.length > 1 ? "s" : ""}` : `${target.item.points} pts · flag unique`}</span>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, badge, description, bullets, onClick, featured = false }: { icon: string; title: string; badge: string; description: string; bullets: string[]; onClick: () => void; featured?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`group min-h-72 p-6 rounded-2xl border text-left transition-all hover:-translate-y-1 hover:shadow-xl ${featured ? "border-secondary/30 bg-secondary/5 hover:border-secondary/55" : "border-outline-variant/40 bg-surface-container/45 hover:border-primary/45"}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl grid place-items-center ${featured ? "bg-secondary/12 text-secondary" : "bg-primary/10 text-primary"}`}><Icon name={icon} className="text-2xl" fill /></div>
        <span className={`px-2.5 py-1 rounded-full border font-label-mono text-label-mono uppercase tracking-wider ${featured ? "border-secondary/25 text-secondary" : "border-outline-variant/40 text-on-surface-variant"}`}>{badge}</span>
      </div>
      <h4 className="font-headline-lg-mobile text-on-surface mb-2">{title}</h4>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-5">{description}</p>
      <ul className="space-y-2 mb-6">{bullets.map((bullet) => <li key={bullet} className="flex items-center gap-2 text-xs text-on-surface-variant"><Icon name="check_circle" className={featured ? "text-secondary text-base" : "text-primary text-base"} /> {bullet}</li>)}</ul>
      <span className={`inline-flex items-center gap-2 text-sm font-bold ${featured ? "text-secondary" : "text-primary"}`}>Lancer ce mode <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" /></span>
    </button>
  );
}

function PracticalTest({ item, guided }: { item: AdminCasePreview; guided: boolean }) {
  const hasWebOS = item.artifacts.some((artifact) => artifact.kind === "webos");
  const tutorial = useMemo(() => buildPracticalTutorial(item), [item]);
  const dossier = useMemo<DossierData>(() => ({
    title: item.title,
    signedIn: true,
    steps: item.steps.map((step) => ({
      _id: step._id,
      order: step.order,
      prompt: step.prompt,
      kind: step.kind,
      choices: step.choices,
      hint: step.hint ?? null,
      points: step.points,
      solved: false,
      attempts: 0,
      maxAttempts: step.kind === "choice" ? 3 : 40,
      reveal: null,
    })),
    adminPreview: {
      guided,
      solutions: Object.fromEntries(item.steps.map((step, index) => [String(step._id), {
        answer: step.answer,
        accept: step.accept ?? [],
        match: step.match ?? "exact",
        reveal: step.reveal ?? null,
        tutorial: tutorial.steps[index] ? {
          mindset: tutorial.steps[index].mindset,
          actions: tutorial.steps[index].actions,
          proof: tutorial.steps[index].proof,
          transfer: tutorial.steps[index].transfer,
        } : undefined,
      }])),
    },
  }), [guided, item, tutorial]);

  return (
    <div className={`grid ${guided ? "xl:grid-cols-[460px_minmax(0,1fr)]" : "grid-cols-1"} min-h-full`}>
      {guided && <TutorialPanel tutorial={tutorial} customGuide={item.guide} kind="practical" />}
      <main className="min-w-0 p-5 md:p-8 space-y-6">
        <section className="glass-card rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3"><Badge>{item.level}</Badge><span className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">{item.category} · ~{item.estimatedMinutes} min</span></div>
          <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">{item.title}</h3>
          <p className="text-on-surface-variant whitespace-pre-wrap">{item.setting}</p>
        </section>

        {item.artifacts.map((artifact) => <CaseArtifact key={artifact._id} artifact={artifact} dossier={dossier} />)}

        {!hasWebOS && (
          <section className="h-[720px] overflow-hidden rounded-xl border border-outline-variant/30 shadow-xl">
            <DossierApp dossier={dossier} />
          </section>
        )}
      </main>
    </div>
  );
}

function ChallengeTest({ item, guided }: { item: AdminChallengePreview; guided: boolean }) {
  const [flag, setFlag] = useState("");
  const [result, setResult] = useState<"ok" | "ko" | null>(null);
  const [hint, setHint] = useState(false);
  const tutorial = useMemo(() => buildChallengeTutorial(item), [item]);
  const check = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(flag.trim().toLowerCase() === item.flag.trim().toLowerCase() ? "ok" : "ko");
  };

  return (
    <div className={`grid ${guided ? "xl:grid-cols-[460px_minmax(0,1fr)]" : "grid-cols-1"} min-h-full`}>
      {guided && <TutorialPanel tutorial={tutorial} customGuide={item.guide} kind="challenge" />}
      <main className="p-6 md:p-12">
        <div className="max-w-3xl mx-auto glass-card rounded-2xl p-6 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div className="w-12 h-12 rounded-xl grid place-items-center bg-secondary/10 text-secondary"><Icon name={item.icon} className="text-2xl" fill /></div><div className="flex items-center gap-2"><span className="font-code-sm text-code-sm text-on-surface-variant">{item.points} pts</span><Badge>{item.level}</Badge></div></div>
          <p className="font-label-mono text-label-mono uppercase tracking-wider text-secondary mb-2">{item.category}</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface mb-3">{item.title}</h3>
          <p className="text-on-surface-variant mb-7">{item.summary}</p>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5 mb-5"><span className="block font-label-mono text-label-mono uppercase tracking-wider text-primary mb-3">Brief</span><p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">{item.brief}</p></div>
          {item.hint && (hint || guided ? <p className="rounded-lg border border-secondary/20 bg-secondary/5 p-4 text-sm text-on-surface-variant mb-5"><strong className="text-secondary">Indice — </strong>{item.hint}</p> : <button type="button" onClick={() => setHint(true)} className="inline-flex items-center gap-2 text-secondary text-sm font-bold mb-5"><Icon name="lightbulb" /> Afficher l’indice</button>)}
          <form onSubmit={check} className="space-y-3"><label className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">Soumettre le flag</label><div className="flex flex-col sm:flex-row gap-2"><input value={flag} onChange={(event) => { setFlag(event.target.value); setResult(null); }} className="flex-1 bg-field border border-outline-variant text-on-surface px-4 py-3 rounded-lg font-code-sm outline-none focus:border-primary" placeholder="HCL{...}" spellCheck={false} /><button type="submit" disabled={!flag.trim()} className="px-6 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50">Valider</button></div></form>
          {result === "ok" && <p className="mt-4 flex items-center gap-2 text-primary text-sm font-bold"><Icon name="check_circle" fill /> Correct — test réussi, aucun score enregistré.</p>}
          {result === "ko" && <p className="mt-4 flex items-center gap-2 text-error text-sm"><Icon name="cancel" /> Flag incorrect dans cette simulation.</p>}
        </div>
      </main>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="px-2.5 py-1 rounded border border-primary/25 text-primary font-label-mono text-label-mono uppercase tracking-wider">{children}</span>;
}

function TutorialPanel({ tutorial, customGuide, kind }: { tutorial: LabTutorial; customGuide?: string; kind: "practical" | "challenge" }) {
  return (
    <aside className="xl:sticky xl:top-[65px] xl:h-[calc(94vh-137px)] overflow-auto no-scrollbar border-r border-outline-variant/30 bg-surface-container/45">
      <header className="sticky top-0 z-10 p-5 border-b border-outline-variant/30 bg-surface-container/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-secondary mb-1"><Icon name="psychology" fill /><span className="font-label-mono text-label-mono uppercase tracking-[0.14em]">Manuel de raisonnement</span></div>
        <p className="text-xs text-on-surface-variant">Visible uniquement par l’administrateur · {kind === "practical" ? "Investigation guidée" : "Résolution guidée"}</p>
      </header>

      <div className="p-5 space-y-5">
        <section className="rounded-2xl border border-error/20 bg-error/5 p-4">
          <p className="flex items-center gap-2 font-label-mono text-label-mono uppercase tracking-wider text-error mb-2"><Icon name="crisis_alert" className="text-base" /> Comprendre le problème</p>
          <p className="text-sm text-on-surface leading-relaxed">{tutorial.problem}</p>
          <div className="mt-3 pt-3 border-t border-error/15"><strong className="block text-xs text-error mb-1">Pourquoi c’est important</strong><p className="text-xs text-on-surface-variant leading-relaxed">{tutorial.stakes}</p></div>
        </section>

        <section className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
          <p className="flex items-center gap-2 font-label-mono text-label-mono uppercase tracking-wider text-secondary mb-3"><Icon name="neurology" className="text-base" /> Se mettre dans la tête de l’analyste</p>
          <ul className="space-y-3">
            {tutorial.mentalModel.map((principle, index) => <li key={principle} className="flex gap-3 text-xs text-on-surface-variant leading-relaxed"><span className="w-6 h-6 shrink-0 rounded-lg grid place-items-center border border-secondary/25 text-secondary font-code-sm">{index + 1}</span><span>{principle}</span></li>)}
          </ul>
        </section>

        {customGuide && (
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-label-mono text-label-mono uppercase tracking-wider text-primary mb-2">Note de l’instructeur</p>
            <p className="whitespace-pre-wrap text-xs text-on-surface-variant leading-relaxed">{customGuide}</p>
          </section>
        )}

        <details className="group rounded-xl border border-outline-variant/30 bg-surface-container/55 overflow-hidden">
          <summary className="cursor-pointer list-none flex items-center gap-3 p-4 text-sm font-bold text-on-surface">
            <Icon name="map" className="text-primary" /><span className="flex-1">Mission et scénario complet</span><Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-4 pb-4 whitespace-pre-wrap text-xs text-on-surface-variant leading-relaxed">{tutorial.mission}</p>
        </details>

        <section>
          <p className="font-label-mono text-label-mono uppercase tracking-[0.14em] text-primary mb-3">Avant de chercher la réponse</p>
          <TutorialActions actions={tutorial.preparation} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3"><span className="font-label-mono text-label-mono uppercase tracking-[0.14em] text-secondary">Parcours de l’enquête</span><i className="h-px flex-1 bg-outline-variant/30" /></div>
          <div className="space-y-3">
            {tutorial.steps.map((step, index) => (
              <details key={`${index}-${step.title}`} className="group rounded-xl border border-outline-variant/30 bg-surface-container/65 overflow-hidden" open={index === 0}>
                <summary className="cursor-pointer list-none p-4 flex items-start gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-lg grid place-items-center bg-primary/10 border border-primary/25 text-primary font-code-sm">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1"><strong className="block text-sm text-on-surface mb-1">{step.title}</strong><span className="block text-xs text-on-surface-variant leading-relaxed">{step.question}</span></span>
                  <Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/20 pt-4">
                  <GuideBlock icon="psychology" label="Comment réfléchir" tone="secondary">{step.mindset}</GuideBlock>
                  <GuideBlock icon="science" label="Hypothèse à tester" tone="primary">{step.hypothesis}</GuideBlock>
                  <TutorialActions actions={step.actions} />
                  <GuideBlock icon="verified" label="Ce que cela prouve" tone="primary">{step.proof}</GuideBlock>
                  <GuideBlock icon="model_training" label="Réflexe pour la prochaine fois" tone="secondary">{step.transfer}</GuideBlock>
                  {step.answer && (
                    <details className="group/answer rounded-lg border border-outline-variant/35 bg-black/15 overflow-hidden">
                      <summary className="cursor-pointer list-none flex items-center gap-2 p-3 font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant"><Icon name="lock" className="text-sm" /><span className="flex-1">Vérifier seulement après votre conclusion</span><Icon name="expand_more" className="transition-transform group-open/answer:rotate-180" /></summary>
                      <div className="px-3 pb-3"><code className="block p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary break-words">{step.answer}</code></div>
                    </details>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function TutorialActions({ actions }: { actions: TutorialAction[] }) {
  return (
    <ol className="space-y-3">
      {actions.map((action, index) => (
        <li key={`${index}-${action.title}`} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
          <div className="flex gap-3"><span className="w-6 h-6 shrink-0 rounded-md grid place-items-center bg-on-surface/5 text-on-surface-variant font-code-sm">{index + 1}</span><div className="min-w-0"><strong className="block text-xs text-on-surface mb-1">{action.title}</strong><p className="text-xs text-on-surface-variant leading-relaxed">{action.instruction}</p></div></div>
          {action.command && <pre className="mt-3 p-3 rounded-lg border border-primary/15 bg-[#07110b] text-[11px] leading-relaxed text-primary whitespace-pre-wrap break-words overflow-x-auto"><code>{action.command}</code></pre>}
          {action.observe && <p className="mt-3 pl-3 border-l-2 border-secondary/35 text-[11px] text-on-surface-variant leading-relaxed"><strong className="text-secondary">À observer — </strong>{action.observe}</p>}
        </li>
      ))}
    </ol>
  );
}

function GuideBlock({ icon, label, tone, children }: { icon: string; label: string; tone: "primary" | "secondary"; children: React.ReactNode }) {
  return <div className={`rounded-lg border p-3 ${tone === "primary" ? "border-primary/18 bg-primary/4" : "border-secondary/18 bg-secondary/4"}`}><p className={`flex items-center gap-2 font-label-mono text-label-mono uppercase tracking-wider mb-1 ${tone === "primary" ? "text-primary" : "text-secondary"}`}><Icon name={icon} className="text-sm" /> {label}</p><div className="text-xs text-on-surface-variant leading-relaxed">{children}</div></div>;
}
