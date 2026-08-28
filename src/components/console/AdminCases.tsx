"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import CaseArtifact from "./CaseArtifact";
import { cleanConvexError } from "@/lib/errors";

const input =
  "w-full bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded text-sm outline-none focus:border-primary transition-colors";
const label = "font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant";

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type ArtifactKind =
  | "email" | "log" | "terminal" | "file" | "table" | "http" | "image" | "webos";

type ArtifactDraft = { kind: ArtifactKind; label: string; content: string };
type StepDraft = {
  prompt: string;
  kind: "text" | "choice";
  choices: string[];
  answer: string;
  accept: string;
  match: "exact" | "contains" | "keywords";
  hint: string;
  reveal: string;
  points: number;
};

type Draft = {
  title: string;
  summary: string;
  setting: string;
  level: Level;
  category: string;
  icon: string;
  estimatedMinutes: number;
  isFree: boolean;
  published: boolean;
  artifacts: ArtifactDraft[];
  steps: StepDraft[];
};

const EMPTY: Draft = {
  title: "",
  summary: "",
  setting: "",
  level: "Débutant",
  category: "Phishing",
  icon: "mail",
  estimatedMinutes: 10,
  isFree: false,
  published: false,
  artifacts: [],
  steps: [],
};

const NEW_STEP: StepDraft = {
  prompt: "",
  kind: "text",
  choices: [],
  answer: "",
  accept: "",
  match: "exact",
  hint: "",
  reveal: "",
  points: 25,
};

/** Placeholder bodies, so an author sees the expected shape of each type. */
const ARTIFACT_TEMPLATE: Record<ArtifactKind, string> = {
  email:
    "From: service@rapidcolis-suivi.info\nTo: vous@exemple.fr\nSubject: Votre colis est en attente\nReturn-Path: bounce@mail-out-42.xyz\nReceived-SPF: fail\n\nBonjour,\n\nVotre colis n'a pas pu être livré…",
  log: "03:11:02 sshd[2201]: Failed password for admin from 10.42.7.19\n03:12:48 sshd[2240]: Accepted password for admin from 10.42.7.19",
  terminal: JSON.stringify(
    {
      user: "analyste",
      host: "poste-soc",
      cwd: "/var/log",
      allowed: ["ls", "cat", "grep", "wc", "head", "tail"],
      files: { "auth.log": "…", "notes.txt": "…" },
    },
    null,
    2,
  ),
  file: JSON.stringify({ "src/config.js": "// …", ".env": "API_KEY=…" }, null, 2),
  table: JSON.stringify(
    { columns: ["Heure", "Source", "Destination"], rows: [["03:11", "10.0.0.4", "8.8.8.8"]] },
    null,
    2,
  ),
  http: "HTTP/1.1 200 OK\nServer: nginx/1.18.0\nX-Powered-By: PHP/7.4.3",
  image: "/cases/exemple.png",
  webos: JSON.stringify(
    {
      user: "analyste",
      host: "srv-app",
      cwd: "/var/log",
      apps: ["terminal", "files", "monitor"],
      openOnStart: ["question.txt"],
      allowed: ["ls", "cat", "grep", "wc", "head", "tail", "whoami", "pwd", "tree"],
      files: { "question.txt": "Votre mission…", "auth.log": "…" },
    },
    null,
    2,
  ),
};

/**
 * Case authoring. A case is written here, not in code — otherwise every new
 * scenario needs a developer, and the content never gets written.
 *
 * Saving replaces the case wholesale (`cases.adminSave`), which also clears
 * student progress on it. That is deliberate: after rewording a question there
 * is no honest way to decide whether a previous answer still counts.
 */
export default function AdminCases() {
  const cases = useQuery(api.cases.adminList, {});
  const save = useMutation(api.cases.adminSave);
  const remove = useMutation(api.cases.adminRemove);

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<Id<"cases"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function reset() {
    setDraft(EMPTY);
    setEditing(null);
    setError(null);
    setPreview(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({
        caseId: editing ?? undefined,
        title: draft.title,
        summary: draft.summary,
        setting: draft.setting,
        level: draft.level,
        category: draft.category,
        icon: draft.icon,
        estimatedMinutes: draft.estimatedMinutes,
        isFree: draft.isFree,
        published: draft.published,
        artifacts: draft.artifacts,
        steps: draft.steps.map((s) => ({
          prompt: s.prompt,
          kind: s.kind,
          choices: s.kind === "choice" ? s.choices.filter((c) => c.trim()) : [],
          answer: s.answer,
          accept: s.accept
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          match: s.match,
          hint: s.hint.trim() || undefined,
          reveal: s.reveal.trim() || undefined,
          points: s.points,
        })),
      });
      reset();
    } catch (err) {
      setError(cleanConvexError(err, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon name={editing ? "edit" : "add_circle"} className="text-primary" fill />
            <h3 className="font-headline-lg-mobile text-on-surface">
              {editing ? "Modifier le cas" : "Nouveau cas"}
            </h3>
          </div>
          {draft.artifacts.length > 0 && (
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="font-code-sm text-code-sm text-secondary hover:underline"
            >
              {preview ? "Masquer" : "Prévisualiser"} les pièces
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={label}>Titre</label>
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className={input}
              placeholder="Le code à 6 chiffres"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={label}>Catégorie</label>
            <input
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              className={input}
              placeholder="Phishing · Analyse de logs · Forensic"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={label}>Résumé (visible même verrouillé)</label>
          <input
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
            className={input}
            placeholder="Une phrase qui donne envie sans rien dévoiler."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={label}>Mise en situation</label>
          <textarea
            value={draft.setting}
            onChange={(e) => set("setting", e.target.value)}
            rows={4}
            className={input}
            placeholder="03h14. Un salarié signale un message suspect…"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className={label}>Niveau</label>
            <select
              value={draft.level}
              onChange={(e) => set("level", e.target.value as Level)}
              className={input}
            >
              <option>Débutant</option>
              <option>Intermédiaire</option>
              <option>Avancé</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={label}>Icône</label>
            <input
              value={draft.icon}
              onChange={(e) => set("icon", e.target.value)}
              className={input}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={label}>Durée (min)</label>
            <input
              type="number"
              min={1}
              value={draft.estimatedMinutes}
              onChange={(e) => set("estimatedMinutes", Number(e.target.value))}
              className={input}
              required
            />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-on-surface text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isFree}
                onChange={(e) => set("isFree", e.target.checked)}
                className="w-4 h-4"
              />
              Accès libre
            </label>
            <label className="flex items-center gap-2 text-on-surface text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => set("published", e.target.checked)}
                className="w-4 h-4"
              />
              Publié
            </label>
          </div>
        </div>

        {/* Artifacts */}
        <div className="space-y-3 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <h4 className={label}>Pièces du dossier ({draft.artifacts.length})</h4>
            <select
              value=""
              onChange={(e) => {
                const kind = e.target.value as ArtifactKind;
                if (!kind) return;
                set("artifacts", [
                  ...draft.artifacts,
                  { kind, label: kind, content: ARTIFACT_TEMPLATE[kind] },
                ]);
              }}
              className="bg-field border border-outline-variant text-on-surface px-3 py-1.5 rounded text-sm"
            >
              <option value="">+ Ajouter une pièce…</option>
              {(
                ["webos", "email", "log", "terminal", "file", "table", "http", "image"] as ArtifactKind[]
              ).map(
                (k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ),
              )}
            </select>
          </div>

          {draft.artifacts.map((a, i) => (
            <div key={i} className="border border-outline-variant/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-code-sm text-code-sm text-secondary uppercase">{a.kind}</span>
                <input
                  value={a.label}
                  onChange={(e) => {
                    const next = [...draft.artifacts];
                    next[i] = { ...a, label: e.target.value };
                    set("artifacts", next);
                  }}
                  className={`${input} flex-1`}
                  placeholder="Libellé affiché"
                />
                <button
                  type="button"
                  aria-label="Supprimer la pièce"
                  onClick={() => set("artifacts", draft.artifacts.filter((_, j) => j !== i))}
                  className="text-on-surface-variant hover:text-error transition-colors"
                >
                  <Icon name="delete" />
                </button>
              </div>
              <textarea
                value={a.content}
                onChange={(e) => {
                  const next = [...draft.artifacts];
                  next[i] = { ...a, content: e.target.value };
                  set("artifacts", next);
                }}
                rows={6}
                className={`${input} font-code-sm`}
              />
            </div>
          ))}

          {preview && (
            <div className="space-y-3 pt-2">
              {draft.artifacts.map((a, i) => (
                <CaseArtifact key={i} artifact={{ _id: String(i), ...a }} />
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <h4 className={label}>Étapes ({draft.steps.length})</h4>
            <button
              type="button"
              onClick={() => set("steps", [...draft.steps, { ...NEW_STEP }])}
              className="font-code-sm text-code-sm text-secondary hover:underline"
            >
              + Ajouter une étape
            </button>
          </div>

          {draft.steps.map((s, i) => (
            <div key={i} className="border border-outline-variant/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  Étape {i + 1}
                </span>
                <div className="flex-1" />
                <select
                  value={s.kind}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[i] = { ...s, kind: e.target.value as "text" | "choice" };
                    set("steps", next);
                  }}
                  className="bg-field border border-outline-variant text-on-surface px-2 py-1 rounded text-sm"
                >
                  <option value="text">Réponse libre</option>
                  <option value="choice">Choix multiple</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={s.points}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[i] = { ...s, points: Number(e.target.value) };
                    set("steps", next);
                  }}
                  className="w-20 bg-field border border-outline-variant text-on-surface px-2 py-1 rounded text-sm"
                />
                <button
                  type="button"
                  aria-label="Supprimer l'étape"
                  onClick={() => set("steps", draft.steps.filter((_, j) => j !== i))}
                  className="text-on-surface-variant hover:text-error transition-colors"
                >
                  <Icon name="delete" />
                </button>
              </div>

              <textarea
                value={s.prompt}
                onChange={(e) => {
                  const next = [...draft.steps];
                  next[i] = { ...s, prompt: e.target.value };
                  set("steps", next);
                }}
                rows={2}
                className={input}
                placeholder="La question posée à l'étudiant"
                required
              />

              {s.kind === "choice" && (
                <textarea
                  value={s.choices.join("\n")}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[i] = { ...s, choices: e.target.value.split("\n") };
                    set("steps", next);
                  }}
                  rows={4}
                  className={`${input} font-code-sm`}
                  placeholder="Une option par ligne. Les mauvaises doivent être plausibles."
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <input
                    value={s.answer}
                    onChange={(e) => {
                      const next = [...draft.steps];
                      next[i] = { ...s, answer: e.target.value };
                      set("steps", next);
                    }}
                    className={`${input} font-code-sm`}
                    placeholder="Réponse attendue (jamais envoyée au navigateur)"
                    required
                  />
                  <select
                    value={s.match}
                    onChange={(e) => {
                      const next = [...draft.steps];
                      next[i] = { ...s, match: e.target.value as StepDraft["match"] };
                      set("steps", next);
                    }}
                    className={input}
                  >
                    <option value="exact">Exact — valeur précise (IP, heure) · tolère une faute de frappe</option>
                    <option value="keywords">Mots-clés — chaque ligne doit apparaître · pour une phrase</option>
                    <option value="contains">Contient — la réponse inclut la valeur attendue</option>
                  </select>
                  <textarea
                    value={s.accept}
                    onChange={(e) => {
                      const next = [...draft.steps];
                      next[i] = { ...s, accept: e.target.value };
                      set("steps", next);
                    }}
                    rows={2}
                    className={`${input} font-code-sm`}
                    placeholder={
                      s.match === "keywords"
                        ? "Mots-clés supplémentaires requis, un par ligne (des racines suffisent : partag)"
                        : "Autres formulations acceptées, une par ligne"
                    }
                  />
                </div>
                <input
                  value={s.hint}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[i] = { ...s, hint: e.target.value };
                    set("steps", next);
                  }}
                  className={input}
                  placeholder="Indice (optionnel)"
                />
              </div>

              <textarea
                value={s.reveal}
                onChange={(e) => {
                  const next = [...draft.steps];
                  next[i] = { ...s, reveal: e.target.value };
                  set("steps", next);
                }}
                rows={2}
                className={input}
                placeholder="Conséquence révélée après la bonne réponse — c'est là qu'est la leçon."
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="font-code-sm text-code-sm text-error flex items-center gap-1.5">
            <Icon name="error" className="text-sm" />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy || draft.steps.length === 0}
            className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-60"
          >
            {busy ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer le cas"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 rounded-lg font-bold border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all"
            >
              Annuler
            </button>
          )}
        </div>
        {editing && (
          <p className="font-code-sm text-code-sm text-on-surface-variant">
            ⚠ Enregistrer remplace les pièces et les étapes, et remet à zéro la progression des
            étudiants sur ce cas.
          </p>
        )}
      </form>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-outline-variant/30">
          <Icon name="folder_open" className="text-secondary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">
            Cas existants {cases ? `(${cases.length})` : ""}
          </h3>
        </div>

        {cases === undefined ? (
          <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
        ) : cases.length === 0 ? (
          <p className="p-6 text-on-surface-variant">Aucun cas pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
                  <th className="p-4">Cas</th>
                  <th className="p-4">Niveau</th>
                  <th className="p-4">Pièces / étapes</th>
                  <th className="p-4">Joueurs</th>
                  <th className="p-4">État</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {cases.map((c) => (
                  <tr key={c._id} className="border-t border-outline-variant/20">
                    <td className="p-4">
                      <div className="text-on-surface">{c.title}</div>
                      <div className="font-code-sm text-code-sm text-on-surface-variant">
                        {c.category} · /{c.slug}
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{c.level}</td>
                    <td className="p-4 text-on-surface-variant tabular-nums">
                      {c.artifacts.length} / {c.steps.length}
                    </td>
                    <td className="p-4 text-on-surface-variant tabular-nums">{c.players}</td>
                    <td className="p-4">
                      <span
                        className={`font-code-sm text-code-sm ${
                          c.published ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {c.published ? "Publié" : "Brouillon"}
                        {c.isFree && " · libre"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          aria-label={`Modifier ${c.title}`}
                          onClick={() => {
                            setEditing(c._id);
                            setDraft({
                              title: c.title,
                              summary: c.summary,
                              setting: c.setting,
                              level: c.level,
                              category: c.category,
                              icon: c.icon,
                              estimatedMinutes: c.estimatedMinutes,
                              isFree: c.isFree,
                              published: c.published,
                              artifacts: c.artifacts.map((a) => ({
                                kind: a.kind,
                                label: a.label,
                                content: a.content,
                              })),
                              steps: c.steps.map((s) => ({
                                prompt: s.prompt,
                                kind: s.kind,
                                choices: s.choices,
                                answer: s.answer,
                                accept: (s.accept ?? []).join("\n"),
                                match: s.match ?? "exact",
                                hint: s.hint ?? "",
                                reveal: s.reveal ?? "",
                                points: s.points,
                              })),
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer ${c.title}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Supprimer « ${c.title} » ?\n\nLes pièces, les étapes et la progression de ${c.players} étudiant(s) seront supprimées. Action irréversible.`,
                              )
                            ) {
                              remove({ caseId: c._id });
                            }
                          }}
                          className="text-on-surface-variant hover:text-error transition-colors"
                        >
                          <Icon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
